import React, { useState } from "react";
import { Lesson, LessonScore } from "../types";
import {
  BookOpen, CheckCircle, Search, Play, Sparkles, GraduationCap
} from "lucide-react";
import { motion } from "motion/react";

interface DashboardProps {
  lessons: Lesson[];
  completedDays: number[];
  scores: Record<number, LessonScore>;
  onSelectLesson: (id: number) => void;
}

export default function Dashboard({
  lessons,
  completedDays,
  scores,
  onSelectLesson,
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTheme, setFilterTheme] = useState<string>("all");

  // Get unique themes
  const themes = ["all", ...Array.from(new Set(lessons.map((l) => l.theme)))].filter(Boolean);

  // Filter lessons based on search text 
  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.vocabQuestions.some((q) => q.question.toLowerCase().includes(searchQuery.toLowerCase())) ||
      lesson.grammarQuestions.some((q) => q.question.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTheme = filterTheme === "all" || lesson.theme === filterTheme;
    return matchesSearch && matchesTheme;
  });

  const completionPercentage = Math.round(
    (completedDays.length / 30) * 100
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8" id="dashboard-container">
      
      {/* Intro Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl text-white shadow-sm space-y-3">
        <div className="inline-flex items-center space-x-1 bg-white/15 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3 text-indigo-300" />
          <span>JLPT N4 бэлтгэл</span>
        </div>
        <h2 className="text-xl md:text-2xl font-black tracking-tight leading-none text-white">
          30 Өдрийн Япон хэлний сорилт
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed font-semibold max-w-2xl">
          7 сарын 5 хүртэл JLPT N4 шалгалтанд хайрыгаа бэлдэхэд зориулж хийлээ амжилт хүсье! Kanji study app аа өдөр болгон бэлдэхээ мартваа хайраа.
        </p>

        {/* Simple Progress Bar */}
        <div className="pt-2 space-y-1.5 max-w-md">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-300 font-mono">
            <span>Ахиц: {completedDays.length} / 30 Өдөр</span>
            <span>{completionPercentage}%</span>
          </div>
          <div className="bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-400 h-full transition-all duration-300" 
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Course Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-3xs">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Хичээл, сорил эсвэл асуултуудаас хайх..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-lg outline-hidden focus:border-indigo-600 bg-slate-50/50 focus:bg-white font-medium"
          />
        </div>

        {/* Filter Themes */}
        <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto scrollbar-none pb-1 md:pb-0">
          <span className="text-xs text-slate-500 font-bold shrink-0">Ангилал:</span>
          {themes.slice(0, 5).map((theme) => (
            <button
              key={theme}
              onClick={() => setFilterTheme(theme)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border shrink-0 cursor-pointer transition-all ${
                filterTheme === theme
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-3xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              {theme === "all" ? "Бүгд" : theme}
            </button>
          ))}
        </div>
      </div>

      {/* 30 Days Lesson Roadmap Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold tracking-tight text-slate-900 flex items-center space-x-2">
            <GraduationCap className="text-indigo-600 w-5 h-5 animate-bounce" />
            <span>Сурах замнал (30 хоног)</span>
          </h2>
          <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
            30 өдрийн сорилууд
          </span>
        </div>

        {/* Roadmap list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="lessons-grid">
          {filteredLessons.map((lesson) => {
            const isCompleted = completedDays.includes(lesson.day);
            const score = scores[lesson.day];

            return (
              <motion.div
                key={lesson.id}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  onSelectLesson(lesson.day);
                }}
                className={`flex flex-col justify-between bg-white rounded-xl border p-5 cursor-pointer shadow-3xs hover:shadow-2xs transition-all relative overflow-hidden ${
                  isCompleted
                    ? "border-emerald-300 bg-emerald-50/5"
                    : "border-slate-200 hover:border-slate-350"
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold font-mono tracking-wider text-indigo-600">
                      Өдөр {lesson.day} / 30
                    </span>
                    <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase font-mono">
                      {lesson.theme || "N4"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-sans font-extrabold text-slate-800 text-sm leading-tight group-hover:text-primary transition-colors">
                      {lesson.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-semibold line-clamp-1">
                      Сорил: {lesson.vocabQuestions.length} үг • {lesson.grammarQuestions.length} дүрэм
                    </p>
                  </div>

                  {/* Performance: best test percentages once attempted */}
                  {score && (score.vocab > 0 || score.grammar > 0) && (
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className={`text-[9.5px] font-bold font-mono px-1.5 py-0.5 rounded ${
                        score.vocab >= 90 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        Үг {score.vocab}%
                      </span>
                      <span className={`text-[9.5px] font-bold font-mono px-1.5 py-0.5 rounded ${
                        score.grammar >= 90 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        Дүрэм {score.grammar}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Subtask Indicators showing completed ticks */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {lesson.listeningUrl ? (
                    <span className="text-[10px] text-slate-400 font-mono font-bold flex items-center space-x-0.5">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
                      <span>Сонсох видеотой</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono font-semibold">Сонсох бичлэггүй</span>
                  )}

                  {isCompleted ? (
                    <div className="flex items-center space-x-1 text-emerald-600 text-[11px] font-bold">
                      <CheckCircle className="w-4 h-4 fill-emerald-100 text-emerald-600" />
                      <span>Төгссөн</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-indigo-600 text-[11px] font-extrabold hover:text-indigo-800">
                      <span>Эхлэх сорилт</span>
                      <Play className="w-3 h-3 fill-indigo-600" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {filteredLessons.length === 0 && lessons.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400 space-y-3 bg-white rounded-xl border border-dashed border-slate-300 p-6">
              <BookOpen className="w-12 h-12 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-600 text-sm">Одоогоор хичээл алга байна.</p>
            </div>
          )}

          {filteredLessons.length === 0 && lessons.length > 0 && (
            <div className="col-span-full py-16 text-center text-slate-400 space-y-3 bg-white rounded-xl border border-slate-200 p-6">
              <BookOpen className="w-12 h-12 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-600 text-sm">Хайлтын илэрц олдсонгүй.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterTheme("all");
                }}
                className="text-indigo-600 font-bold underline hover:text-indigo-700 text-xs cursor-pointer"
              >
                Бүх хичээлийг харах
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
