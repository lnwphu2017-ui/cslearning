"use client";

import { useState, useEffect } from "react";

interface GeneratingLoadingProps {
  title?: string;
  subtitle?: string;
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
  messages = defaultMessages
}: GeneratingLoadingProps & { messages?: string[] }) {
  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="h-full flex flex-col items-center justify-center pb-20 animate-in fade-in duration-500">
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
      <div className="mt-2 text-center">
        <h3 className="text-xl md:text-2xl font-bold text-[var(--color-black)] mb-1">
          {title}
        </h3>
        <p className="text-sm md:text-base text-[var(--color-gray-500)] animate-pulse min-h-[1.5em] transition-all duration-500">
          {subtitle || messages[currentMessage]}
        </p>
      </div>
    </div>
  );
}
