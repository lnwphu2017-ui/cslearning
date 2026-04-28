"use client";
import React from "react";

/**
 * BackgroundAnimation Component
 * ดีไซน์ใหม่: Clean White Theme (กลับมาใช้พื้นหลังสีขาวที่ดูพรีเมียมและไม่โล่ง)
 */
export const BackgroundAnimation = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-white">
      {/* 🔮 Ultra-Subtle Pastel Blobs (ก้อนสีพาสเทลจางๆ ช่วยให้พื้นหลังมีมิติ) */}
      <div className="absolute top-[-10%] left-[-5%] w-[60vw] h-[60vw] bg-[var(--color-primary)] opacity-[0.06] blur-[120px] rounded-full animate-blob" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[55vw] h-[55vw] bg-[var(--color-primary)] opacity-[0.05] blur-[100px] rounded-full animate-blob animation-delay-2000" />
      <div className="absolute top-[30%] right-[10%] w-[40vw] h-[40vw] bg-[var(--color-primary-dark)] opacity-[0.04] blur-[90px] rounded-full animate-blob animation-delay-4000" />

      {/* 🟦 Floating Minimalist Shapes (รูปทรงเรขาคณิตแบบบางเบา) */}
      <div className="absolute inset-0">
        <div className="absolute top-[15%] left-[10%] w-40 h-40 border-[1px] border-[var(--color-gray-200)] opacity-[0.15] rounded-[32px] animate-float-rotate" />
        <div className="absolute bottom-[20%] right-[5%] w-56 h-56 border-[1px] border-[var(--color-gray-200)] opacity-[0.1] rounded-[48px] animate-slow-spin" />
        <div className="absolute top-[40%] right-[20%] w-24 h-24 border-[1px] border-[var(--color-gray-200)] opacity-[0.08] rounded-[20px] animate-float-rotate animation-delay-2000" />
      </div>

      {/* 🕸️ Subtle Pattern (จุดเล็กๆ ให้พื้นหลังไม่ดูแบนราบ) */}
      <div 
        className="absolute inset-0 opacity-[0.02]" 
        style={{ 
          backgroundImage: `radial-gradient(var(--color-black) 0.5px, transparent 0.5px)`, 
          backgroundSize: '48px 48px' 
        }} 
      />
      
      {/* 🌫️ Fine Grainy Texture (ความหรูหราแบบจางพิเศษ) */}
      <div className="absolute inset-0 opacity-[0.01] pointer-events-none mix-blend-overlay"
           style={{ backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")` }} />
    </div>
  );
};
