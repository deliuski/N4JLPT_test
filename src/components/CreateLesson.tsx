import React, { useMemo, useState } from "react";
import { Lesson } from "../types";
import { parseQuizText } from "../utils/parseQuiz";
import { playChime } from "../utils/audio";
import {
  ArrowLeft, Save, Video, BookOpen, Compass, AlertCircle, CheckCircle2,
} from "lucide-react";
import { motion } from "motion/react";

interface CreateLessonProps {
  lessons: Lesson[];
  onCreate: (lesson: Lesson) => void;
  onBack: () => void;
}

const PLACEHOLDER = `1. あの人は病気ではない　_______ くすりをたくさん飲んでいます。
 ので
 ために
 のに
 から

2. これから日本に行くけど...　_______ 。
 決めないようほしい
 決めないほしい
 決めなくてほしい
 決めないでほしい

Answer Key:

Question 1: 3
Question 2: 4`;

export default function CreateLesson({ lessons, onCreate, onBack }: CreateLessonProps) {
  const nextDay = useMemo(
    () => (lessons.length ? Math.max(...lessons.map((l) => l.day)) + 1 : 1),
    [lessons]
  );

  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState("");
  const [day, setDay] = useState<number>(nextDay);
  const [listeningUrl, setListeningUrl] = useState("");

  const [vocabRaw, setVocabRaw] = useState("");
  const [grammarRaw, setGrammarRaw] = useState("");

  // Per-section errors surfaced under each box.
  const [vocabError, setVocabError] = useState<string | null>(null);
  const [grammarError, setGrammarError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Live parse previews (for the section badges) without blocking typing.
  const vocabPreview = useMemo(() => parseQuizText(vocabRaw), [vocabRaw]);
  const grammarPreview = useMemo(() => parseQuizText(grammarRaw), [grammarRaw]);

  const handleSave = () => {
    setGeneralError(null);

    if (!title.trim()) {
      setGeneralError("Хичээлийн гарчгийг оруулна уу.");
      playChime("error");
      return;
    }
    if (lessons.some((l) => l.day === day)) {
      setGeneralError(`Өдөр ${day} аль хэдийн үүссэн байна. Өөр өдрийн дугаар сонгоно уу.`);
      playChime("error");
      return;
    }

    // Parse + validate both quiz sections against their answer keys.
    const vocab = parseQuizText(vocabRaw);
    const grammar = parseQuizText(grammarRaw);

    setVocabError(vocab.error);
    setGrammarError(grammar.error);

    if (vocab.error || grammar.error) {
      playChime("error");
      return;
    }

    if (vocab.questions.length === 0 && grammar.questions.length === 0 && !listeningUrl.trim()) {
      setGeneralError("Сонсох линк, шинэ үг эсвэл дүрмийн сорилын аль нэгийг оруулна уу.");
      playChime("error");
      return;
    }

    const lesson: Lesson = {
      id: day,
      day,
      title: title.trim(),
      theme: theme.trim() || "N4",
      listeningUrl: listeningUrl.trim(),
      vocabQuestions: vocab.questions,
      grammarQuestions: grammar.questions,
    };

    onCreate(lesson);
    playChime("success");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Самбар руу буцах</span>
        </button>
        <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
          Шинэ хичээл үүсгэх
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-3xs space-y-6"
      >
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-800">
            ✍️ Хичээл оруулах & сорил бэлтгэх
          </h3>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Хичээлийн мэдээллээ бөглөөд, асуулт &amp; хариултаа доорх форматаар буулгана уу. Хадгалахаас өмнө Answer Key-тэй тулгаж шалгана.
          </p>
        </div>

        {/* Meta fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Хичээлийн гарчиг</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Жишээ: Дүрэм ба шинэ үг — Өдөр 1"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-medium outline-hidden bg-slate-50/50 focus:bg-white focus:border-indigo-600"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Өдрийн дугаар</label>
            <input
              type="number"
              min={1}
              value={day}
              onChange={(e) => setDay(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-medium outline-hidden bg-slate-50/50 focus:bg-white focus:border-indigo-600"
            />
          </div>
          <div className="space-y-2 md:col-span-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ангилал / Түвшин (сонголттой)</label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Жишээ: Анхан шат"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-medium outline-hidden bg-slate-50/50 focus:bg-white focus:border-indigo-600"
            />
          </div>
        </div>

        {/* 1. Listening section */}
        <section className="space-y-2 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider flex items-center space-x-1.5">
            <Video className="w-4 h-4 text-rose-500" />
            <span>1. Сонсох дасгал (Listening)</span>
          </h4>
          <input
            type="text"
            value={listeningUrl}
            onChange={(e) => setListeningUrl(e.target.value)}
            placeholder="YouTube линк: https://www.youtube.com/watch?v=..."
            className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm outline-hidden bg-slate-50/50 focus:bg-white focus:border-indigo-600 font-mono"
          />
        </section>

        {/* 2. Vocabulary section */}
        <QuizSection
          index={2}
          title="Шинэ үгийн сорил (Vocabulary)"
          icon={<BookOpen className="w-4 h-4 text-indigo-600" />}
          value={vocabRaw}
          onChange={(v) => { setVocabRaw(v); setVocabError(null); }}
          error={vocabError}
          preview={vocabPreview}
          placeholder={PLACEHOLDER}
        />

        {/* 3. Grammar section */}
        <QuizSection
          index={3}
          title="Дүрмийн сорил (Grammar)"
          icon={<Compass className="w-4 h-4 text-indigo-600" />}
          value={grammarRaw}
          onChange={(v) => { setGrammarRaw(v); setGrammarError(null); }}
          error={grammarError}
          preview={grammarPreview}
          placeholder={PLACEHOLDER}
        />

        {generalError && (
          <div className="flex items-start gap-2 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{generalError}</span>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
          >
            Цуцлах
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl cursor-pointer flex items-center space-x-1 shadow-3xs"
          >
            <Save className="w-4 h-4" />
            <span>Шалгаад хадгалах</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface QuizSectionProps {
  index: number;
  title: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  error: string | null;
  preview: { questions: { length: number }; error: string | null };
  placeholder: string;
}

function QuizSection({ index, title, icon, value, onChange, error, preview, placeholder }: QuizSectionProps) {
  const count = preview.questions.length;
  return (
    <section className="space-y-2 pt-4 border-t border-slate-100">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider flex items-center space-x-1.5">
          {icon}
          <span>{index}. {title}</span>
        </h4>
        {value.trim() && !preview.error && count > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            {count} асуулт танигдсан
          </span>
        )}
      </div>
      <textarea
        rows={8}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3.5 py-2.5 border rounded-lg text-xs leading-relaxed outline-hidden bg-slate-50/50 focus:bg-white font-mono whitespace-pre ${
          error ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-indigo-600"
        }`}
      />
      {error && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 whitespace-pre-wrap">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </section>
  );
}
