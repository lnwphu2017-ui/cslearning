"use client";
// Trigger rebuild for updated lessons.json

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import courses_data from "@/data/courses.json";
import { apiService } from "@/services/api";
import { InlineAIChat } from "@/components/InlineAIChat";
import { FlashcardsTab } from "@/components/FlashcardsTab";
import { QuizTab } from "@/components/QuizTab";
import { FlashcardsLoading } from "@/components/FlashcardsLoading";
import { FlashcardsPlayer } from "@/components/FlashcardsPlayer";
import { QuizPlayer } from "@/components/QuizPlayer";
import { ExamTab } from "@/components/ExamTab";
import { ExamPlayer } from "@/components/ExamPlayer";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import 'katex/dist/katex.min.css';

const cleanString = (s: string) => (s || "").replace(/^บทที่\s*\d+\s*:\s*/, '').replace(/\s*\(.*?\)\s*/g, '').trim().normalize('NFC').replace(/\s+/g, '');

const tabs = ["Content", "Flashcards", "Quiz", "Exam"];

/**
 * ContentSkeleton — Skeleton loading UI สำหรับแสดงระหว่างรอโหลดเนื้อหาจาก Database
 * จำลองโครงสร้าง: Chapter Header → Intro paragraph → Dropdown sections
 */
