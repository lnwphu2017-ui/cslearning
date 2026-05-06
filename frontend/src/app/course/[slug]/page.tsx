"use client";
// Trigger rebuild for updated lessons.json

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import courses_data from "@/data/courses.json";
import lessons_data from "@/data/lessons.json";
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

const tabs = ["Content", "Flashcards", "Quiz", "Exam"];

// --- Sub-component: Full chapter view (1 chapter = 1 scrollable page) ---
function ChapterView({ 
  chapterIdx, 
  topics, 
  lessons,
  onChangeChapter,
  onKeywordClick
}: { 
  chapterIdx: number,
  topics: string[],
  lessons: any[],
  onChangeChapter: (idx: number) => void,
  onKeywordClick: (keyword: string) => void
}) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const topic = topics[chapterIdx] || "";
  const cleanString = (s: string) => (s || "").replace(/\s*\(.*?\)\s*/g, '').trim().normalize('NFC').replace(/\s+/g, '');
  const matchingLesson = lessons.find((l: any) => cleanString(l.title) === cleanString(topic));

  // Scroll to top when chapter changes
  React.useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [chapterIdx]);

  const full_content = (matchingLesson?.content || "").replace(/\\n/g, '\n');

  // Pre-process content to make any (text) or (**text**) clickable
  const step1 = full_content.replace(/(?<!\])\(([^)]+)\)/g, (match, p1) => {
    const cleanTerm = p1.replace(/[*_]/g, '').trim();
    // Encode the term for the URL part to handle spaces correctly
    const encodedTerm = encodeURIComponent(cleanTerm);
    return `[(${p1})](#click-${encodedTerm})`;
  });

  // Automatically bold English terms in double quotes to make them clickable via our 'strong' component
  const processedContent = step1.replace(/"([A-Za-z0-9\s\-_]+)"/g, '**"$1"**');

  return (
    <div className="flex flex-col h-full">
      {/* Chapter Header */}
      <div className="px-6 md:px-8 lg:px-12 pt-2 md:pt-3 pb-2 shrink-0 border-b border-[var(--color-gray-100)]">
        <h2 className="text-[15px] md:text-[18px] font-bold text-[var(--color-primary)] leading-snug">
          {topic}
        </h2>
        <div className="text-[11px] md:text-[12px] text-[var(--color-gray-400)] mt-0.5">
          บทที่ {chapterIdx + 1} จาก {topics.length}
        </div>
      </div>

      {/* Scrollable Content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto premium-scrollbar px-6 md:px-8 lg:px-12 py-4 md:py-6">
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
            <ReactMarkdown 
              remarkPlugins={[remarkGfm, remarkMath]} 
              rehypePlugins={[rehypeKatex, rehypeRaw]}
              components={{
                strong: ({ children }) => {
                  const getDeepText = (node: any): string => {
                    if (typeof node === 'string') return node;
                    if (Array.isArray(node)) return node.map(getDeepText).join('');
                    if (node?.props?.children) return getDeepText(node.props.children);
                    return '';
                  };
                  const term = getDeepText(children);
                  return (
                    <strong 
                      onClick={() => onKeywordClick(`ช่วยอธิบายเพิ่มเติมเกี่ยวกับ "${term}" ในบริบทของบทเรียนนี้หน่อยครับ`)}
                      className="cursor-pointer hover:text-[var(--color-primary)] hover:underline underline-offset-4 decoration-dashed transition-all"
                      title={`คลิกเพื่อถามเกี่ยวกับ ${term}`}
                    >
                      {children}
                    </strong>
                  );
                },
                a: ({ href, children }) => {
                  if (href?.startsWith('#click-')) {
                    const term = decodeURIComponent(href.replace('#click-', ''));
                    return (
                      <span 
                        onClick={() => onKeywordClick(`ช่วยอธิบายเพิ่มเติมเกี่ยวกับ "${term}" ในบริบทของบทเรียนนี้หน่อยครับ`)}
                        className="cursor-pointer text-[var(--color-gray-700)] hover:text-[var(--color-primary)] hover:underline underline-offset-4 decoration-dashed transition-all"
                        title={`คลิกเพื่อถามเกี่ยวกับ ${term}`}
                      >
                        {children}
                      </span>
                    );
                  }
                  return <a href={href} className="text-[var(--color-primary)] underline">{children}</a>;
                },
                blockquote: ({ children }) => {
                  // Robustly extract all text content from children to detect "Keyword"
                  const getDeepText = (node: any): string => {
                    if (typeof node === 'string') return node;
                    if (Array.isArray(node)) return node.map(getDeepText).join('');
                    if (node?.props?.children) return getDeepText(node.props.children);
                    return '';
                  };
                  
                  const allText = getDeepText(children);
                  const isKeyword = allText.includes('Keyword');

                  if (isKeyword) {
                    const rawKeywords = lessons[chapterIdx]?.content?.match(/\*\*Keyword\*\*:\s*(.*)/)?.[1] || "";
                    const keywordsArray = rawKeywords.split(',');
                    
                    return (
                      <blockquote className="border-l-4 border-[var(--color-primary)] bg-[var(--color-gray-50)] py-3 px-5 rounded-r-lg italic my-6">
                        <strong className="not-italic">Keyword</strong>:{" "}
                        {keywordsArray.map((kw, i) => (
                          <span key={i}>
                            <span
                              onClick={() => onKeywordClick(`ช่วยอธิบายเพิ่มเติมเกี่ยวกับ "${kw.trim()}" ในบริบทของบทเรียนนี้หน่อยครับ`)}
                              className="cursor-pointer hover:text-[var(--color-primary)] hover:underline underline-offset-4 decoration-dashed transition-all font-medium"
                            >
                              {kw.trim()}
                            </span>
                            {i < keywordsArray.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </blockquote>
                    );
                  }
                  return <blockquote className="border-l-4 border-[var(--color-primary)] bg-[var(--color-gray-50)] py-1 px-5 rounded-r-lg italic">{children}</blockquote>;
                }
              }}
            >
              {processedContent
                .split('\n')
                .filter((line: string, l_idx: number) => {
                  if (l_idx === 0 && (line.startsWith('#') || line.trim() === topic.trim())) return false;
                  // Skip the original keyword line because we render it separately via blockquote component
                  // but we actually want the blockquote component to handle it, so we keep it.
                  return true;
                })
                .join('\n')}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="text-[13px] md:text-[14px] text-gray-400 italic py-10 text-center">ยังไม่มีเนื้อหาสำหรับบทเรียนนี้</div>
        )}
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
          disabled={chapterIdx === topics.length - 1}
          onClick={() => onChangeChapter(chapterIdx + 1)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-[12px] font-bold transition-all ${chapterIdx === topics.length - 1 ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' : 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] hover:brightness-105 active:scale-95 shadow-[0_4px_12px_-2px_rgba(177,178,255,0.3)]'}`}
        >
          Next
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    </div>
  );
}

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
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);

  // Flashcards States
  const [is_generating_flashcards, set_is_generating_flashcards] = useState(false);
  const [is_viewing_flashcards, set_is_viewing_flashcards] = useState(false);
  const [flashcards, set_flashcards] = useState<{question: string, answer: string}[]>([]);

  // Quiz States
  const [is_generating_quiz, set_is_generating_quiz] = useState(false);
  const [is_viewing_quiz, set_is_viewing_quiz] = useState(false);
  const [quiz_questions, set_quiz_questions] = useState<{
    question: string, 
    options: string[], 
    correct_answer: number,
    explanation?: string
  }[]>([]);

  // Exam States
  const [is_generating_exam, set_is_generating_exam] = useState(false);
  const [is_viewing_exam, set_is_viewing_exam] = useState(false);
  const [exam_questions, set_exam_questions] = useState<any[]>([]);

  useEffect(() => {
    // Load lessons from local JSON with robust matching
    const current_slug = Array.isArray(slug) ? slug[0] : slug;
    const year_key = `year${course_year}` as keyof typeof lessons_data;
    const year_lessons = lessons_data[year_key] || {};
    
    // Try to find in current year first
    let course_lessons = (year_lessons as any)[current_slug] || [];
    
    // Fallback: If not found, search in all years
    if (course_lessons.length === 0) {
      Object.values(lessons_data).forEach((year_data: any) => {
        if (year_data[current_slug]) {
          course_lessons = year_data[current_slug];
        }
      });
    }
    
    setLessons(course_lessons);
    setLoadingLessons(false);
  }, [slug, course_year]);

  // Fetch completed lessons when user is available
  useEffect(() => {
    async function loadProgress() {
      if (user?.uid) {
        try {
          const completedIds = await apiService.getUserProgress(user.uid);
          setCompletedLessonIds(completedIds);
        } catch (err) {
          console.error("Failed to load user progress:", err);
        }
      }
    }
    loadProgress();
  }, [user]);

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

  const handleCompleteLesson = async (lessonId: string) => {
    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อนบันทึกความก้าวหน้า");
      return;
    }
    try {
      await apiService.completeLesson(user.uid, lessonId);
      setCompletedLessonIds([...completedLessonIds, lessonId]);
    } catch (err) {
      console.error("Failed to complete lesson:", err);
    }
  };

  const HandleGenerateFlashcards = async () => {
    if (selected_topics.length === 0) return;
    
    set_is_generating_flashcards(true);
    
    // Find content from lessons.json
    const topic_name = selected_topics[0];
    const lesson_content = lessons.find(l => l.title === topic_name)?.content || "";
    
    try {
      // Send the first selected topic to the backend
      const data = await apiService.generateFlashcards(topic_name, lesson_content);
      
      // Map API response to match the FlashcardsPlayer expected format
      const mappedCards = data.cards.map((c: any) => ({
        question: c.front,
        answer: c.back
      }));
      
      set_flashcards(mappedCards);
      set_is_viewing_flashcards(true);
    } catch (error) {
      console.error("Failed to generate flashcards:", error);
      alert("เกิดข้อผิดพลาดในการสร้าง Flashcards");
    } finally {
      set_is_generating_flashcards(false);
    }
  };

  const HandleGenerateQuiz = async () => {
    if (selected_topics.length === 0) return;

    set_is_generating_quiz(true);

    // Find content from lessons.json
    const topic_name = selected_topics[0];
    const lesson_content = lessons.find(l => l.title === topic_name)?.content || "";

    try {
      const data = await apiService.generateQuiz(topic_name, lesson_content);
      
      // Map API response to match the QuizPlayer expected format
      const mappedQuestions = data.questions.map((q: any) => ({
        question: q.question,
        options: q.options,
        correct_answer: q.correctIndex,
        explanation: q.explanation // เพิ่มคำอธิบายเฉลย
      }));
      
      set_quiz_questions(mappedQuestions);
      set_is_viewing_quiz(true);
    } catch (error) {
      console.error("Failed to generate quiz:", error);
      alert("เกิดข้อผิดพลาดในการสร้างข้อสอบ");
    } finally {
      set_is_generating_quiz(false);
    }
  };

  const HandleGenerateExam = async () => {
    set_is_generating_exam(true);
    try {
      const data = await apiService.generateExam(course.topics);
      
      const mappedQuestions = data.questions.map((q: any) => ({
        question: q.question,
        options: q.options,
        correct_answer: q.correctIndex,
        domain: q.domain,
        chapterTitle: q.chapterTitle
      }));
      
      set_exam_questions(mappedQuestions);
      set_is_viewing_exam(true);
    } catch (error) {
      console.error("Failed to generate exam:", error);
      alert("เกิดข้อผิดพลาดในการสร้างข้อสอบจำลอง");
    } finally {
      set_is_generating_exam(false);
    }
  };

  return (
    <>
      {/* 1. Center Content Column */}
      <section className="flex-1 bg-white rounded-[20px] md:rounded-[24px] lg:rounded-[32px] border border-[var(--color-gray-300)] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden relative">
        {/* Fixed Header & Tabs */}
        <div className="px-6 md:px-8 lg:px-14 pt-1.5 md:pt-2.5 shrink-0 bg-white z-20">
          <div className="mb-1 md:mb-2">
            <div className="text-[9px] md:text-[10px] font-bold tracking-[0.2em] text-[var(--color-gray-400)] uppercase mb-1">
              Course Module • {course.code}
            </div>
            <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-[var(--color-primary)] tracking-tight leading-[1.2]">
              {course.name_en}
            </h1>
          </div>
          <div className="border-t border-b border-[var(--color-gray-200)] flex w-full overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => HandleTabChange(tab)}
                className={`flex-1 px-6 md:px-12 py-1.5 md:py-2 text-sm md:text-lg font-bold transition-all relative whitespace-nowrap ${activeTab === tab
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-gray-400)] hover:text-[var(--color-primary)]'
                  }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-primary)] rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden p-0.5 md:p-1">
          <div className={`h-full ${
            activeTab === "Content"
              ? "overflow-hidden flex flex-col"
              : "overflow-hidden no-scrollbar flex flex-col"
          } relative z-0`}>
            {/* 📋 Wrapper สำหรับจัดกึ่งกลางเนื้อหาภายใน Tab */}
            <div className="h-full flex-1 min-h-0 flex flex-col">
              
              {/* Content Tab (Full Chapter View) */}
              <div className={activeTab === "Content" ? "flex-1 flex flex-col overflow-hidden" : "hidden"}>
                <ChapterView
                  chapterIdx={currentChapterIdx}
                  topics={course.topics}
                  lessons={lessons}
                  onChangeChapter={setCurrentChapterIdx}
                  onKeywordClick={(kw) => setExternalChatPrompt(kw)}
                />
              </div>

              {/* Flashcards Tab */}
              <div className={activeTab === "Flashcards" ? "flex-1 flex flex-col" : "hidden"}>
                <div className={is_generating_flashcards ? "block h-full" : "hidden"}>
                  <FlashcardsLoading />
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
                <div className={is_generating_quiz ? "block h-full" : "hidden"}>
                  <FlashcardsLoading 
                    title="Generating Quiz" 
                    messages={[
                      "กำลังสุ่มประเด็นสำคัญมาออกข้อสอบ...",
                      "กำลังสร้างตัวเลือกที่ท้าทายความสามารถ...",
                      "กำลังตรวจสอบความถูกต้องของเฉลย...",
                      "กำลังคัดเลือกข้อสอบที่มีคุณภาพ...",
                      "อีกสักครู่ ข้อสอบของคุณจะพร้อมแล้ว..."
                    ]}
                  />
                </div>
                <div className={!is_generating_quiz && is_viewing_quiz ? "block h-full" : "hidden"}>
                  <QuizPlayer 
                    questions={quiz_questions} 
                    OnClose={() => set_is_viewing_quiz(false)} 
                    userId={user?.uid}
                    lessonId={lessons.find(l => l.title === selected_topics[0])?.id}
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
              </div>

              {/* Exam Tab */}
              <div className={activeTab === "Exam" ? "flex-1 flex flex-col" : "hidden"}>
                <div className={is_generating_exam ? "block h-full" : "hidden"}>
                  <FlashcardsLoading 
                    title="Generating Examination" 
                    messages={[
                      "กำลังรวบรวมเนื้อหาจากทุกบทเรียน...",
                      "กำลังคัดเลือกข้อสอบให้ครอบคลุมหลักสูตร...",
                      "กำลังสร้างชุดข้อสอบจำลองที่หลากหลาย...",
                      "กำลังจัดเตรียมเฉลยและบทวิเคราะห์...",
                      "ระบบกำลังประมวลผลข้อสอบไล่ (Final Exam)..."
                    ]}
                  />
                </div>
                <div className={!is_generating_exam && is_viewing_exam ? "block h-full" : "hidden"}>
                  <ExamPlayer 
                    questions={exam_questions} 
                    topics={course.topics}
                    courseName={course.name_en}
                    userId={user?.uid}
                    OnClose={() => set_is_viewing_exam(false)} 
                  />
                </div>
                <div className={!is_generating_exam && !is_viewing_exam ? "block h-full" : "hidden"}>
                  <ExamTab 
                    course_name={course.name_en}
                    OnGenerate={HandleGenerateExam}
                  />
                </div>
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
        ${isChatExpanded ? 'w-[calc(100%-32px)] md:w-[50%]' : 'w-[calc(100%-32px)] md:w-[280px] lg:w-[320px] xl:w-[380px]'} 
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
            initialTopic={course.topics_en ? course.topics_en[0] : course.topics[0]}
            externalPrompt={externalChatPrompt}
            onPromptProcessed={() => setExternalChatPrompt("")}
          />
        </div>
      </aside>
    </>
  );
}
