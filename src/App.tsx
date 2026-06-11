import React, { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import LessonTestArena from "./components/LessonTestArena";
import CreateLesson from "./components/CreateLesson";
import { playChime } from "./utils/audio";
import { Lesson, LessonScore, PASS_THRESHOLD } from "./types";
import { fetchLessonsFromFirestore, saveLessonsToFirestore } from "./utils/lessonsStore";
import { motion, AnimatePresence } from "motion/react";

// Lessons live in Firestore. Only per-user progress stays in localStorage.
const PROGRESS_STORAGE_KEY = "n4-custom-lessons-progress-v3";
const SCORES_STORAGE_KEY = "n4-lesson-scores-v1";

type View = "dashboard" | "lesson" | "create";

// Map the current URL path to an app view. Lessons stay in-app state.
function routeFromPath(path: string): View {
  return path === "/create" ? "create" : "dashboard";
}

export default function App() {
  const [view, setView] = useState<View>(() =>
    typeof window !== "undefined" ? routeFromPath(window.location.pathname) : "dashboard"
  );
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);

  // Lessons data loaded from Firestore.
  const [lessons, setLessons] = useState<Lesson[]>([]);

  // Array of completed day numbers
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  // Best test percentages per day, keyed by day number.
  const [scores, setScores] = useState<Record<number, LessonScore>>({});

  // Path-based navigation helper.
  const navigate = (path: string, nextView: View) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
    setView(nextView);
  };

  // Load on mount: lessons from Firestore, progress from localStorage.
  useEffect(() => {
    try {
      const savedProgress = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (savedProgress) setCompletedDays(JSON.parse(savedProgress));

      const savedScores = localStorage.getItem(SCORES_STORAGE_KEY);
      if (savedScores) setScores(JSON.parse(savedScores));
    } catch (e) {
      console.error("Progress load failed:", e);
    }

    fetchLessonsFromFirestore()
      .then((data) => setLessons(data || []))
      .catch((e) => console.error("Firestore load failed:", e));
  }, []);

  // Keep view in sync with browser back/forward.
  useEffect(() => {
    const onPop = () => setView(routeFromPath(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const currentLesson: Lesson | undefined = lessons.find((l) => l.day === selectedDayId);

  const persistLessons = (updated: Lesson[]) => {
    setLessons(updated);
    saveLessonsToFirestore(updated).catch((e) =>
      console.error('Firestore save failed', e)
    );
  };

  // Record a finished test's percentage. Keeps the best score, and auto-marks
  // the day completed once BOTH tests reach the pass threshold (90%+).
  const handleRecordScore = (dayNum: number, type: "vocab" | "grammar", percent: number) => {
    const prev = scores[dayNum] || { vocab: 0, grammar: 0 };
    const updatedScore: LessonScore = {
      ...prev,
      [type]: Math.max(prev[type], percent),
    };
    const nextScores = { ...scores, [dayNum]: updatedScore };
    setScores(nextScores);
    try {
      localStorage.setItem(SCORES_STORAGE_KEY, JSON.stringify(nextScores));
    } catch (e) {
      console.error("Scores save failed:", e);
    }

    const passed =
      updatedScore.vocab >= PASS_THRESHOLD && updatedScore.grammar >= PASS_THRESHOLD;
    if (passed && !completedDays.includes(dayNum)) {
      const nextDays = [...completedDays, dayNum];
      setCompletedDays(nextDays);
      try {
        localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(nextDays));
      } catch (e) {
        console.error("Progress save failed:", e);
      }
      playChime("success");
      alert(`🎉 Баяр хүргэе! Өдөр ${dayNum}-ийн 2 шалгалтыг 90%+ оноогоор давж, амжилттай төгслөө!`);
    }
  };

  // Save manual lesson updates (listening link, vocab test, grammar test)
  const handleSaveLesson = (updatedLesson: Lesson) => {
    persistLessons(lessons.map((l) => (l.day === updatedLesson.day ? updatedLesson : l)));
    alert(`💾 Өдөр ${updatedLesson.day} Хичээлийг амжилттай хадгаллаа!`);
  };

  // Create a brand new lesson from the /create page.
  const handleCreateLesson = (newLesson: Lesson) => {
    const updated = [...lessons, newLesson].sort((a, b) => a.day - b.day);
    persistLessons(updated);
    alert(`💾 Өдөр ${newLesson.day} хичээл амжилттай үүслээ!`);
    navigate("/", "dashboard");
  };

  // Open Lesson view
  const handleSelectDay = (dayNum: number) => {
    setSelectedDayId(dayNum);
    setView("lesson");
    playChime("click");
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-slate-800 flex flex-col relative font-sans antialiased">
      {/* Polished Neutral Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => { navigate("/", "dashboard"); playChime("click"); }}
            className="flex items-center space-x-2.5 cursor-pointer hover:opacity-90 transition-opacity"
            id="brand-logo"
          >
            <div className="w-8 h-8 rounded-lg bg-red-300 flex items-center justify-center text-white font-black text-sm shadow-3xs">
              ❤️
            </div>
            <div>
              <h1 className="font-sans font-black text-slate-900 tracking-tight leading-none text-sm md:text-base">
                N4-ийн шалгалтанд амжилт!
              </h1>
              <span className="text-[10px] text-slate-400 font-bold font-mono">Нийт 30 хоногийн системчилсэн дасгал</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Study Arena */}
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-12 relative" id="main-scroller">
          <AnimatePresence mode="wait">
            {view === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <Dashboard
                  lessons={lessons}
                  completedDays={completedDays}
                  scores={scores}
                  onSelectLesson={handleSelectDay}
                />
              </motion.div>
            )}

            {view === "create" && (
              <motion.div
                key="create"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <CreateLesson
                  lessons={lessons}
                  onCreate={handleCreateLesson}
                  onBack={() => navigate("/", "dashboard")}
                />
              </motion.div>
            )}

            {view === "lesson" && currentLesson && (
              <motion.div
                key="lesson"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <LessonTestArena
                  lesson={currentLesson}
                  onBack={() => setView("dashboard")}
                  onSaveLesson={handleSaveLesson}
                  isCompleted={completedDays.includes(currentLesson.day)}
                  score={scores[currentLesson.day]}
                  onRecordScore={(type, percent) =>
                    handleRecordScore(currentLesson.day, type, percent)
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
