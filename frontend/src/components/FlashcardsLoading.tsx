"use client";

import { useState, useEffect } from "react";

interface GeneratingLoadingProps {
  title?: string;
  subtitle?: string;
  progress?: number; // 0 to 100
}

const defaultMessages = [
  "กำลังวิเคราะห์เนื้อหาบทเรียน...",
  "กำลังจัดลำดับความสำคัญของเนื้อหา...",
  "กำลังสร้างเนื้อหาที่เข้าใจง่าย...",
  "กำลังตรวจสอบความถูกต้องของข้อมูล...",
  "อีกอึดใจเดียว ข้อมูลกำลังจะพร้อมแล้ว...",
];

export function FlashcardsLoading({ 
  title = "Generating Flashcards", 
  subtitle,
  messages = defaultMessages,
  progress
}: GeneratingLoadingProps & { messages?: string[] }) {
  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (messages.length > 0) {
        setCurrentMessage((prev) => (prev + 1) % messages.length);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      {/* 1. Progress Bar at the Top - Aligned with Header Padding */}
      {progress !== undefined && (
        <div className="w-full px-6 md:px-8 lg:px-14 pt-6 shrink-0">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-[var(--color-gray-400)] uppercase tracking-widest">
              Overall Progress
            </span>
            <span className="text-sm font-black text-[var(--color-primary)]">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full h-2 bg-[var(--color-gray-100)] rounded-full overflow-hidden border border-[var(--color-gray-200)]/50">
            <div 
              className="h-full bg-[var(--color-primary)] transition-all duration-1000 ease-in-out shadow-[0_0_12px_-2px_rgba(177,178,255,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 2. Centered Loader and Text Section */}
      <div className="flex-1 flex flex-col items-center justify-center pb-20">
        <div className="relative w-full h-32 flex items-center justify-center">
          <div className="banter-loader">
            <div className="banter-loader__box"></div>
            <div className="banter-loader__box"></div>
            <div className="banter-loader__box"></div>
            <div className="banter-loader__box"></div>
            <div className="banter-loader__box"></div>
            <div className="banter-loader__box"></div>
            <div className="banter-loader__box"></div>
            <div className="banter-loader__box"></div>
            <div className="banter-loader__box"></div>
          </div>
        </div>
        
        <div className="mt-2 text-center w-full max-w-sm md:max-w-2xl px-6">
          <h3 className="text-xl md:text-2xl font-bold text-[var(--color-black)] mb-1">
            {title}
          </h3>
          {(subtitle || (messages.length > 0)) && (
            <p className="text-sm md:text-base text-[var(--color-gray-500)] animate-pulse min-h-[1.5em] transition-all duration-500 mb-6 truncate whitespace-nowrap">
              {subtitle || messages[currentMessage]}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
