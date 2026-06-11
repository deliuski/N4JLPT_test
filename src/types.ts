export interface CustomQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
}

// A word the student didn't know, collected for flashcard review.
export interface Flashcard {
  word: string;    // Japanese / unknown word
  meaning: string; // Mongolian meaning
}

export interface Lesson {
  id: number;           // 1 to 30
  day: number;          // 1 to 30
  title: string;        // e.g. "Хичээл 1"
  theme: string;        // e.g. "Сонсох & Дүрэм"
  listeningUrl: string; // YouTube video link/embed
  vocabQuestions: CustomQuestion[]; // Shine ug test
  grammarQuestions: CustomQuestion[]; // Durem test
  flashcards?: Flashcard[]; // Collected unknown words for flashcard study
}

// Best test percentages per lesson (0-100).
export interface LessonScore {
  vocab: number;
  grammar: number;
}

export interface UserProgress {
  completedDays: number[]; // Completed day numbers (e.g. [1, 2])
}

// A lesson counts as completed when both tests reach this percentage.
export const PASS_THRESHOLD = 90;
