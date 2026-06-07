import React, { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import LessonTestArena from "./components/LessonTestArena";
import AITutor from "./components/AITutor";
import { defaultLessons } from "./data/defaultLessons";
import { playChime } from "./utils/audio";
import { Lesson, UserProgress } from "./types";
import { 
  Sparkles, GraduationCap, ArrowLeft, MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const LESSONS_STORAGE_KEY = "n4-custom-lessons-data-v2";
const PROGRESS_STORAGE_KEY = "n4-custom-lessons-progress-v2";

export default function App() {
  // Navigation states: "dashboard" | "lesson"
  const [view, setView] = useState<"dashboard" | "lesson">("dashboard");
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  
  // Lessons data state loaded dynamically via localStorage
  const [lessons, setLessons] = useState<Lesson[]>([]);

  // Array of completed day numbers
  const [completedDays, setCompletedDays] = useState<number[]>([]);

  // AI Tutor drawer states
  const [aiTutorOpen, setAiTutorOpen] = useState(false);
  const [prefillPrompt, setPrefillPrompt] = useState<{ text: string; label: string } | null>(null);

  // Load configuration on mount
  useEffect(() => {
    try {
      // 1. Load dynamic lessons
      const savedLessons = localStorage.getItem(LESSONS_STORAGE_KEY);
      if (savedLessons) {
        setLessons(JSON.parse(savedLessons));
      } else {
        // Seed default template lessons
        setLessons(defaultLessons);
        localStorage.setItem(LESSONS_STORAGE_KEY, JSON.stringify(defaultLessons));
      }

      // 2. Load progress completed days
      const savedProgress = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (savedProgress) {
        setCompletedDays(JSON.parse(savedProgress));
      }
    } catch (e) {
      console.error("Local storage load failed:", e);
      // Fallback
      setLessons(defaultLessons);
    }
  }, []);

  const currentLesson: Lesson | undefined = lessons.find((l) => l.day === selectedDayId);

  // Mark Day as Completed Toggle
  const handleToggleComplete = (dayNum: number) => {
    let updated: number[];
    if (completedDays.includes(dayNum)) {
      updated = completedDays.filter((d) => d !== dayNum);
      playChime("error");
    } else {
      updated = [...completedDays, dayNum];
      playChime("success");
      alert(`🎉 Баяр хүргэе! ${dayNum} дахь өдрийн сорилтуудыг амжилтай дуусгалаа!`);
    }
    setCompletedDays(updated);
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Progress save failed:", e);
    }
  };

  // Save manual lesson updates (sonsoh video link, shine ug test, durem test)
  const handleSaveLesson = (updatedLesson: Lesson) => {
    const updatedLessons = lessons.map((l) => l.day === updatedLesson.day ? updatedLesson : l);
    setLessons(updatedLessons);
    try {
      localStorage.setItem(LESSONS_STORAGE_KEY, JSON.stringify(updatedLessons));
      alert(`💾 Өдөр ${updatedLesson.day} Хичээлийг амжилттай хадгаллаа!`);
    } catch (e) {
      console.error("Lessons save failed:", e);
    }
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
            onClick={() => { setView("dashboard"); playChime("click"); }}
            className="flex items-center space-x-2.5 cursor-pointer hover:opacity-90 transition-opacity"
            id="brand-logo"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-3xs">
              日
            </div>
            <div>
              <h1 className="font-sans font-black text-slate-900 tracking-tight leading-none text-sm md:text-base">
                N4-ийн шалгалтанд амжилт!
              </h1>
              <span className="text-[10px] text-slate-400 font-bold font-mono">Нийт 30 хоногийн системчилсэн дасгал</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Elegant AI Companion tutor shortcut */}
            <button
              onClick={() => {
                setAiTutorOpen(!aiTutorOpen);
                playChime("click");
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                aiTutorOpen
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-3xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Айко багш</span>
            </button>
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
                  onSelectLesson={handleSelectDay}
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
                  onToggleComplete={() => handleToggleComplete(currentLesson.day)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* AI Tutor Sidebar Companion */}
        <AnimatePresence>
          {aiTutorOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="hidden lg:block h-full border-l border-slate-200 shadow-2xl relative shrink-0 z-30 font-sans"
            >
              <AITutor
                lesson={currentLesson || undefined}
                prefillPrompt={prefillPrompt}
                onClearPrefill={() => setPrefillPrompt(null)}
                onClose={() => setAiTutorOpen(false)}
              />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile AI Tutor Drawer Fallback */}
      {aiTutorOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40 flex justify-end" id="mobile-ai-tutor-overlay">
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="w-full max-w-xs h-full"
          >
            <AITutor
              lesson={currentLesson || undefined}
              prefillPrompt={prefillPrompt}
              onClearPrefill={() => setPrefillPrompt(null)}
              onClose={() => setAiTutorOpen(false)}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}
