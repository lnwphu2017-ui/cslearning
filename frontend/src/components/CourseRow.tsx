"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface CourseRowProps {
  course: {
    code: string;
    name_en: string;
    name_th: string;
    chapters: number;
    slug: string;
  };
  indexNumber: string;
}

export function CourseRow({ course, indexNumber }: CourseRowProps) {
  const router = useRouter();
  const { user, openModal } = useAuth();

  const handleCourseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      openModal();
    } else {
      router.push(`/course/${course.slug}`);
    }
  };

  return (
    <div
      onClick={handleCourseClick}
      className="group bg-white border border-[var(--color-gray-200)] rounded-2xl p-5 md:p-6 mb-3 
                 flex flex-col sm:flex-row sm:items-center justify-between 
                 transition-all duration-300 hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] hover:shadow-md
                 cursor-pointer"
    >
      {/* ด้านซ้าย: ลำดับ + รหัส + ชื่อวิชา */}
      <div className="flex items-start gap-4 sm:gap-6 mb-4 sm:mb-0">
        <span className="text-sm font-mono text-[var(--color-gray-300)] mt-1.5 hidden sm:block group-hover:text-white/50 transition-colors">
          {indexNumber}
        </span>

        <div>
          <div className="text-[11px] font-mono text-[var(--color-gray-400)] tracking-wider mb-1.5 group-hover:text-white/70 transition-colors">
            {course.code}
          </div>
          <h3 className="text-xl font-normal tracking-tight mb-1 text-[var(--color-black)] group-hover:text-white transition-colors">
            {course.name_en}
          </h3>
          <p className="text-sm text-[var(--color-gray-500)] group-hover:text-white/80 transition-colors">
            {course.name_th}
          </p>
        </div>
      </div>

      {/* ด้านขวา: จำนวนบท */}
      <div className="flex items-center gap-6 self-start sm:self-center ml-10 sm:ml-0">
        <span className="text-xs font-mono text-[var(--color-gray-400)] uppercase tracking-wider group-hover:text-white/70 transition-colors">
          {course.chapters} chapters
        </span>
      </div>
    </div>
  );
}