function ContentSkeleton() {
  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-white animate-in fade-in duration-300">
      {/* Skeleton Chapter Header */}
      <div className="px-6 md:px-8 lg:px-14 pt-2 md:pt-3 pb-2 shrink-0 border-b border-[var(--color-gray-100)] z-20 bg-white">
        <div className="skeleton-shimmer-dark h-5 md:h-6 w-[60%] mb-2" />
        <div className="skeleton-shimmer h-3 w-[25%]" />
      </div>

      {/* Skeleton Content Area */}
      <div className="flex-1 overflow-hidden px-6 md:px-8 lg:px-14 py-4 md:py-6">
        {/* Intro Paragraph Skeleton */}
        <div className="mb-8 space-y-3">
          <div className="skeleton-shimmer h-4 w-full" />
          <div className="skeleton-shimmer h-4 w-[92%]" />
          <div className="skeleton-shimmer h-4 w-[85%]" />
          <div className="skeleton-shimmer h-4 w-[70%]" />
        </div>

        {/* Divider Skeleton */}
        <div className="skeleton-shimmer h-[1px] w-full mb-8 opacity-50" />

        {/* Second Paragraph Skeleton */}
        <div className="mb-10 space-y-3">
          <div className="skeleton-shimmer h-4 w-[95%]" />
          <div className="skeleton-shimmer h-4 w-full" />
          <div className="skeleton-shimmer h-4 w-[78%]" />
        </div>

        {/* Dropdown Section Skeletons */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((item_idx: number) => (
            <div
              key={item_idx}
              className="border border-[var(--color-gray-200)] rounded-2xl overflow-hidden"
              style={{ animationDelay: `${item_idx * 120}ms` }}
            >
              <div className="flex items-center justify-between p-5 bg-[var(--color-gray-50)]">
                <div className={`skeleton-shimmer h-4 ${item_idx % 2 === 0 ? 'w-[55%]' : 'w-[65%]'}`} />
                <div className="skeleton-shimmer h-5 w-5 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skeleton Chapter Navigation */}
      <div className="shrink-0 h-16 flex items-center justify-center gap-6 border-t border-[var(--color-gray-100)] bg-white px-6">
        <div className="skeleton-shimmer h-10 w-28 rounded-xl" />
        <div className="skeleton-shimmer h-5 w-14" />
        <div className="skeleton-shimmer-dark h-10 w-28 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * ProgressCelebration — แอนิเมชั่นเฉลิมฉลองเมื่อเรียนจบเนื้อหาบทนั้นๆ
 * แสดง Confetti และพื้นหลัง Glow นุ่มนวล
 */
function ProgressCelebration() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden animate-in fade-in duration-1000">
      <div className="celebration-bg" />
      <div className="confetti-wrapper">
        {[...Array(40)].map((_, i) => (
          <div 
            key={i} 
            className="confetti" 
            style={{ 
              left: `${Math.random() * 100}%`, 
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${2.5 + Math.random() * 3.5}s`
            }} 
          />
        ))}
      </div>
    </div>
  );
}

// --- Sub-component: Full chapter view (1 chapter = 1 scrollable page) ---
function ChapterView({ 
  chapterIdx, 
  topics, 
  lessons,
  is_loading,
  onChangeChapter,
  onKeywordClick
}: { 
  chapterIdx: number,
  topics: string[],
  lessons: any[],
  is_loading: boolean,
  onChangeChapter: (idx: number) => void,
  onKeywordClick: (keyword: string) => void
}) {
  const contentRef = React.useRef<HTMLDivElement>(null);

  const topic = topics[chapterIdx] || "";
  const matchingLesson = lessons.find((l: any) => cleanString(l.title) === cleanString(topic));

  const full_content = (matchingLesson?.content || "").replace(/\\n/g, '\n');

  // --- Content Processing Logic ---
  // 1. Clean the initial content (remove title if it repeats)
  const lines = full_content.split('\n');
  const filteredLines = lines.filter((line: string, idx: number) => {
    if (idx === 0 && (line.startsWith('#') || line.trim() === topic.trim())) return false;
    return true;
  });
  const contentToProcess = filteredLines.join('\n').trim();

  // 2. Helper to process chatbot links in a string
  const processLinks = (text: string) => {
    return text.replace(/(?<!\])\(([^)]+)\)/g, (match: string, p1: string) => {
      const cleanTerm = p1.replace(/[*_]/g, '').trim();
      if (/[a-zA-Z]/.test(cleanTerm)) {
        const encodedTerm = encodeURIComponent(cleanTerm);
        return `[(**${cleanTerm}**)](#click-${encodedTerm})`;
      }
      return match;
    });
  };

  // 3. Split and Merge Sections (Improved Grouping)
  // We want to group related sub-components (like L1/L2/L3 Cache or ALU/CU) together.
  
  // First, find where the first dropdown should start (the first bold header)
  // 3. แยกส่วนเกริ่นนำ (Intro) และส่วนหัวข้อ (Dropdowns)
  const allParts = contentToProcess.split(/\n(?=\*\*)/).filter((p: string) => p.trim() !== "");
  let introPartText = "";
  let sectionCandidates: string[] = [];
  let hasFoundFirstBox = false;

  allParts.forEach((part: string, idx: number) => {
    const trimmedPart = part.trim();
    // ถ้ายังไม่เจอกล่องแรก หรือส่วนนี้เป็น "บทที่..." ให้เอาไปไว้ใน Intro
    if (!hasFoundFirstBox) {
      if (trimmedPart.startsWith('**บทที่') || trimmedPart.startsWith('**Lesson')) {
        introPartText += (introPartText ? '\n\n' : '') + trimmedPart;
      } else if (!trimmedPart.startsWith('**')) {
        introPartText += (introPartText ? '\n\n' : '') + trimmedPart;
      } else {
        hasFoundFirstBox = true;
        sectionCandidates.push(trimmedPart);
      }
    } else {
      sectionCandidates.push(trimmedPart);
    }
  });

  // 4. จัดกลุ่มหัวข้อ (Grouping Logic)
  // แยกกล่องสำหรับหัวข้อหลัก และรวมหัวข้อย่อยที่เป็นรายละเอียด (เช่น ข้อจำกัด, ตัวอย่าง)
  const groupedSections: { header: string; body: string }[] = [];

  sectionCandidates.forEach((part) => {
    const match = part.match(/^\*\*([^\*]+)\*\*(.*)/s);
    if (match) {
      // ล้างเครื่องหมาย * และช่องว่างทุกตัวที่อยู่ที่ขอบหน้าและหลัง รวมถึงเครื่องหมาย :
      let header = match[1].replace(/^[* \s:]+|[* \s:]+$/g, '').trim();
      let rawBody = match[2];

      // 0. แก้ไขข้อผิดพลาดกรณีเนื้อหาย่อหน้าติดมากับชื่อหัวข้อ (Corrupted Headers)
      // มักเกิดจากข้อมูลไม่มีการเว้นบรรทัดก่อนขึ้นหัวข้อใหม่ เช่น "...ขับเคลื่อนเครื่องจักร1. พีชคณิตบูลีน (Boolean Algebra)"
      if (header.length > 40) {
        // ค้นหารูปแบบ "ตัวเลข. หัวข้อ" หรือ "หัวข้อ (English)" ที่อยู่ท้ายสุดของข้อความ
        const tailMatch = header.match(/(\d+\.\s+.*|\s[ก-๙a-zA-Z\s-]+\s*\([a-zA-Z\s-]+\))$/);
        if (tailMatch) {
          const trueHeader = tailMatch[0].trim();
          const prefixText = header.substring(0, header.length - trueHeader.length).trim();
          
          // ตรวจสอบว่าเป็นข้อความที่ติดมาจริงๆ หรือไม่
          const isNumberedHeader = /^\d+\./.test(trueHeader);
          const hasParensInPrefix = prefixText.includes('(') && prefixText.includes(')');
          
          // ถ้ามีข้อความส่วนเกินที่ยาวพอสมควร และ (เป็นหัวข้อตัวเลข หรือ ส่วนเกินไม่มีวงเล็บภาษาอังกฤษ) ให้แยกออก
          if (prefixText.length > 15 && (isNumberedHeader || !hasParensInPrefix)) {
            header = trueHeader;
            if (groupedSections.length > 0) {
              groupedSections[groupedSections.length - 1].body += `\n\n${prefixText}`;
            } else {
              introPartText += `\n\n${prefixText}`;
            }
          }
        }
      }

      // 1. ตรวจสอบคำขึ้นต้นที่บ่งบอกว่าเป็นส่วนขยายหรือประเภทย่อย (ควรถูกรวมกล่อง)
      const isExtensionPrefix = 
        header.startsWith('ทำไม') || 
        header.startsWith('การทำงาน') || 
        header.startsWith('หลักการ') ||
        header.startsWith('ประเภท') ||
        header.startsWith('ส่วนประกอบ') ||
        header.startsWith('ข้อดี') ||
        header.startsWith('ข้อเสีย') ||
        header.startsWith('ประมวลผล') ||
        header.startsWith('ปัญหา') ||
        header.startsWith('ความแตกต่าง') ||
        header.startsWith('ตัวอย่าง') ||
        header.startsWith('แบบ') ||
        header.startsWith('ชนิด') ||
        header.startsWith('เทคนิค') ||
        header.startsWith('ที่มี') || // เช่น "ที่มีความเร็ว..."
        header.startsWith('โดย') ||  // เช่น "โดยแบ่งหน้าที่..."
        header.startsWith('ซึ่ง');  // เช่น "ซึ่งอาศัย..."

      // 2. ตรวจสอบความเกี่ยวเนื่องกับหัวข้อก่อนหน้า (Prefix Matching)
      let isRelatedToPrevious = false;
      if (groupedSections.length > 0) {
        const prevHeader = groupedSections[groupedSections.length - 1].header;
        const cleanPrev = prevHeader.replace(/\([^\)]*\)/g, '').trim();
        const cleanCurr = header.replace(/\([^\)]*\)/g, '').trim();
        
        const keyTerm = cleanPrev.substring(0, 6);
        if (keyTerm.length >= 3 && cleanCurr.startsWith(keyTerm)) {
          isRelatedToPrevious = true;
        }
      }

      // 3. หัวข้อย่อยเชิงเทคนิคหรือลำดับ
      const isTechnicalSub = 
        /^\d+\./.test(header) || 
        /L\d\s+Cache/i.test(header) || 
        /ALU|CU|Register/i.test(header);

      // 4. ตรวจสอบลักษณะประโยค (ถ้าจบด้วย "ได้แก่" หรือ "ดังนี้" ไม่ควรเป็นหัวข้อกล่อง)
      const isSentence = 
        header.endsWith('ได้แก่') || 
        header.endsWith('ดังนี้') ||
        header.length > 100; // หัวข้อไม่ควรยาวเป็นประโยค

      // ตัดสินใจว่าควรสร้างกล่องใหม่หรือไม่
      const hasEnglishParens = header.includes('(') && header.includes(')');
      const shouldStartNewBox = hasEnglishParens && !isExtensionPrefix && !isRelatedToPrevious && !isSentence;

      // ถ้าเป็นกล่องใหม่ (หัวข้อหลัก) และเนื้อหามีการขึ้นบรรทัดใหม่หลังหัวข้อ 
      // ให้ตัดส่วนหัวข้อที่อาจตกค้างในบรรทัดแรกออก แต่ต้องระวังไม่ให้ไปตัดโดน Subheader ในเนื้อหา
      if (shouldStartNewBox || groupedSections.length === 0) {
        const firstNewlineMatch = rawBody.match(/^([^\n\r]*)([\n\r]+.*)$/s);
        if (firstNewlineMatch) {
          const sameLineText = firstNewlineMatch[1].trim();
          // ถ้าข้อความในบรรทัดเดียวกับหัวข้อสั้นมาก (เช่น เป็นแค่เศษเครื่องหมาย) หรือเหมือนหัวข้อ ให้ตัดทิ้ง
          if (sameLineText.length < 5 || header.includes(sameLineText)) {
            rawBody = firstNewlineMatch[2] || "";
          }
        }
      }
      
      let body = rawBody.trim();

      // กรองหัวข้อที่ว่างเปล่าหรือมีแต่เครื่องหมายดาว
      if (!header || header === "**") return;

      if (groupedSections.length > 0 && (!shouldStartNewBox || isTechnicalSub)) {
        // ถ้ารวมกล่อง
        groupedSections[groupedSections.length - 1].body += `\n\n**${header}**\n${body}`;
      } else if (shouldStartNewBox || groupedSections.length === 0) {
        // สร้างกล่องใหม่
        groupedSections.push({ header, body });
      } else {
        // รวมกล่อง
        groupedSections[groupedSections.length - 1].body += `\n\n**${header}**\n${body}`;
      }
    } else if (groupedSections.length > 0) {
      const trimmed = part.trim();
      if (trimmed && trimmed !== "**") {
        groupedSections[groupedSections.length - 1].body += '\n\n' + trimmed;
      }
    }
  });

  const dropdownParts = groupedSections;
  
  // สถานะการเปิดกล่องเนื้อหา (Progress) — ใช้ topic เป็น key เพื่อความแม่นยำ
  const [viewed_boxes, set_viewed_boxes] = React.useState<Set<number>>(new Set());
  
  // โหลดความคืบหน้าจาก Session Storage
  React.useEffect(() => {
    const saved = sessionStorage.getItem(`progress_${topics[chapterIdx]}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      // กรองเฉพาะ index ที่ยังมีอยู่จริงในปัจจุบัน (ป้องกันปัญหาเนื้อหา�ข้อย่อยเชิงเทคนิคหรือลำดับ
      const isTechnicalSub = 
        /^\d+\./.test(header) || 
        /L\d\s+Cache/i.test(header) || 
        /ALU|CU|Register/i.test(header);

      // 4. ตรวจสอบลักษณะประโยค (ถ้าจบด้วย "ได้แก่" หรือ "ดังนี้" ไม่ควรเป็นหัวข้อกล่อง)
      const isSentence = 
        header.endsWith('ได้แก่') || 
        header.endsWith('ดังนี้') ||
        header.length > 100; // หัวข้อไม่ควรยาวเป็นประโยค

      // ตัดสินใจว่าควรสร้างกล่องใหม่หรือไม่
      const hasEnglishParens = header.includes('(') && header.includes(')');
      const shouldStartNewBox = hasEnglishParens && !isExtensionPrefix && !isRelatedToPrevious && !isSentence;

      // ถ้าเป็นกล่องใหม่ (หัวข้อหลัก) และเนื้อหามีการขึ้นบรรทัดใหม่หลังหัวข้อ 
      // ให้ตัดส่วนหัวข้อที่อาจตกค้างในบรรทัดแรกออก แต่ต้องระวังไม่ให้ไปตัดโดน Subheader ในเนื้อหา
      if (shouldStartNewBox || groupedSections.length === 0) {
        const firstNewlineMatch = rawBody.match(/^([^\n\r]*)([\n\r]+.*)$/s);
        if (firstNewlineMatch) {
          const sameLineText = firstNewlineMatch[1].trim();
          // ถ้าข้อความในบรรทัดเดียวกับหัวข้อสั้นมาก (เช่น เป็นแค่เศษเครื่องหมาย) หรือเหมือนหัวข้อ ให้ตัดทิ้ง
          if (sameLineText.length < 5 || header.includes(sameLineText)) {
            rawBody = firstNewlineMatch[2] || "";
          }
        }
      }
      
      let body = rawBody.trim();

      // กรองหัวข้อที่ว่างเปล่าหรือมีแต่เครื่องหมายดาว
      if (!header || header === "**") return;

      if (groupedSections.length > 0 && (!shouldStartNewBox || isTechnicalSub)) {
        // ถ้ารวมกล่อง
        groupedSections[groupedSections.length - 1].body += `\n\n**${header}**\n${body}`;
      } else if (shouldStartNewBox || groupedSections.length === 0) {
        // สร้างกล่องใหม่
        groupedSections.push({ header, body });
      } else {
        // รวมกล่อง
        groupedSections[groupedSections.length - 1].body += `\n\n**${header}**\n${body}`;
      }
    } else if (groupedSections.length > 0) {
      const trimmed = part.trim();
      if (trimmed && trimmed !== "**") {
        groupedSections[groupedSections.length - 1].body += '\n\n' + trimmed;
      }
    }
  });

  const dropdownParts = groupedSections;
  const is_completed = dropdownParts.length > 0 && viewed_boxes.size >= dropdownParts.length;

  // บันทึกสถานะเรียนจบลง Session Storage เมื่อ complete เพื่อใช้กับ Tab อื่นๆ
  React.useEffect(() => {
    if (is_completed && topic) {
      sessionStorage.setItem(`completed_${topic}`, 'true');
    }
  }, [is_completed, topic]);

  // แสดง Skeleton ระหว่างรอโหลดเนื้อหาจาก Database
  if (is_loading) {
    return <ContentSkeleton />;
  }

  const HandleBoxToggle = (idx: number, isOpen: boolean) => {
    if (isOpen && !viewed_boxes.has(idx)) {
      const next = new Set(viewed_boxes);
      next.add(idx);
      set_viewed_boxes(next);
      sessionStorage.setItem(`progress_${topics[chapterIdx]}`, JSON.stringify(Array.from(next)));
    }
  };



  let introPart = introPartText;
  if (introPart.includes('---')) {
    // ตัดเนื้อหาทุกอย่างที่อยู่ใต้เส้น --- ออก (เอาเฉพาะส่วนบนและเก็บเส้นไว้)
    const parts = introPart.split('---');
    introPart = parts[0].trim() + '\n\n---';
  }

  const markdownComponents = {
    strong: ({ children }: any) => {
      const getDeepText = (node: any): string => {
        if (typeof node === 'string') return node;
        if (Array.isArray(node)) return node.map(getDeepText).join('');
        if (node?.props?.children) return getDeepText(node.props.children);
        return '';
      };
      const term = getDeepText(children);
      const isEnglish = /^[A-Za-z0-9\s\-_.',"]+$/.test(term.trim());
      
      if (isEnglish) return <strong>{children}</strong>;

      return (
        <strong 
          onClick={() => onKeywordClick(`ช่วยอธิบายเพิ่มเติมเกี่ยวกับ "${term}"`)}
          className="cursor-pointer hover:text-[var(--color-primary)] hover:underline underline-offset-4 decoration-dashed transition-all"
          title={`คลิกเพื่อถามเกี่ยวกับ ${term}`}
        >
          {children}
        </strong>
      );
    },
    a: ({ href, children }: any) => {
      if (href?.startsWith('#click-')) {
        const term = decodeURIComponent(href.replace('#click-', ''));
        return (
          <span 
            onClick={() => onKeywordClick(`ช่วยอธิบายเพิ่มเติมเกี่ยวกับ "${term}"`)}
            className="cursor-pointer text-[var(--color-gray-700)] hover:text-[var(--color-primary)] hover:underline underline-offset-4 decoration-dashed transition-all"
            title={`คลิกเพื่อถามเกี่ยวกับ ${term}`}
          >
            {children}
          </span>
        );
      }
      return <a href={href} className="text-[var(--color-primary)] underline">{children}</a>;
    },
    blockquote: ({ children }: any) => {
      const getDeepText = (node: any): string => {
        if (typeof node === 'string') return node;
        if (Array.isArray(node)) return node.map(getDeepText).join('');
        if (node?.props?.children) return getDeepText(node.props.children);
        return '';
      };
      
      const allText = getDeepText(children);
      const isKeyword = allText.includes('Keyword');

      if (isKeyword) {
        const rawKeywords = matchingLesson?.content?.match(/\*\*Keyword\*\*:\s*(.*)/)?.[1] || "";
        const keywordsArray = rawKeywords.split(',').map((k: string) => k.trim()).filter((k: string) => k !== "");
        
        if (keywordsArray.length === 0) return <blockquote className="border-l-4 border-[var(--color-primary)] bg-[var(--color-gray-50)] py-1 px-5 rounded-r-lg italic">{children}</blockquote>;

        return (
          <blockquote className="border-l-4 border-[var(--color-primary)] bg-[var(--color-gray-50)] py-3 px-5 rounded-r-lg italic my-6">
            <strong className="not-italic">Keyword</strong>:{" "}
            {keywordsArray.map((kw: string, i: number) => (
              <span key={i}>
                <span
                  onClick={() => onKeywordClick(`ช่วยอธิบายเพิ่มเติมเกี่ยวกับ "${kw}" ในบริบทของบทเรียนนี้หน่อยครับ`)}
                  className="cursor-pointer hover:text-[var(--color-primary)] hover:underline underline-offset-4 decoration-dashed transition-all font-medium"
                >
                  {kw}
                </span>
                {i < keywordsArray.length - 1 ? ", " : ""}
              </span>
            ))}
          </blockquote>
        );
      }
      return <blockquote className="border-l-4 border-[var(--color-primary)] bg-[var(--color-gray-50)] py-1 px-5 rounded-r-lg italic">{children}</blockquote>;
    }
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-white">
      {/* Chapter Header */}
      <div className="px-6 md:px-8 lg:px-14 pt-2 md:pt-3 pb-2 shrink-0 border-b border-[var(--color-gray-100)] z-20 bg-white">
        <h2 className="text-[15px] md:text-[18px] font-bold text-[var(--color-primary)] leading-snug">
          {topic}
        </h2>
        <div className="text-[11px] md:text-[12px] text-[var(--color-gray-400)] mt-0.5 flex items-center gap-2">
          บทที่ {chapterIdx + 1} จาก {topics.length}
          {is_completed && (
            <span className="flex items-center gap-1.5 text-[var(--color-gray-400)] font-medium animate-in fade-in slide-in-from-left-2 duration-700">
              <span className="w-1 h-1 rounded-full bg-[var(--color-gray-300)]" />
              Complete
            </span>
          )}
        </div>
      </div>

      {/* Scrollable Content wrapper */}
      <div className="relative flex-1 overflow-hidden bg-white">
        {/* กล่องสีขาวทับลูกศรด้านบน */}
        <div className="absolute top-0 right-0 w-[14px] h-[10px] bg-white z-10 pointer-events-none" />
        
        <div ref={contentRef} className="h-full overflow-y-auto premium-scrollbar px-6 md:px-8 lg:px-14 py-4 md:py-6">
          {matchingLesson ? (
          <div className="lesson-content prose prose-slate max-w-none 
            prose-headings:text-[var(--color-primary)] prose-headings:font-bold prose-headings:tracking-tight
            prose-h2:text-[19px] md:prose-h2:text-[24px] prose-h2:mt-10 prose-h2:mb-6 prose-h2:border-b prose-h2:border-[var(--color-gray-100)] prose-h2:pb-3
            prose-p:text-[var(--color-gray-700)] prose-p:leading-[1.8] prose-p:text-[15px] md:prose-p:text-[17px] prose-p:my-5
            prose-strong:text-[var(--color-primary)] prose-strong:font-bold
            prose-li:text-[var(--color-gray-700)] prose-li:my-2
            prose-hr:border-[var(--color-gray-100)] prose-hr:my-10
            prose-blockquote:border-l-4 prose-blockquote:border-[var(--color-primary)] prose-blockquote:bg-[var(--color-gray-50)] prose-blockquote:py-1 prose-blockquote:px-5 prose-blockquote:rounded-r-lg prose-blockquote:italic
            ">
              
              {/* Intro Content */}
              <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]} 
                rehypePlugins={[rehypeKatex, rehypeRaw]}
                components={markdownComponents}
              >
                {processLinks(introPart)}
              </ReactMarkdown>

              {/* Celebration Overlay — แสดงเมื่อเรียนจบครบทุกกล่องในบทนั้น */}
              {is_completed && (
                <ProgressCelebration />
              )}

              {/* Dropdown Sections */}
              {dropdownParts.length > 0 && (
                <div className="mt-10 space-y-4">
                  {dropdownParts.map((part: any, pIdx) => {
                    const { header, body } = part;

                    const is_viewed = viewed_boxes.has(pIdx);

                    return (
                      <details 
                        key={pIdx} 
                        onToggle={(e: any) => HandleBoxToggle(pIdx, e.target.open)}
                        className={`group border border-[var(--color-gray-200)] rounded-2xl overflow-hidden transition-all duration-300 relative z-10 bg-white`}
                      >
                        <summary className={`flex items-center justify-between p-5 bg-white cursor-pointer list-none select-none`}>
                          <span className={`font-medium text-[15px] md:text-[16px] pr-4 transition-colors duration-300 ${is_viewed ? 'text-slate-700' : 'text-slate-800'}`}>
                            {header.replace(/\*/g, '').replace(/\s*:\s*$/, '').trim()}
                          </span>
                          <div className={`transition-all duration-300 ${is_viewed ? 'text-slate-500' : 'text-slate-400'} group-open:rotate-180`}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                          </div>
                        </summary>
                        <div className="p-6 bg-white border-t border-[var(--color-gray-100)]">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm, remarkMath]} 
                            rehypePlugins={[rehypeKatex, rehypeRaw]}
                            components={markdownComponents}
                          >
                            {processLinks(body)}
                          </ReactMarkdown>
                        </div>
                      </details>
                    );
                  })}
                </div>
              )}
          </div>
        ) : (
          <div className="text-[13px] md:text-[14px] text-gray-400 italic py-10 text-center">ยังไม่มีเนื้อหาสำหรับบทเรียนนี้</div>
        )}
        </div>
        
        {/* กล่องสีขาวทับลูกศรด้านล่าง */}
        <div className="absolute bottom-0 right-0 w-[14px] h-[10px] bg-white z-10 pointer-events-none" />
      </div>

      {/* Chapter Navigation (sticky bottom) */}
      <div className="shrink-0 h-16 flex items-center justify-center gap-6 border-t border-[var(--color-gray-100)] bg-white/95 backdrop-blur-sm px-6">
        <button
          disabled={chapterIdx === 0}
          onClick={() => onChangeChapter(chapterIdx - 1)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-[12px] font-bold transition-all ${chapterIdx === 0 ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' : 'bg-white text-gray-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] active:scale-95'}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Previous
        </button>
        <div className="text-[14px] font-black text-[var(--color-gray-800)] min-w-[60px] text-center">
          {chapterIdx + 1} <span className="text-[var(--color-gray-200)] mx-1">/</span> {topics.length}
        </div>
        <button
          onClick={() => {
            if (chapterIdx < topics.length - 1) {
              onChangeChapter(chapterIdx + 1);
            } else {
              // Mark last lesson as complete and show alert
              alert("ยินดีด้วย! คุณอ่านจบทุกบทแล้ว 🎉");
            }
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-[12px] font-bold transition-all bg-[var(--color-primary)] text-white border-[var(--color-primary)] hover:brightness-105 active:scale-95 shadow-[0_4px_12px_-2px_rgba(177,178,255,0.3)]`}
        >
          {chapterIdx === topics.length - 1 ? "Finish" : "Next"}
          {chapterIdx < topics.length - 1 && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

// --- Login Required Component ---
const LoginRequired = ({ title, description }: { title: string, description: string }) => {
  const { openModal } = useAuth();
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500 min-h-[400px]">
      <div className="w-20 h-20 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center mb-6">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-primary)]">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
          <polyline points="10 17 15 12 10 7"></polyline>
          <line x1="15" y1="12" x2="3" y2="12"></line>
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-[var(--color-black)] mb-2">{title}</h2>
      <p className="text-[var(--color-gray-500)] mb-8 max-w-xs mx-auto">{description}</p>
      <button 
        onClick={openModal}
        className="px-8 py-4 bg-[var(--color-primary)] text-white rounded-2xl font-bold text-lg hover:brightness-110 active:scale-95 transition-all shadow-lg"
      >
        Login to Continue
      </button>
    </div>
  );
};

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  
  let course: any = null;
  let course_year: number = 1;
  courses_data.years.forEach((y) => {
    const found = y.courses.find((c) => c.slug === slug);
    if (found) {
      course = found;
      course_year = y.year;
    }
  });

  const [activeTab, setActiveTab] = useState("Content");
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [isChatVisibleOnMobile, setIsChatVisibleOnMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [selected_topics, set_selected_topics] = useState<string[]>([]);
  const [externalChatPrompt, setExternalChatPrompt] = useState<string>("");

  // Load active tab from localStorage
  useEffect(() => {
    const savedTab = localStorage.getItem(`activeTab_${slug}`);
    if (savedTab && tabs.includes(savedTab)) {
      setActiveTab(savedTab);
    }
    setIsMounted(true);
  }, [slug]);

  // Save active tab to localStorage
  const HandleTabChange = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem(`activeTab_${slug}`, tab);
  };
  
  const { user } = useAuth();
  const [lessons, setLessons] = useState<any[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);

  // Flashcards States
  const [is_generating_flashcards, set_is_generating_flashcards] = useState(false);
  const [is_viewing_flashcards, set_is_viewing_flashcards] = useState(false);
  const [flashcards, set_flashcards] = useState<{question: string, answer: string}[]>([]);
  const [flashcards_progress, set_flashcards_progress] = useState(0);
  const [flashcards_loading_step, set_flashcards_loading_step] = useState("");

  // Quiz States
  const [is_generating_quiz, set_is_generating_quiz] = useState(false);
  const [quiz_progress, set_quiz_progress] = useState(0);
  const [quiz_loading_step, set_quiz_loading_step] = useState("");
  const [is_viewing_quiz, set_is_viewing_quiz] = useState(false);
  const [quiz_questions, set_quiz_questions] = useState<{
    question: string, 
    options: string[], 
    correct_answer: number,
    explanation?: string
  }[]>([]);

  // Exam States
  const [is_generating_exam, set_is_generating_exam] = useState(false);
  const [exam_progress, set_exam_progress] = useState(0);
  const [exam_loading_step, set_exam_loading_step] = useState("");
  const [is_viewing_exam, set_is_viewing_exam] = useState(false);
  const [exam_questions, set_exam_questions] = useState<any[]>([]);
  const [current_exam_batch, set_current_exam_batch] = useState(0);
  const [total_exam_batches] = useState(8);

  useEffect(() => {
    const current_slug = Array.isArray(slug) ? slug[0] : slug;
    
    // ระยะเวลาขั้นต่ำที่ skeleton จะแสดง (มิลลิวินาที) — ให้ผู้ใช้เห็น loading transition ที่ลื่นไหล
    const MIN_SKELETON_DELAY_MS = 2500;
    
    async function loadLessons() {
      setLoadingLessons(true);
      try {
        // รอทั้ง API fetch และ minimum delay พร้อมกัน
        const [fetchedLessons] = await Promise.all([
          apiService.getLessons(current_slug),
          new Promise((resolve) => setTimeout(resolve, MIN_SKELETON_DELAY_MS))
        ]);
        
        // จัดเรียงตาม order_index
        (fetchedLessons as any[]).sort((a: any, b: any) => a.order_index - b.order_index);
        
        setLessons(fetchedLessons as any[]);
      } catch (err) {
        console.error("Failed to load lessons from database:", err);
        setLessons([]);
      } finally {
        setLoadingLessons(false);
      }
    }
    
    loadLessons();
  }, [slug]);



  useEffect(() => {
    if (!course && typeof window !== "undefined") {
      router.push("/");
    }
  }, [course, router]);

  if (!course || !isMounted) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }



  const HandleToggleTopic = (topic: string) => {
    set_selected_topics(prev => 
      prev.includes(topic) ? [] : [topic]
    );
  };



  const HandleGenerateFlashcards = async () => {
    if (selected_topics.length === 0) return;
    
    set_is_generating_flashcards(true);
    set_flashcards_progress(0);
    set_flashcards_loading_step("กำลังเตรียมเนื้อหาสำหรับ Flashcards...");

    // จำลอง Progress ให้ดูพรีเมียม
    const progressInterval = setInterval(() => {
      set_flashcards_progress(prev => {
        if (prev < 90) return prev + (Math.random() * 1.2);
        return prev;
      });
    }, 200);

    const loadingInterval = setInterval(() => {
      const steps = [
        "กำลังสรุปประเด็นสำคัญ...",
        "กำลังออกแบบคำถามเชิงความจำ...",
        "กำลังจัดเตรียมคำอธิบายที่เข้าใจง่าย...",
        "กำลังตรวจสอบคุณภาพของ Flashcards...",
        "อีกครู่เดียว ชุดการ์ดของคุณจะพร้อมใช้งาน..."
      ];
      set_flashcards_loading_step(prev => {
        const currentIdx = steps.indexOf(prev);
        if (currentIdx < steps.length - 1) return steps[currentIdx + 1];
        return prev;
      });
    }, 2000);
    
    // Find content from lessons.json
    const topic_name = selected_topics[0];
    const lesson_content = lessons.find(l => cleanString(l.title) === cleanString(topic_name))?.content || "";
    
    try {
      // Send the first selected topic to the backend
      const data = await apiService.generateFlashcards(topic_name, lesson_content);
      
      // Map API response to match the FlashcardsPlayer expected format
      const mappedCards = data.cards.map((c: any) => ({
        question: c.front,
        answer: c.back
      }));
      
      set_flashcards_progress(100);
      setTimeout(() => {
        set_flashcards(mappedCards);
        set_is_viewing_flashcards(true);
      }, 500);
    } catch (error) {
      console.error("Failed to generate flashcards:", error);
      alert("เกิดข้อผิดพลาดในการสร้าง Flashcards");
    } finally {
      setTimeout(() => {
        clearInterval(loadingInterval);
        clearInterval(progressInterval);
        set_is_generating_flashcards(false);
        set_flashcards_loading_step("");
      }, 800);
    }
  };

  const HandleGenerateQuiz = async () => {
    if (selected_topics.length === 0) return;
    
    set_is_generating_quiz(true);
    set_quiz_progress(0);
    set_quiz_loading_step("กำลังเตรียมบริบทของบทเรียน...");

    // จำลอง Progress ให้ลื่นไหล
    const progressInterval = setInterval(() => {
      set_quiz_progress(prev => {
        if (prev < 92) return prev + (Math.random() * 0.8);
        return prev;
      });
    }, 150);

    // ฟังก์ชันช่วยเปลี่ยนข้อความ Loading เป็นระยะ
    const loadingInterval = setInterval(() => {
      const steps = [
        "กำลังวิเคราะห์ประเด็นสำคัญในเนื้อหา...",
        "กำลังสังเคราะห์ชุดคำถามเชิงวิเคราะห์...",
        "กำลังสร้างตัวเลือกและคำอธิบายโดยละเอียด...",
        "กำลังตรวจสอบคุณภาพและความถูกต้องของข้อสอบ...",
        "อีกสักครู่ ข้อสอบของคุณจะพร้อมใช้งาน..."
      ];
      set_quiz_loading_step(prev => {
        const currentIdx = steps.indexOf(prev);
        if (currentIdx < steps.length - 1) return steps[currentIdx + 1];
        return prev;
      });
    }, 2500);

    // Find content from lessons.json
    const topic_name = selected_topics[0];
    const lesson_content = lessons.find(l => cleanString(l.title) === cleanString(topic_name))?.content || "";

    try {
      const data = await apiService.generateQuiz(topic_name, lesson_content);
      
      const mappedQuestions = data.questions.map((q: any) => ({
        question: q.question,
        options: q.options,
        correct_answer: q.correctIndex,
        explanation: q.explanation
      }));
      
      set_quiz_progress(100);
      setTimeout(() => {
        set_quiz_questions(mappedQuestions);
        set_is_viewing_quiz(true);
      }, 500);
    } catch (error) {
      console.error("Failed to generate quiz:", error);
      alert("เกิดข้อผิดพลาดในการสร้างข้อสอบ");
    } finally {
      setTimeout(() => {
        clearInterval(loadingInterval);
        clearInterval(progressInterval);
        set_is_generating_quiz(false);
        set_quiz_loading_step("");
      }, 800);
    }
  };

  const HandleGenerateExam = async () => {
    set_is_generating_exam(true);
    set_exam_progress(0);
    set_current_exam_batch(0);
    set_exam_loading_step("กำลังวิเคราะห์โครงสร้างเนื้อหาเพื่อออกแบบข้อสอบ...");
    
    const collected_questions: any[] = [];
    
    try {
      const examChapters = course.topics.map((topic: string) => {
        const matchingLesson = lessons.find(l => cleanString(l.title) === cleanString(topic));
        return {
          title: topic,
          content: matchingLesson?.content || ""
        };
      });

      // วนลูปเรียก API ทีละ Batch พร้อมแสดงสถานะจริง
      for (let i = 0; i < total_exam_batches; i++) {
        set_current_exam_batch(i + 1);
        
        // คำนวณหัวข้อที่กำลังประมวลผล
        const current_topic = course.topics[i % course.topics.length];
        
        // อัปเดตข้อความสถานะจริง: แสดงเฉพาะชื่อบทเรียนที่กำลังทำ
        set_exam_loading_step(`กำลังประมวลผลเนื้อหา: "${current_topic}"...`);
        
        // อัปเดตความคืบหน้าจริงตามสัดส่วน Batch
        const real_progress = Math.floor((i / total_exam_batches) * 100);
        set_exam_progress(real_progress);
        
        const data = await apiService.generateExam(examChapters, slug, i, total_exam_batches);
        
        if (data && data.questions) {
          const mappedBatch = data.questions.map((q: any) => ({
            question: q.question,
            options: q.options,
            correct_answer: q.correctIndex,
            domain: q.domain,
            chapterTitle: q.chapterTitle
          }));
          collected_questions.push(...mappedBatch);
        }
      }

      // ขั้นตอนสุดท้ายหลังประมวลผล AI เสร็จสิ้น
      set_exam_loading_step("กำลังจัดเรียงและสุ่มชุดข้อสอบ...");
      set_exam_progress(95);

      const shuffled = [...collected_questions].sort(() => Math.random() - 0.5);
      
      // หน่วงเวลาเล็กน้อยเพื่อให้ผู้ใช้เห็นสถานะสุดท้าย
      await new Promise(resolve => setTimeout(resolve, 800));
      
      set_exam_progress(100);
      set_exam_questions(shuffled);
      set_is_viewing_exam(true);

    } catch (error) {
      console.error("Failed to generate exam:", error);
      alert("เกิดข้อผิดพลาดในการสร้างข้อสอบจำลอง");
    } finally {
      // ปิดสถานะการโหลด
      setTimeout(() => {
        set_is_generating_exam(false);
        set_exam_loading_step("");
      }, 500);
    }
  };

  return (
    <>
      {/* 1. Center Content Column */}
      <section className="flex-1 bg-white rounded-[20px] md:rounded-[24px] lg:rounded-[32px] border border-[var(--color-gray-300)] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden relative">
        {/* Fixed Header & Tabs */}
        <div className="px-6 md:px-8 lg:px-14 pt-4 md:pt-6 shrink-0 bg-white z-20">
          <div className="mb-3 md:mb-5">
            <div className="text-[9px] md:text-[10px] font-bold tracking-[0.2em] text-[var(--color-gray-400)] uppercase mb-1.5 md:mb-2">
              Course Module • {course.code}
            </div>
            <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-[var(--color-primary)] tracking-tight leading-[1.2]">
              {course.name_en}
            </h1>
          </div>
          <div className="border-t border-b border-[var(--color-gray-200)] flex w-full overflow-x-auto no-scrollbar relative">
            {/* Sliding Indicator Background Line (Enhanced Smoothness) */}
            <div 
              className="absolute bottom-0 h-[3px] bg-[var(--color-primary)] rounded-full transition-[left,width] duration-500 z-10 shadow-[0_0_12px_-1px_rgba(140,140,243,0.5)]"
              style={{
                left: `${tabs.indexOf(activeTab) * (100 / tabs.length)}%`,
                width: `${100 / tabs.length}%`,
                transitionTimingFunction: "cubic-bezier(0.65, 0, 0.35, 1)"
              }}
            />

            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => HandleTabChange(tab)}
                className={`flex-1 px-6 md:px-12 py-1.5 md:py-2 text-sm md:text-lg font-bold transition-all relative whitespace-nowrap z-0 ${activeTab === tab
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-gray-400)] hover:text-[var(--color-primary)]'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden">
            <div className={`h-full ${
              activeTab === "Content"
                ? "overflow-hidden flex flex-col"
                : "overflow-hidden flex flex-col"
            } relative z-0`}>
            {/* 📋 Wrapper สำหรับจัดกึ่งกลางเนื้อหาภายใน Tab */}
            <div className="h-full flex-1 min-h-0 flex flex-col">
              
              {/* Content Tab (Full Chapter View) */}
              <div className={activeTab === "Content" ? "flex-1 flex flex-col overflow-hidden" : "hidden"}>
                <ChapterView
                  chapterIdx={currentChapterIdx}
                  topics={course.topics}
                  lessons={lessons}
                  is_loading={loadingLessons}
                  onChangeChapter={setCurrentChapterIdx}
                  onKeywordClick={(kw: string) => setExternalChatPrompt(kw)}
                />
              </div>

              {/* Flashcards Tab */}
              <div className={activeTab === "Flashcards" ? "flex-1 flex flex-col" : "hidden"}>
                <div className={is_generating_flashcards ? "block h-full" : "hidden"}>
                  <FlashcardsLoading 
                    title="Generating Flashcards"
                    subtitle={flashcards_loading_step}
                  />
                </div>
                <div className={!is_generating_flashcards && is_viewing_flashcards ? "block h-full" : "hidden"}>
                  <FlashcardsPlayer 
                    flashcards={flashcards} 
                    OnClose={() => set_is_viewing_flashcards(false)} 
                  />
                </div>
                <div className={!is_generating_flashcards && !is_viewing_flashcards ? "block h-full" : "hidden"}>
                  <FlashcardsTab 
                    topics={course.topics}
                    selected_topics={selected_topics}
                    OnToggle={HandleToggleTopic}
                    OnGenerate={HandleGenerateFlashcards}
                  />
                </div>
              </div>

              {/* Quiz Tab */}
              <div className={activeTab === "Quiz" ? "flex-1 flex flex-col" : "hidden"}>
                {!user ? (
                  <LoginRequired 
                    title="Quiz Mode" 
                    description="Please login to start the quiz and save your progress." 
                  />
                ) : (
                  <>
                    <div className={is_generating_quiz ? "block h-full" : "hidden"}>
                      <FlashcardsLoading 
                        title="Generating Quiz" 
                        subtitle={quiz_loading_step}
                        messages={[]}
                      />
                    </div>
                    <div className={!is_generating_quiz && is_viewing_quiz ? "block h-full" : "hidden"}>
                      <QuizPlayer 
                        questions={quiz_questions} 
                        OnClose={() => set_is_viewing_quiz(false)} 
                        userId={user?.uid}
                        lessonId={lessons.find(l => cleanString(l.title) === cleanString(selected_topics[0]))?.id}
                      />
                    </div>
                    <div className={!is_generating_quiz && !is_viewing_quiz ? "block h-full" : "hidden"}>
                      <QuizTab 
                        topics={course.topics}
                        selected_topics={selected_topics}
                        OnToggle={HandleToggleTopic}
                        OnGenerate={HandleGenerateQuiz}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Exam Tab */}
              <div className={activeTab === "Exam" ? "flex-1 flex flex-col" : "hidden"}>
                {!user ? (
                  <LoginRequired 
                    title="Examination Mode" 
                    description="Please login to take the final exam and get your performance report." 
                  />
                ) : (
                  <>
                    <div className={is_generating_exam ? "block h-full" : "hidden"}>
                      <FlashcardsLoading 
                        title="Generating Examination" 
                        progress={exam_progress}
                        subtitle={exam_loading_step}
                      />
                    </div>
                    <div className={!is_generating_exam && is_viewing_exam ? "flex flex-col h-full" : "hidden"}>
                      <ExamPlayer 
                        questions={exam_questions} 
                        topics={course.topics}
                        courseName={course.name_en}
                        userId={user?.uid}
                        OnClose={() => set_is_viewing_exam(false)} 
                      />
                    </div>
                    <div className={!is_generating_exam && !is_viewing_exam ? "block h-full relative" : "hidden"}>
                      <ExamTab 
                        course_name={course.name_en}
                        OnGenerate={HandleGenerateExam}
                      />
                      {/* Dev Mock Button at the bottom of the tab */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                        <button 
                          onClick={() => {
                            set_exam_questions(new Array(40).fill({
                              question: "Sample Question",
                              options: ["A", "B", "C", "D"],
                              correct_answer: 0,
                              domain: "Remember",
                              chapterTitle: "Introduction to CS"
                            }));
                            set_is_viewing_exam(true);
                            // After a tiny delay, we can trigger the mock in ExamPlayer
                            // but actually we can just pass the data through if we want.
                            // For now, the user can click this then click the button in ExamPlayer.
                            // OR I can make a more direct mock here.
                          }}
                          className="text-[10px] px-3 py-2 bg-white border border-dashed border-[var(--color-gray-300)] text-[var(--color-gray-400)] rounded-lg hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all"
                        >
                          [Dev: Mock Data & Open Player]
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Floating AI Button for Mobile */}
        <button 
          onClick={() => setIsChatVisibleOnMobile(true)}
          className="md:hidden fixed bottom-8 right-8 w-14 h-14 bg-[var(--color-primary)] text-white rounded-full shadow-xl flex items-center justify-center z-50 animate-bounce"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      </section>

      {/* 2. Right Sidebar Box (AI Chatbox) */}
      {/* Mobile Drawer Backdrop */}
      {isChatVisibleOnMobile && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] md:hidden"
          onClick={() => setIsChatVisibleOnMobile(false)}
        />
      )}

      {/* ปรับความกว้าง AI Chat ให้ยืดหยุ่นขึ้นตามขนาดหน้าจอ (Flexible Width) */}
      <aside className={`
        group fixed md:relative top-4 md:top-0 right-4 md:right-0 bottom-4 md:bottom-0 z-[110] md:z-20
        ${isChatVisibleOnMobile ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        ${isChatExpanded ? 'w-[calc(100%-32px)] md:w-[40%]' : 'w-[calc(100%-32px)] md:w-[280px] lg:w-[320px] xl:w-[380px]'} 
        shrink-0 transition-all duration-400 ease-in-out flex flex-col bg-white rounded-[24px] md:rounded-[32px] border border-[var(--color-gray-300)] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)]
      `}>
        {/* Toggle Expand Button (Desktop only) */}


        {/* Close Button (Mobile only) */}
        <button 
          onClick={() => setIsChatVisibleOnMobile(false)}
          className="md:hidden absolute top-4 right-4 p-2 text-[var(--color-gray-400)] hover:text-black z-50"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="w-full h-full overflow-hidden rounded-[24px] md:rounded-[32px] flex flex-col relative">
          <InlineAIChat
            courseName={course.name_en}
            currentLesson={course.topics[currentChapterIdx]}
            initialTopic={course.topics_en ? course.topics_en[0] : course.topics[0]}
            externalPrompt={externalChatPrompt}
            onPromptProcessed={() => setExternalChatPrompt("")}
          />
        </div>
      </aside>
    </>
  );
}
