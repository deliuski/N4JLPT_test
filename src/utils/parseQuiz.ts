import { CustomQuestion } from "../types";

export interface ParseResult {
  questions: CustomQuestion[];
  error: string | null;
}

/**
 * Parses a bulk-pasted quiz block (grammar / vocabulary) into structured questions.
 *
 * Expected format:
 *   1. <question text, may contain _______>
 *    option a
 *    option b
 *    option c
 *    option d
 *
 *   2. ...
 *
 *   Answer Key:
 *
 *   Question 1: 3 (optional note)
 *   Question 2: 4 (...)
 *
 * The answer number is 1-based and is converted to a 0-based answerIndex.
 * Validation is strict: every question must have a matching Answer Key entry,
 * every Answer Key entry must point at a real option, and there must be no
 * orphan answers. On any mismatch the whole block is rejected with an error so
 * the caller can surface it in that section (no partial save).
 */
export function parseQuizText(raw: string): ParseResult {
  const text = raw.trim();
  if (!text) return { questions: [], error: null };

  // Split the questions from the answer key section.
  const akSplit = text.split(/answer\s*key\s*:?/i);
  if (akSplit.length < 2) {
    return {
      questions: [],
      error: 'Answer Key хэсэг олдсонгүй. Асуултуудын доор "Answer Key:" гэж бичээд зөв хариултуудаа жагсаана уу.',
    };
  }
  const questionsPart = akSplit[0].trim();
  const answerKeyPart = akSplit.slice(1).join("\n").trim();

  // Parse the answer key line-by-line: "Question 1: 3 (...)" or "1: 3" or "1) 3".
  // Matching only the first pair per line avoids picking up stray digits that
  // may appear inside the parenthetical note after the answer.
  const answerMap = new Map<number, number>();
  const akLineRegex = /^\s*(?:question\s*)?(\d+)\s*[:.)]\s*(\d+)/i;
  for (const line of answerKeyPart.split(/\n/)) {
    const lm = line.match(akLineRegex);
    if (lm) {
      answerMap.set(parseInt(lm[1], 10), parseInt(lm[2], 10));
    }
  }
  if (answerMap.size === 0) {
    return {
      questions: [],
      error: 'Answer Key-г уншиж чадсангүй. Жишээ: "Question 1: 3".',
    };
  }

  // Split into question blocks at every line that starts with "N." or "N)".
  const blocks = questionsPart
    .split(/\n(?=\s*\d+\s*[.)]\s)/)
    .map((b) => b.trim())
    .filter(Boolean);

  const questions: CustomQuestion[] = [];
  const parsedNums: number[] = [];
  const errors: string[] = [];

  for (const block of blocks) {
    const lines = block
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;

    const head = lines[0].match(/^(\d+)\s*[.)]\s*(.*)$/);
    if (!head) continue;

    const qNum = parseInt(head[1], 10);
    const questionText = head[2].trim();
    const options = lines
      .slice(1)
      .map((l) => l.replace(/^[・･・\-*•]\s*/, "").trim())
      .filter(Boolean);

    if (!questionText) {
      errors.push(`Асуулт ${qNum}: асуултын текст хоосон байна.`);
      continue;
    }
    if (options.length < 2) {
      errors.push(`Асуулт ${qNum}: дор хаяж 2 хариултын сонголт оруулна уу.`);
      continue;
    }

    const ansNum = answerMap.get(qNum);
    if (ansNum === undefined) {
      errors.push(`Асуулт ${qNum}: Answer Key дотор зөв хариулт алга байна.`);
      continue;
    }
    if (ansNum < 1 || ansNum > options.length) {
      errors.push(
        `Асуулт ${qNum}: Answer Key дэх хариулт (${ansNum}) нь ${options.length} сонголтын мужид багтахгүй байна.`
      );
      continue;
    }

    parsedNums.push(qNum);
    questions.push({
      question: questionText,
      options,
      answerIndex: ansNum - 1,
      explanation: "",
    });
  }

  // Catch answer-key entries that have no matching question (orphan answers).
  for (const key of answerMap.keys()) {
    if (!parsedNums.includes(key)) {
      errors.push(`Answer Key дэх Асуулт ${key} нь асуултын жагсаалтад олдсонгүй.`);
    }
  }

  if (errors.length > 0) {
    return { questions: [], error: errors.join("\n") };
  }
  if (questions.length === 0) {
    return { questions: [], error: "Асуулт олдсонгүй. Форматаа шалгана уу." };
  }

  return { questions, error: null };
}
