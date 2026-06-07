import React, { useState, useEffect, useRef } from "react";
import { Lesson } from "../types";
import { Send, X, MessageSquare, Sparkles, RefreshCw, User, HelpCircle, ArrowRight } from "lucide-react";
import { playChime } from "../utils/audio";
import { motion, AnimatePresence } from "motion/react";

interface AITutorProps {
  lesson?: Lesson;
  prefillPrompt?: { text: string; label: string } | null;
  onClearPrefill?: () => void;
  onClose: () => void;
}

interface ChatMessage {
  role: "user" | "model";
  text: string;
  time: string;
}

export default function AITutor({
  lesson,
  prefillPrompt,
  onClearPrefill,
  onClose,
}: AITutorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      role: "model",
      text: "Конничива! Би таны N4 түвшний Япон хэлний багш Айко байна! (愛子先生)\n\nЯпон хэлний туслах үг, дүрмийн бүтэц, Ханзны дуудлага, эсвэл үгийн нарийн ялгааны талаар надаас юуг ч хамаагүй асуугаарай. Өдөр бүр сурах аялалд тань туслахдаа би баяртай байх болно! 🌸",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Prefill prompt handler (triggered from clicking 'Ask Aiko-sensei' next to words/patterns)
  useEffect(() => {
    if (prefillPrompt && prefillPrompt.text) {
      handleSendMessage(prefillPrompt.text);
      if (onClearPrefill) onClearPrefill();
    }
  }, [prefillPrompt]);

  // Keep chat scrolled down on incoming messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = (customMessage || inputVal).trim();
    if (!textToSend) return;

    if (!customMessage) {
      setInputVal("");
    }

    const newMessage: ChatMessage = {
      role: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newMessage]);
    setIsLoading(true);
    playChime("click");

    try {
      // Create request payload conforming exactly to Server specifications
      const payload = {
        message: textToSend,
        history: messages.map((m) => ({ role: m.role, text: m.text })),
        context: lesson ? { day: lesson.day, title: lesson.title, theme: lesson.theme } : null,
      };

      const response = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: data.text || "Одоогоор хариулт бэлтгэж чадсангүй. Толь бичгээ дахин шалгаад хариулъя!",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
      ]);
      playChime("success");
    } catch (err: any) {
      console.error("Failed tutor chat:", err);
      // Fallback response inside the chat bubble so standard users enjoy frictionless flow
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "Гомэн насай! Сүлжээнд бага зэрэг алдаа гарлаа. Гэхдээ Япон хэлний туслах үгс N4-т маш чухал гэдгийг санаарай! *Wa* (は) нь өгүүлбэрийн гол сэдвийг заадаг бол *Ga* (が) нь тодорхой нэр үгийг тодотгодог. Ямар дүрмийг илүү дэлгэрэнгүй тайлбарлах вэ? 🌸",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
      ]);
      playChime("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-border-main w-full" id="ai-tutor-sidebar">
      {/* Sidebar Header */}
      <div className="p-4 bg-linear-to-r from-blue-50 to-indigo-50/20 border-b border-border-main flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
            愛
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center">
              <span>Айко багш</span>
              <Sparkles className="w-3.5 h-3.5 text-primary ml-1.5" />
            </h3>
            <span className="text-[10px] text-primary font-bold block leading-none">N4 түвшний AI Багш</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg border border-slate-200 bg-white shadow-3xs cursor-pointer"
          title="Хаах"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message Stream */}
      <div
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/55 scrollbar-thin"
      >
        {messages.map((m, idx) => {
          const isModel = m.role === "model";
          return (
            <div
              key={idx}
              className={`flex items-start gap-2.5 max-w-[90%] ${isModel ? "mr-auto text-left" : "ml-auto flex-row-reverse text-right"}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 font-bold ${
                  isModel ? "bg-primary text-white" : "bg-slate-900 text-slate-100"
                }`}
              >
                {isModel ? "愛" : <User className="w-4 h-4" />}
              </div>

              <div className="space-y-1">
                <div
                  className={`p-3.5 rounded-2xl text-xs md:text-sm shadow-3xs text-left leading-relaxed font-semibold whitespace-pre-wrap ${
                    isModel ? "bg-white text-slate-800 border border-slate-150/50" : "bg-primary text-white"
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-slate-400 block font-mono pl-1">
                  {m.time}
                </span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2.5 mr-auto">
            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs animate-bounce">
              愛
            </div>
            <div className="bg-white text-slate-500 border border-slate-100 p-3 rounded-2xl flex items-center space-x-2 text-xs shadow-3xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
              <span className="font-bold">Айко багш бодож байна...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested helper items for fast interactions */}
      <div className="px-4 py-2 bg-slate-55 border-t border-slate-100 bg-slate-50 flex gap-2 overflow-x-auto scrollbar-none pb-1.5 font-mono text-[9px]">
        <button
          onClick={() => handleSendMessage("~たら болон ~ば нөхцөлт хэлбэрүүдийн ялгааг тайлбарлана уу.")}
          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-600 hover:border-primary/50 font-bold shrink-0 cursor-pointer text-[10px]"
        >
          たら болон ば ялгаа?
        </button>
        <button
          onClick={() => handleSendMessage("Үйлдэгдэх хэвийн бүтцийг (~rareru) хялбар цээжлэх арга хэлж өгөөрэй.")}
          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-600 hover:border-primary/50 font-bold shrink-0 cursor-pointer text-[10px]"
        >
          Идэвхгүй хэв цээжлэх үү?
        </button>
        <button
          onClick={() => handleSendMessage("Хүндэтгэлийн хэллэг болох (O~ni naru) хэрэглэсэн 3 жишээ яриа өгнө үү.")}
          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-600 hover:border-primary/50 font-bold shrink-0 cursor-pointer text-[10px]"
        >
          Хүндэтгэлийн үгийн жишээ?
        </button>
      </div>

      {/* Sidebar Input form */}
      <div className="p-4 bg-white border-t border-border-main flex gap-2">
        <input
          type="text"
          placeholder="Япон хэлний туслах үг, дүрмийн асуултаа асуугаарай..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSendMessage();
            }
          }}
          disabled={isLoading}
          className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm outline-hidden focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 font-medium"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={isLoading || !inputVal.trim()}
          className="p-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl shadow-xs transition-colors flex items-center justify-center disabled:opacity-40 cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
