"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import courses_data from "@/data/courses.json";

/* ===== ข้อมูลชั้นปีจาก courses.json ===== */
const YEAR_DATA = courses_data.years.map((year) => ({
  year: year.year,
  subtitle: year.subtitle,
  total_courses: year.courses.length,
  total_chapters: year.courses.reduce((sum, c) => sum + c.chapters, 0),
}));

import { useAuth } from "@/contexts/AuthContext";

/* ========================================================================== */
/*  COMPONENTS                                                                */
/* ========================================================================== */

/**
 * Navbar — แถบนำทางด้านบน (Minimal)
 */
function Navbar() {
  const { user, openModal, logout } = useAuth();

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-[var(--color-gray-200)]">
      <div className="w-full px-6 md:px-12 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 md:gap-3 group/logo">
          <div className="w-8 h-8 md:w-9 md:h-9 bg-[var(--color-primary)] rounded-[8px] md:rounded-[10px] flex items-center justify-center shrink-0 relative overflow-hidden shadow-sm">
             {/* Target Layers */}
             <div className="w-5 h-5 md:w-6 md:h-6 bg-white rounded-[5px] md:rounded-[7px] flex items-center justify-center">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-[var(--color-primary)] rounded-[2.5px] md:rounded-[3.5px]" />
             </div>
             <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-30" />
          </div>
          <span className="text-base md:text-lg font-bold tracking-tight text-[var(--color-primary)] group-hover:opacity-80 transition-all">CSLearning</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-xs md:sm font-medium text-[var(--color-gray-600)] hidden sm:block">
              {user.displayName || user.email}
            </span>
            <button
              onClick={logout}
              className="px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium text-[var(--color-gray-500)] hover:text-black transition-colors"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={openModal}
            className="px-5 py-2 text-xs md:text-sm font-bold bg-[var(--color-primary)] text-white rounded-xl
                       transition-all duration-200
                       shadow-[0_4px_0_0_rgba(100,90,240,1)]
                       hover:shadow-[0_6px_0_0_rgba(100,90,240,1)]
                       hover:-translate-y-0.5
                       active:translate-y-1 active:shadow-none"
          >
            Sign in
          </button>
        )}
      </div>
    </nav>
  );
}

/**
 * GeometricShapes — รูปทรงเรขาคณิตตกแต่ง
 */
function GeometricShapes() {
  return (
    <>
      {/* สี่เหลี่ยมเอียง — ซ้ายบน */}
      <div
        className="geo-shape w-24 h-24 md:w-36 md:h-36 top-16 md:top-12 left-[4%] hidden sm:block opacity-60"
        style={{ transform: "rotate(-12deg)", animation: "Float 8s ease-in-out infinite", "--rotate": "-12deg" } as React.CSSProperties}
      />
      {/* สี่เหลี่ยมเอียง — ขวากลาง */}
      <div
        className="geo-shape w-20 h-20 md:w-28 md:h-28 top-[25%] md:top-[18%] right-[6%] hidden md:block opacity-60"
        style={{ transform: "rotate(45deg)", animation: "Float 6s ease-in-out infinite", "--rotate": "45deg" } as React.CSSProperties}
      />
      {/* สี่เหลี่ยมเอียง — ขวาล่าง */}
      <div
        className="geo-shape w-32 h-32 md:w-44 md:h-44 bottom-[8%] right-[3%] hidden lg:block opacity-60"
        style={{ transform: "rotate(15deg)", animation: "Float 10s ease-in-out infinite", "--rotate": "15deg" } as React.CSSProperties}
      />
    </>
  );
}

/* ========================================================================== */
/*  MAIN PAGE — Single Screen Scaling                                        */
/* ========================================================================== */

export default function HomePage() {
  return (
    <main className="fixed inset-0 h-screen w-screen overflow-hidden flex flex-col no-scrollbar bg-transparent">
      <Navbar />
      <GeometricShapes />

      {/* ===== Content Container — จัดกลางทั้งแนวตั้งและแนวนอน ===== */}
      {/* เพิ่ม overflow-y-auto เพื่อความปลอดภัยในหน้าจอที่เตี้ยมากๆ (Short screens) */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 md:px-8 py-6 md:py-10 overflow-y-auto no-scrollbar">

        {/* ===== Title Section ===== */}
        <div className="text-center mb-8 md:mb-12 lg:mb-16 animate-fade-in-up shrink-0">
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter leading-[1.1] mb-4 text-[var(--color-primary)]">
            Computer
            <br />
            <span className="bg-white px-3 md:px-4 py-1 md:py-2 mt-2 border-[2.5px] md:border-[5px] border-[var(--color-primary)] rounded-[1rem] md:rounded-[2rem] inline-block -rotate-2 shadow-[4px_4px_0px_0px_var(--color-primary)] md:shadow-[8px_8px_0px_0px_var(--color-primary)]">
              Science
            </span>
          </h1>
          <p className="text-xs md:text-sm lg:text-base text-[var(--color-gray-500)] max-w-[280px] sm:max-w-md mx-auto leading-relaxed">
            AI-powered learning platform that adapts to your pace and style
          </p>
        </div>

        {/* ===== Year Cards — Jigsaw Interlocking 4 ใบ ===== */}
        {/* ใช้ max-w-6xl และ h-auto เพื่อให้สเกลดูดีในหน้าจอโน้ตบุ๊ก */}
        <div
          className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 animate-fade-in-up px-4 sm:px-0 mb-4"
          style={{ animationDelay: "150ms", animationFillMode: "both" }}
        >
          {YEAR_DATA.map((year) => {
            return (
              <Link
                key={year.year}
                href={`/year/${year.year}`}
                className="group relative flex flex-col justify-between 
                           p-5 md:p-6 lg:p-8 min-h-[140px] md:min-h-[200px] lg:min-h-[220px]
                           bg-white hover:bg-[var(--color-primary)] hover:text-white
                           border-2 border-[var(--color-gray-200)] hover:border-[var(--color-primary)]
                           transition-all duration-200 rounded-[2rem] md:rounded-[2.8rem]
                           shadow-[0_8px_0_0_var(--color-gray-200)] 
                           hover:shadow-[0_12px_0_0_rgba(124,115,255,0.4)]
                           hover:-translate-y-2
                           active:translate-y-1 active:shadow-[0_4px_0_0_rgba(124,115,255,0.4)]
                           year-card overflow-hidden"
              >
                {/* ตัวเลขชั้นปีขนาดใหญ่จางๆ ด้านหลัง */}
                <span className="absolute -bottom-4 -right-3 text-[70px] md:text-[100px] lg:text-[120px] font-black leading-none text-[var(--color-gray-100)] group-hover:text-white/20 transition-colors duration-300 select-none z-0">
                  {year.year}
                </span>

                {/* ข้อมูลชั้นปี */}
                <div className="relative z-20">
                  <h2 className="text-lg md:text-xl lg:text-2xl font-bold tracking-tight mb-1 text-[var(--color-primary)] group-hover:text-white">
                    YEAR {year.year}
                  </h2>
                  <p className="year-subtitle text-[10px] md:text-xs lg:text-sm text-[var(--color-gray-500)] leading-relaxed group-hover:text-[var(--color-gray-400)] transition-colors line-clamp-2">
                    {year.subtitle}
                  </p>
                </div>

                {/* สถิติ */}
                <div className="relative z-20 mt-2">
                  <span className="year-stats text-[9px] md:text-[10px] lg:text-xs font-mono text-[var(--color-gray-400)] uppercase tracking-wider transition-colors">
                    {year.total_courses} courses
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
