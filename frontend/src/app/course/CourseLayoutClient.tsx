"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import courses_data from "@/data/courses.json";
import { usePathname } from "next/navigation";

export default function CourseLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const slug = pathname?.split("/").pop();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    // 1. ซิงค์สถานะจาก localStorage ทันทีที่ mount (จะยังไม่มี transition เพราะ isMounted ยังเป็น false)
    const saved = localStorage.getItem("sidebar_open");
    if (saved !== null) {
      setIsSidebarOpen(saved === "true");
    }
    
    // 2. หน่วงเวลาเล็กน้อยก่อนเปิดใช้งาน isMounted เพื่ออนุญาตให้มี animation ในการกดครั้งต่อๆ ไป
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleToggleSidebar = () => {
    const nextState = !isSidebarOpen;
    setIsSidebarOpen(nextState);
    localStorage.setItem("sidebar_open", String(nextState));
  };

  // Find current course and its year courses for the sidebar
  let yearCourses: any[] = [];
  courses_data.years.forEach((y) => {
    const found = y.courses.find((c) => c.slug === slug);
    if (found) {
      yearCourses = y.courses;
    }
  });

  return (
    <div className="h-screen w-screen overflow-hidden bg-transparent flex flex-col md:flex-row font-sans no-scrollbar">
      
      {/* Mobile Header (Only visible on small screens) */}
      <div className="md:hidden flex items-center justify-between px-6 h-16 bg-white border-b border-[var(--color-gray-200)] shrink-0 z-40">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--color-primary)] rounded-lg flex items-center justify-center shrink-0 shadow-sm">
          </div>
          <span className="font-bold text-lg tracking-tight text-[var(--color-primary)]">CSLearning</span>
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-[var(--color-gray-500)] hover:text-black transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* 1. Left Sidebar */}
      {/* Mobile Overlay Background */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`
          group
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} 
          fixed md:relative top-0 left-0 bottom-0 z-[110] md:z-30
          ${isSidebarOpen ? 'w-64 xl:w-64 lg:w-60 md:w-56' : 'w-20'} 
          ${isMounted ? 'transition-all duration-400 ease-in-out' : ''} 
          flex flex-col shrink-0 bg-white border-r border-[var(--color-gray-200)] shadow-2xl md:shadow-none
        `}
      >
        <div className={`h-16 flex items-center mt-6 ${isMounted ? 'transition-all duration-300' : ''} ${isSidebarOpen ? 'px-6' : 'px-0 justify-center'}`}>
          <Link href="/" className={`flex items-center gap-3 group/logo ${isSidebarOpen ? 'w-full overflow-hidden' : ''}`}>
            <div className="w-9 h-9 md:w-10 md:h-10 bg-[var(--color-primary)] rounded-[10px] md:rounded-[12px] flex items-center justify-center shrink-0 relative overflow-hidden shadow-sm">
               {/* Target Layers */}
               <div className="w-6 h-6 md:w-7 md:h-7 bg-white rounded-[6px] md:rounded-[8px] flex items-center justify-center">
                  <div className="w-3 h-3 md:w-3.5 md:h-3.5 bg-[var(--color-primary)] rounded-[3px] md:rounded-[4px]" />
               </div>
               <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-30" />
            </div>
            {isSidebarOpen && (
              <span className="font-bold text-base lg:text-[19px] tracking-tight text-[var(--color-primary)] whitespace-nowrap group-hover/logo:opacity-80 transition-all">
                CSLearning
              </span>
            )}
          </Link>
          
          {/* Close button for mobile menu */}
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden ml-auto p-2 text-[var(--color-gray-400)] hover:text-black transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Sidebar Menu Items */}
        <div className="flex-1 relative overflow-hidden px-2 md:px-3 mt-6">
           <div className="h-full overflow-y-auto no-scrollbar flex flex-col gap-1.5 pb-10">
            {yearCourses.map((c: any) => (
              <Link
                key={c.code}
                href={`/course/${c.slug}`}
                title={c.name_en}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 md:gap-3 px-3 py-3 transition-all overflow-hidden rounded-xl ${c.slug === slug
                  ? 'text-[var(--color-primary)] font-bold'
                  : 'text-[var(--color-black)] hover:bg-[var(--color-gray-50)] font-medium'
                  }`}
              >
                <div className={`shrink-0 flex items-center justify-center w-5 h-5 md:w-6 md:h-6 transition-colors ${c.slug === slug ? 'text-[var(--color-primary)]' : 'text-[var(--color-gray-400)]'}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                </div>
                {isSidebarOpen && (
                  <span className={`text-[12px] lg:text-[13px] tracking-wide truncate ${c.slug === slug ? 'text-[var(--color-primary)]' : 'text-[var(--color-gray-400)] transition-colors'}`}>
                    {c.name_en}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Toggle Button (Hidden on mobile) */}
        <button
          onClick={handleToggleSidebar}
          className="hidden md:flex absolute top-1/2 -right-3.5 -translate-y-1/2 w-7 h-7 items-center justify-center bg-white border border-[var(--color-gray-200)] rounded-full shadow-sm text-[var(--color-gray-500)] hover:text-[var(--color-black)] z-40 transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-105 cursor-pointer"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform duration-300 ${!isSidebarOpen && 'rotate-180'}`}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </aside>

      {/* Page Content area (Children will be injected here) */}
      {/* ปรับ gap ให้เล็กลงในหน้าจอปกติเพื่อให้เหลือพื้นที่เนื้อหา */}
      <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-3 lg:gap-4 p-2 md:p-3 lg:p-4 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}
