"use client";

import React from "react";

/**
 * Template — ใช้สำหรับจัดการ Page Transitions ใน Next.js (App Router)
 * ทุกครั้งที่เปลี่ยนหน้า องค์ประกอบในนี้จะถูก Re-mount ทำให้เกิด Animation ใหม่ทุกครั้ง
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-page-in h-full w-full">
      {children}
    </div>
  );
}
