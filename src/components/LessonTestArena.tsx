import React, { useState } from "react";
import { Lesson, CustomQuestion } from "../types";
import { 
  Play, Check, X, ArrowLeft, Video, BookOpen, Compass, 
  Settings, Save, Plus, Trash2, HelpCircle, CheckCircle2, ChevronRight, AlertCircle
} from "lucide-react";
import { playChime } from "../utils/audio";
import { motion, AnimatePresence } from "motion/react";

interface LessonTestArenaProps {
  lesson: Lesson;
  onBack: () => void;
  onSaveLesson: (updated: Lesson) => void;
  isCompleted: boolean;
  onToggleComplete: () => void;
}

// Utility to convert YouTube URL to embed form
function getYouTubeEmbedUrl(url: string): string {
  if (!url) return "";
  if (url.includes("/embed/")) return url;
  
  let videoId = "";
  try {
    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split(/[?#]/)[0];
    } else if (url.includes("watch?v=")) {
      videoId = url.split("watch?v=")[1]?.split("&")[0];
    } else if (url.includes("youtube.com/shorts/")) {
      videoId = url.split("/shorts/")[1]?.split(/[?#]/)[0];
    }
  } catch (e) {
    console.error("YouTube parse error:", e);
  }
  
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

export default function LessonTestArena({
  lesson,
  onBack,
  onSaveLesson,
  isCompleted,
  onToggleComplete
}: LessonTestArenaProps) {
  // Navigation: "learn" (taking lessons/tests) | "edit" (editing the lesson/test contents manually)
  const [mode, setMode] = useState<"learn" | "edit">("learn");
  
  // Custom states for active step inside learning: "listening" | "vocab" | "grammar"
  const [learnStep, setLearnStep] = useState<"listening" | "vocab" | "grammar">("listening");

  // Editorial Copy of the current lesson
  const [editTitle, setEditTitle] = useState(lesson.title);
  const [editTheme, setEditTheme] = useState(lesson.theme);
  const [editListeningUrl, setEditListeningUrl] = useState(lesson.listeningUrl);
  const [editVocabQuestions, setEditVocabQuestions] = useState<CustomQuestion[]>([...lesson.vocabQuestions]);
  const [editGrammarQuestions, setEditGrammarQuestions] = useState<CustomQuestion[]>([...lesson.grammarQuestions]);

  // Quiz play states
  const [vocabIndex, setVocabIndex] = useState(0);
  const [vocabAnswer, setVocabAnswer] = useState<number | null>(null);
  const [vocabIsAnswered, setVocabIsAnswered] = useState(false);
  const [vocabScore, setVocabScore] = useState(0);
  const [vocabFinished, setVocabFinished] = useState(false);

  const [grammarIndex, setGrammarIndex] = useState(0);
  const [grammarAnswer, setGrammarAnswer] = useState<number | null>(null);
  const [grammarIsAnswered, setGrammarIsAnswered] = useState(false);
  const [grammarScore, setGrammarScore] = useState(0);
  const [grammarFinished, setGrammarFinished] = useState(false);

  // Restart Quizzes helpers
  const handleResetVocabQuiz = () => {
    setVocabIndex(0);
    setVocabAnswer(null);
    setVocabIsAnswered(false);
    setVocabScore(0);
    setVocabFinished(false);
  };

  const handleResetGrammarQuiz = () => {
    setGrammarIndex(0);
    setGrammarAnswer(null);
    setGrammarIsAnswered(false);
    setGrammarScore(0);
    setGrammarFinished(false);
  };

  // Option submission
  const handleAnswerVocab = (idx: number) => {
    if (vocabIsAnswered) return;
    setVocabAnswer(idx);
    setVocabIsAnswered(true);
    const correct = idx === lesson.vocabQuestions[vocabIndex].answerIndex;
    if (correct) {
      setVocabScore((s) => s + 1);
      playChime("success");
    } else {
      playChime("error");
    }
  };

  const handleAnswerGrammar = (idx: number) => {
    if (grammarIsAnswered) return;
    setGrammarAnswer(idx);
    setGrammarIsAnswered(true);
    const correct = idx === lesson.grammarQuestions[grammarIndex].answerIndex;
    if (correct) {
      setGrammarScore((s) => s + 1);
      playChime("success");
    } else {
      playChime("error");
    }
  };

  // Save changes to Parent & localStorage
  const handleSaveLessonConfig = () => {
    if (!editTitle.trim()) {
      alert("Хичээлийн гарчгийг оруулна уу.");
      return;
    }

    onSaveLesson({
      ...lesson,
      title: editTitle,
      theme: editTheme,
      listeningUrl: editListeningUrl,
      vocabQuestions: editVocabQuestions,
      grammarQuestions: editGrammarQuestions
    });

    playChime("success");
    setMode("learn");
  };

  // Question editing helpers
  const handleAddQuestion = (type: "vocab" | "grammar") => {
    const newQ: CustomQuestion = {
      question: "Шинэ асуултын текстүүд?",
      options: ["Хариулт а", "Хариулт б", "Хариулт в", "Хариулт г"],
      answerIndex: 0,
      explanation: ""
    };

    if (type === "vocab") {
      setEditVocabQuestions([...editVocabQuestions, newQ]);
    } else {
      setEditGrammarQuestions([...editGrammarQuestions, newQ]);
    }
  };

  const handleRemoveQuestion = (type: "vocab" | "grammar", index: number) => {
    if (type === "vocab") {
      setEditVocabQuestions(editVocabQuestions.filter((_, i) => i !== index));
    } else {
      setEditGrammarQuestions(editGrammarQuestions.filter((_, i) => i !== index));
    }
  };

  const handleUpdateQuestionField = (
    type: "vocab" | "grammar", 
    qIdx: number, 
    field: keyof CustomQuestion, 
    value: any
  ) => {
    const targetList = type === "vocab" ? [...editVocabQuestions] : [...editGrammarQuestions];
    targetList[qIdx] = {
      ...targetList[qIdx],
      [field]: value
    };
    if (type === "vocab") {
      setEditVocabQuestions(targetList);
    } else {
      setEditGrammarQuestions(targetList);
    }
  };

  const handleUpdateQuestionOption = (
    type: "vocab" | "grammar",
    qIdx: number,
    optIdx: number,
    value: string
  ) => {
    const targetList = type === "vocab" ? [...editVocabQuestions] : [...editGrammarQuestions];
    const updatedOptions = [...targetList[qIdx].options];
    updatedOptions[optIdx] = value;
    targetList[qIdx] = {
      ...targetList[qIdx],
      options: updatedOptions
    };
    if (type === "vocab") {
      setEditVocabQuestions(targetList);
    } else {
      setEditGrammarQuestions(targetList);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" id="lesson-test-arena-viewport">
      {/* Navigation & Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Самбар руу буцах</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setMode(mode === "learn" ? "edit" : "learn");
              playChime("click");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center space-x-1 cursor-pointer transition-all ${
              mode === "edit"
                ? "bg-slate-900 border-slate-900 text-white"
                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{mode === "learn" ? "Гараар оруулах / Засах" : "Хичээл рүү очих"}</span>
          </button>
        </div>
      </div>

      {mode === "learn" ? (
        /* LEARNING / TESTING VIEW */
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="bg-indigo-50 text-indigo-700 px-3 py-0.5 rounded-full text-[11px] font-bold font-mono">
                  ӨДӨР {lesson.day}
                </span>
                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase">
                  {lesson.theme || "N4 Хичээл"}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-800">{lesson.title}</h2>
            </div>

            <button
              onClick={() => {
                onToggleComplete();
                playChime("success");
              }}
              className={`px-4.5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                isCompleted
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-3xs"
                  : "bg-slate-900 hover:bg-slate-800 text-white"
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Төгссөн гэж тэмдэглэсэн</span>
                </>
              ) : (
                <>
                  <span>Төгссөн гэж тэмдэглэх</span>
                </>
              )}
            </button>
          </div>

          {/* Sub Navigation for Learning Steps (Sonsoh, Shine ug test, Durem test) */}
          <div className="grid grid-cols-3 gap-2 bg-slate-200/60 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => { setLearnStep("listening"); playChime("click"); }}
              className={`py-3 rounded-lg text-xs font-bold flex flex-col sm:flex-row items-center justify-center sm:space-x-1.5 cursor-pointer transition-all ${
                learnStep === "listening"
                  ? "bg-white text-primary shadow-3xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Video className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
              <span>🎧 Сонсох дасгал</span>
            </button>

            <button
              onClick={() => { setLearnStep("vocab"); playChime("click"); }}
              className={`py-3 rounded-lg text-xs font-bold flex flex-col sm:flex-row items-center justify-center sm:space-x-1.5 cursor-pointer transition-all ${
                learnStep === "vocab"
                  ? "bg-white text-primary shadow-3xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>✍️ Шинэ үг тест</span>
            </button>

            <button
              onClick={() => { setLearnStep("grammar"); playChime("click"); }}
              className={`py-3 rounded-lg text-xs font-bold flex flex-col sm:flex-row items-center justify-center sm:space-x-1.5 cursor-pointer transition-all ${
                learnStep === "grammar"
                  ? "bg-white text-primary shadow-3xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Compass className="w-4 h-4 shrink-0" />
              <span>🧭 Дүрэм тест</span>
            </button>
          </div>

          {/* CONTENT ROUTER DISPLAY */}
          <div className="min-h-[300px]">
            {learnStep === "listening" && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-3xs overflow-hidden p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-850 text-sm flex items-center space-x-1">
                    <Video className="w-4 h-4 text-rose-500" />
                    <span>Сонсох дасгалын видео</span>
                  </h3>
                  <p className="text-xs text-slate-500">Миний оруулсан Youtube бичлэгийг үзэж сонсох чадвараа хөгжүүлээрэй.</p>
                </div>

                {lesson.listeningUrl ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                    <iframe
                      src={getYouTubeEmbedUrl(lesson.listeningUrl)}
                      title={lesson.title}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <div className="py-12 bg-slate-50 text-center rounded-xl border border-dashed border-slate-300 p-6 space-y-3">
                    <AlertCircle className="w-10 h-10 mx-auto text-slate-400" />
                    <p className="text-xs text-slate-600 font-bold">Одоогоор сонсох дасгалын видео линк оруулаагүй байна.</p>
                    <button
                      onClick={() => {
                        setMode("edit");
                        playChime("click");
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      Линк гараар нэмэх
                    </button>
                  </div>
                )}
              </div>
            )}

            {learnStep === "vocab" && (
              <div className="space-y-4">
                {lesson.vocabQuestions.length === 0 ? (
                  <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3 shadow-3xs">
                    <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-xs text-slate-600 font-bold">Шинэ үгийн сорил оруулаагүй байна.</p>
                    <button
                      onClick={() => setMode("edit")}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      Гараар сорил үүсгэх
                    </button>
                  </div>
                ) : vocabFinished ? (
                  /* FINISH BOARD */
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-5 shadow-3xs">
                    <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
                    <h3 className="text-lg font-black text-slate-800">Шинэ үгийн сорил дууслаа!</h3>
                    <p className="text-3xl font-extrabold text-indigo-600 font-mono">
                      {vocabScore} / {lesson.vocabQuestions.length} Зөв
                    </p>
                    <div className="flex gap-2 justify-center pt-2">
                      <button
                        onClick={handleResetVocabQuiz}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Дахин оролдох
                      </button>
                      <button
                        onClick={() => {
                          setLearnStep("grammar");
                          playChime("click");
                        }}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center space-x-1"
                      >
                        <span>Дараагийн шат: Дүрэм сорил</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* CURRENT QUESTION DISPLAY */
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-3xs space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded">
                        Шинэ үг шалгалт: Асуулт {vocabIndex + 1} / {lesson.vocabQuestions.length}
                      </span>
                      <span className="text-xs text-slate-500 font-bold">Оноо: {vocabScore}</span>
                    </div>

                    <h4 className="text-base font-extrabold text-slate-850 font-sans leading-relaxed">
                      {lesson.vocabQuestions[vocabIndex].question}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {lesson.vocabQuestions[vocabIndex].options.map((option, idx) => {
                        const isSelected = vocabAnswer === idx;
                        const isCorrectAnswer = lesson.vocabQuestions[vocabIndex].answerIndex === idx;

                        let style = "border-slate-200 bg-white hover:bg-slate-50";
                        let mark = null;

                        if (vocabIsAnswered) {
                          if (isCorrectAnswer) {
                            style = "border-emerald-300 bg-emerald-50 text-emerald-950 font-bold";
                            mark = <Check className="w-4 h-4 text-emerald-600" />;
                          } else if (isSelected) {
                            style = "border-rose-300 bg-rose-50 text-rose-950 font-bold";
                            mark = <X className="w-4 h-4 text-rose-600" />;
                          } else {
                            style = "border-slate-100 bg-slate-50/50 opacity-60";
                          }
                        }

                        return (
                          <button
                            key={idx}
                            disabled={vocabIsAnswered}
                            onClick={() => handleAnswerVocab(idx)}
                            className={`w-full text-left p-4 rounded-xl border text-sm flex items-center justify-between cursor-pointer transition-all ${style}`}
                          >
                            <span className="font-semibold">{option}</span>
                            {mark}
                          </button>
                        );
                      })}
                    </div>

                    {vocabIsAnswered && (
                      <div className="space-y-4">
                        {lesson.vocabQuestions[vocabIndex].explanation && (
                          <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-lg text-xs leading-relaxed text-slate-600 font-medium">
                            <b>Тайлбар:</b> {lesson.vocabQuestions[vocabIndex].explanation}
                          </div>
                        )}

                        <button
                          onClick={() => {
                            if (vocabIndex < lesson.vocabQuestions.length - 1) {
                              setVocabIndex((i) => i + 1);
                              setVocabAnswer(null);
                              setVocabIsAnswered(false);
                            } else {
                              setVocabFinished(true);
                            }
                            playChime("click");
                          }}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 rounded-xl text-center text-xs cursor-pointer shadow-3xs"
                        >
                          {vocabIndex === lesson.vocabQuestions.length - 1 ? "Шалгалт дуусгах" : "Дараагийн асуулт ➔"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {learnStep === "grammar" && (
              <div className="space-y-4">
                {lesson.grammarQuestions.length === 0 ? (
                  <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3 shadow-3xs">
                    <Compass className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-xs text-slate-600 font-bold">Дүрмийн сорил оруулаагүй байна.</p>
                    <button
                      onClick={() => setMode("edit")}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      Гараар сорил үүсгэх
                    </button>
                  </div>
                ) : grammarFinished ? (
                  /* FINISH BOARD */
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-5 shadow-3xs">
                    <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
                    <h3 className="text-lg font-black text-slate-800">Дүрмийн сорил дууслаа!</h3>
                    <p className="text-3xl font-extrabold text-indigo-600 font-mono">
                      {grammarScore} / {lesson.grammarQuestions.length} Зөв
                    </p>
                    <div className="flex gap-2 justify-center pt-2">
                      <button
                        onClick={handleResetGrammarQuiz}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Дахин оролдох
                      </button>
                      <button
                        onClick={onBack}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center space-x-1"
                      >
                        <span>Замын зураг руу буцах</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* CURRENT QUESTION DISPLAY */
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-3xs space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded">
                        Дүрэм шалгалт: Асуулт {grammarIndex + 1} / {lesson.grammarQuestions.length}
                      </span>
                      <span className="text-xs text-slate-500 font-bold">Оноо: {grammarScore}</span>
                    </div>

                    <h4 className="text-base font-extrabold text-slate-850 font-sans leading-relaxed">
                      {lesson.grammarQuestions[grammarIndex].question}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {lesson.grammarQuestions[grammarIndex].options.map((option, idx) => {
                        const isSelected = grammarAnswer === idx;
                        const isCorrectAnswer = lesson.grammarQuestions[grammarIndex].answerIndex === idx;

                        let style = "border-slate-200 bg-white hover:bg-slate-50";
                        let mark = null;

                        if (grammarIsAnswered) {
                          if (isCorrectAnswer) {
                            style = "border-emerald-300 bg-emerald-50 text-emerald-950 font-bold";
                            mark = <Check className="w-4 h-4 text-emerald-600" />;
                          } else if (isSelected) {
                            style = "border-rose-300 bg-rose-50 text-rose-950 font-bold";
                            mark = <X className="w-4 h-4 text-rose-600" />;
                          } else {
                            style = "border-slate-100 bg-slate-50/50 opacity-60";
                          }
                        }

                        return (
                          <button
                            key={idx}
                            disabled={grammarIsAnswered}
                            onClick={() => handleAnswerGrammar(idx)}
                            className={`w-full text-left p-4 rounded-xl border text-sm flex items-center justify-between cursor-pointer transition-all ${style}`}
                          >
                            <span className="font-semibold">{option}</span>
                            {mark}
                          </button>
                        );
                      })}
                    </div>

                    {grammarIsAnswered && (
                      <div className="space-y-4">
                        {lesson.grammarQuestions[grammarIndex].explanation && (
                          <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-lg text-xs leading-relaxed text-slate-600 font-medium">
                            <b>Тайлбар:</b> {lesson.grammarQuestions[grammarIndex].explanation}
                          </div>
                        )}

                        <button
                          onClick={() => {
                            if (grammarIndex < lesson.grammarQuestions.length - 1) {
                              setGrammarIndex((i) => i + 1);
                              setGrammarAnswer(null);
                              setGrammarIsAnswered(false);
                            } else {
                              setGrammarFinished(true);
                            }
                            playChime("click");
                          }}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 rounded-xl text-center text-xs cursor-pointer shadow-3xs"
                        >
                          {grammarIndex === lesson.grammarQuestions.length - 1 ? "Шалгалт дуусгах" : "Дараагийн асуулт ➔"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* MANUAL INTUITIVE EDITOR MODE */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-3xs space-y-6"
        >
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-850 flex items-center space-x-1.5">
              <Settings className="w-5 h-5 text-indigo-600 animate-spin-slow" />
              <span>✍️ Өдөр {lesson.day} - Хичээл оруулах & сорил бэлтгэх</span>
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Энд дасгал, шалгалтад хэрэглэгдэх видео линк болон асуултуудыг гараараа бэлтгэн засна уу.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Хичээлийн гарчиг (Монгол/Япон)</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Жишээ: Шинэ үг ба Дүрмийн тест 1"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-medium outline-hidden bg-slate-50/50 focus:bg-white focus:border-indigo-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Хичээлийн ангилал / Түвшин</label>
              <input
                type="text"
                value={editTheme}
                onChange={(e) => setEditTheme(e.target.value)}
                placeholder="Жишээ: Анхан шат / Дунд шат"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-medium outline-hidden bg-slate-50/50 focus:bg-white focus:border-indigo-600"
              />
            </div>

            <div className="col-span-full space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center space-x-1">
                <Video className="w-3.5 h-3.5 text-rose-500" />
                <span>Сонсох дасгалын видео линк (YouTube URL)</span>
              </label>
              <input
                type="text"
                value={editListeningUrl}
                onChange={(e) => setEditListeningUrl(e.target.value)}
                placeholder="Жишээ: https://www.youtube.com/watch?v=L1mCHdfLp5U"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm outline-hidden bg-slate-50/50 focus:bg-white focus:border-indigo-600 font-mono"
              />
              <p className="text-[10.5px] text-slate-400 font-semibold">Аливаа Youtube видео, шортны холбоосыг хуулж тавихад автоматаар танина.</p>
            </div>
          </div>

          {/* VOCAB QUESTIONS SECTION */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider flex items-center space-x-1">
                <BookOpen className="w-4 h-4 text-[#4f46e5]" />
                <span>1. Шинэ үгийн сорил (Shine ug test) - {editVocabQuestions.length} асуулт</span>
              </h4>
              <button
                type="button"
                onClick={() => handleAddQuestion("vocab")}
                className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 transition-colors border border-indigo-200/50 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Асуулт нэмэх</span>
              </button>
            </div>

            <div className="space-y-4">
              {editVocabQuestions.map((q, qIdx) => (
                <div key={qIdx} className="p-4 bg-slate-50/60 border border-slate-200 rounded-xl space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion("vocab", qIdx)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 p-1 rounded-md transition-colors cursor-pointer"
                    title="Хасах"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <span className="text-[10px] font-bold font-mono text-slate-400">АСУУЛТ #{qIdx + 1}</span>

                  <div className="space-y-2">
                    <label className="text-[10.5px] font-bold text-slate-500">Асуултын текст</label>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => handleUpdateQuestionField("vocab", qIdx, "question", e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:border-indigo-600 outline-hidden font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-500">Хариулт {oIdx + 1}</label>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuestionField("vocab", qIdx, "answerIndex", oIdx)}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                              q.answerIndex === oIdx 
                                ? "bg-emerald-500 text-white font-extrabold" 
                                : "text-slate-400 hover:text-slate-600 bg-slate-200"
                            }`}
                          >
                            {q.answerIndex === oIdx ? "Зөв хариулт" : "Зөв болгох"}
                          </button>
                        </div>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleUpdateQuestionOption("vocab", qIdx, oIdx, e.target.value)}
                          className={`w-full px-3 py-1.5 border rounded-lg text-xs outline-hidden ${
                            q.answerIndex === oIdx ? "border-emerald-500 bg-emerald-50/25 font-bold" : "border-slate-200 bg-white"
                          }`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Тайлбар / Зөвлөмж (Сонголттой)</label>
                    <textarea
                      rows={1}
                      value={q.explanation || ""}
                      onChange={(e) => handleUpdateQuestionField("vocab", qIdx, "explanation", e.target.value)}
                      placeholder="Зөв хариултын талаарх товч тайлбар..."
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-hidden font-medium"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GRAMMAR QUESTIONS SECTION */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider flex items-center space-x-1">
                <Compass className="w-4 h-4 text-[#4f46e5]" />
                <span>2. Дүрмийн сорил (Durem test) - {editGrammarQuestions.length} асуулт</span>
              </h4>
              <button
                type="button"
                onClick={() => handleAddQuestion("grammar")}
                className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 transition-colors border border-indigo-200/50 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Асуулт нэмэх</span>
              </button>
            </div>

            <div className="space-y-4">
              {editGrammarQuestions.map((q, qIdx) => (
                <div key={qIdx} className="p-4 bg-slate-50/60 border border-slate-200 rounded-xl space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion("grammar", qIdx)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 p-1 rounded-md transition-colors cursor-pointer"
                    title="Хасах"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <span className="text-[10px] font-bold font-mono text-slate-400">АСУУЛТ #{qIdx + 1}</span>

                  <div className="space-y-2">
                    <label className="text-[10.5px] font-bold text-slate-500">Асуултын текст</label>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => handleUpdateQuestionField("grammar", qIdx, "question", e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:border-indigo-600 outline-hidden font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-500">Хариулт {oIdx + 1}</label>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuestionField("grammar", qIdx, "answerIndex", oIdx)}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                              q.answerIndex === oIdx 
                                ? "bg-emerald-500 text-white font-extrabold" 
                                : "text-slate-400 hover:text-slate-600 bg-slate-200"
                            }`}
                          >
                            {q.answerIndex === oIdx ? "Зөв хариулт" : "Зөв болгох"}
                          </button>
                        </div>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleUpdateQuestionOption("grammar", qIdx, oIdx, e.target.value)}
                          className={`w-full px-3 py-1.5 border rounded-lg text-xs outline-hidden ${
                            q.answerIndex === oIdx ? "border-emerald-500 bg-emerald-50/25 font-bold" : "border-slate-200 bg-white"
                          }`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Тайлбар (Сонголттой)</label>
                    <textarea
                      rows={1}
                      value={q.explanation || ""}
                      onChange={(e) => handleUpdateQuestionField("grammar", qIdx, "explanation", e.target.value)}
                      placeholder="Зөв хариултын тайлбар..."
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-hidden font-medium"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                setMode("learn");
                playChime("click");
              }}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Цуцлах
            </button>
            <button
              onClick={handleSaveLessonConfig}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl cursor-pointer flex items-center space-x-1 shadow-3xs"
            >
              <Save className="w-4 h-4" />
              <span>Хадгалах</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
