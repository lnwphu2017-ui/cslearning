"use client";

import { useEffect, useState } from "react";

/**
 * ThemeToggle Component
 * ส่วนประกอบสำหรับสลับโหมดมืด (Dark Mode) และโหมดสว่าง (Light Mode)
 * ดีไซน์พรีเมียมจาก Uiverse.io โดย Galahhad
 */
export function ThemeToggle() {
  // สถานะโหมดมืด (snake_case ตามกฎ)
  const [is_dark_mode, set_is_dark_mode] = useState(false);

  // ตรวจสอบค่าเริ่มต้นเมื่อ Component โหลดครั้งแรก
  useEffect(() => {
    // ดึงค่าธีมจาก localStorage หรือใช้ค่าจากระบบ (System Preference)
    const saved_theme = localStorage.getItem("theme");
    const system_prefers_dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (saved_theme === "dark" || (!saved_theme && system_prefers_dark)) {
      set_is_dark_mode(true);
      document.documentElement.classList.add("dark");
    } else {
      set_is_dark_mode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // ฟังก์ชันสำหรับจัดการการสลับโหมด (Handle... ตามกฎ)
  const HandleToggle = () => {
    const new_mode = !is_dark_mode;
    set_is_dark_mode(new_mode);
    
    // อัปเดตคลาสที่ html element และบันทึกลง localStorage
    if (new_mode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <label className="theme-switch" aria-label="Toggle Theme">
      <input 
        type="checkbox" 
        className="theme-switch__checkbox" 
        checked={is_dark_mode}
        onChange={HandleToggle}
      />
      <div className="theme-switch__container">
        <div className="theme-switch__circle-container">
          <div className="theme-switch__sun-moon-container">
            <div className="theme-switch__moon">
              <div className="theme-switch__spot"></div>
              <div className="theme-switch__spot"></div>
              <div className="theme-switch__spot"></div>
            </div>
          </div>
        </div>
        <div className="theme-switch__stars-container">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 55" fill="none" className="w-full h-full">
            <circle cx="20" cy="15" r="1.5" fill="white" />
            <circle cx="50" cy="35" r="1" fill="white" />
            <circle cx="80" cy="20" r="2" fill="white" />
            <circle cx="110" cy="40" r="1.5" fill="white" />
            <circle cx="130" cy="10" r="1" fill="white" />
          </svg>
        </div>
        <div className="theme-switch__clouds"></div>
      </div>
    </label>
  );
}
