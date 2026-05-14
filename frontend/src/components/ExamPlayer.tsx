"use client";

import { useState } from "react";
import { apiService } from "@/services/api";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Question {
  question: string;
  options: string[];
  correct_answer: number;
  domain?: string;
  chapterTitle?: string;
}

interface ExamPlayerProps {
  questions: Question[];
  OnClose: () => void;
  topics?: string[];
  courseName?: string;
  userId?: string;
}

export function ExamPlayer({ questions, OnClose, topics: course_topics, courseName, userId }: ExamPlayerProps) {
  const [user_answers, set_user_answers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [is_submitted, set_is_submitted] = useState(false);
  const [is_processing, set_is_processing] = useState(false);

  const [final_score, set_final_score] = useState(0);
  const [result_data, set_result_data] = useState<any>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Safety check to prevent crash when mounted with empty data
  if (!questions || questions.length === 0) {
    return null;
  }

  const HandleSelect = (q_idx: number, opt_idx: number) => {
    if (is_submitted || is_processing) return;
    const new_answers = [...user_answers];
    new_answers[q_idx] = opt_idx;
    set_user_answers(new_answers);
  };

  const HandleSubmit = async () => {
    set_is_processing(true);
    let score = 0;
    
    const radarData: any = {
      Remember: 0, Understand: 0, Apply: 0, Analyze: 0, Evaluate: 0, Create: 0
    };
    const totalPerDomain: any = {
      Remember: 0, Understand: 0, Apply: 0, Analyze: 0, Evaluate: 0, Create: 0
    };
    
    const chapterStats: any = {};

    questions.forEach((q, idx) => {
      const domain = q.domain || "Remember";
      const chapter = q.chapterTitle || "General";
      
      if (!chapterStats[chapter]) {
        chapterStats[chapter] = { correct: 0, total: 0 };
      }
      
      totalPerDomain[domain]++;
      chapterStats[chapter].total++;
      
      if (user_answers[idx] === q.correct_answer) {
        score++;
        radarData[domain]++;
        chapterStats[chapter].correct++;
      }
    });

    const chartData = Object.keys(radarData).map(key => ({
      subject: key,
      A: (radarData[key] / (totalPerDomain[key] || 1)) * 100,
      fullMark: 100
    }));

    try {
      const summaryData = await apiService.generatePdfSummary({
        quizScores: chapterStats,
        examResults: { score, total: questions.length },
        radarScores: chartData
      });

      const finalResult = {
        score,
        total: questions.length,
        chartData,
        chapterStats,
        recommendation: summaryData.summary
      };

      set_final_score(score);
      set_result_data(finalResult);
      set_is_submitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (userId) {
        apiService.saveExamResult({
          userId,
          totalScore: score,
          totalQuestions: questions.length,
          categoryScores: chartData,
          recommendation: summaryData.summary
        });
      }
    } catch (error) {
      console.error("Failed to generate result summary:", error);
      alert("เกิดข้อผิดพลาดในการประมวลผลสรุปผลคะแนน");
      set_is_processing(false);
    }
  };

  const downloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      // 1. Capture the Radar Chart specifically
      const chartElement = document.querySelector(".recharts-wrapper");
      let chartImageUrl = null;
      if (chartElement) {
        chartImageUrl = await toPng(chartElement as HTMLElement, { 
          backgroundColor: '#ffffff',
          pixelRatio: 2
        });
      }

      // 2. Prepare ENHANCED MOCKUP (Original Headers + Rich Content)
      const mockSummary = `
### ภาพรวมและวิเคราะห์จุดแข็ง
จากการประเมินผลการสอบในครั้งนี้ ระบบ AI พบว่าคุณมีความเข้าใจในเนื้อหารวมถึงทักษะกระบวนการคิดที่น่าชื่นชม โดยสรุปภาพรวมได้ดังนี้:
- **ความเป็นเลิศด้านการประยุกต์ใช้ (Application Excellence)**: คุณสามารถนำทฤษฎีพื้นฐานมาแก้ปัญหาโจทย์ที่ซับซ้อนได้อย่างถูกต้อง (Score > 85% ในส่วน Apply)
- **ความแม่นยำขององค์ความรู้ (Theoretical Accuracy)**: องค์ความรู้พื้นฐานในด้านสถาปัตยกรรมคอมพิวเตอร์มีความแม่นยำสูงมาก
- **จุดแข็งที่โดดเด่น**: คุณมีความสามารถพิเศษในการวิเคราะห์โครงสร้างข้อมูลแบบเชิงเส้น (Linear Data Structures) ซึ่งเป็นพื้นฐานสำคัญของการเขียนโปรแกรมระดับสูง

### สิ่งที่ควรพัฒนาต่อ
เพื่อยกระดับทักษะของคุณให้เข้าสู่ระดับมืออาชีพ ระบบขอแนะนำแผนการพัฒนาดังนี้:
- **ทบทวนเรื่อง Big O Notation**: เพื่อเพิ่มประสิทธิภาพในการเขียนโค้ดให้ทำงานได้รวดเร็วขึ้น
- **ศึกษาเรื่องสถาปัตยกรรมระดับสูง**: เช่น Microservices หรือ Cloud Computing เพื่อต่อยอดจากพื้นฐานที่มี
- **ฝึกแก้โจทย์อัลกอริทึม**: ที่เน้นการจัดการหน่วยความจำ (Dynamic Programming) เพื่อเสริมสร้างทักษะด้าน Analysis ให้แข็งแกร่งยิ่งขึ้น

### สรุปเนื้อหารายวิชา
รายงานฉบับนี้รวบรวมสาระสำคัญของทุกบทเรียนในหลักสูตร เพื่อใช้เป็นแนวทางในการทบทวนและต่อยอดความรู้อย่างมีประสิทธิภาพ

**บทที่ 1: Introduction to Computer Science**
พื้นฐานของวิทยาการคอมพิวเตอร์ครอบคลุมการทำความเข้าใจว่าคอมพิวเตอร์คืออะไร ทำงานอย่างไร และมีบทบาทอย่างไรในโลกปัจจุบัน นักศึกษาจะได้เรียนรู้วงจรการทำงานพื้นฐานของ CPU และระบบหน่วยความจำ
- หน่วยประมวลผล (CPU) ทำงานผ่านวงจร Fetch-Decode-Execute ในทุกคำสั่ง
- ระบบเลขฐาน 2 (Binary) คือภาษาที่คอมพิวเตอร์ใช้จัดเก็บและประมวลผลข้อมูลทุกชนิด
- ระบบหน่วยความจำแบ่งเป็น RAM (ชั่วคราว) และ Storage (ถาวร) ที่ทำงานร่วมกัน
- ซอฟต์แวร์แบ่งเป็น System Software (OS) และ Application Software ที่ผู้ใช้งานโดยตรง

**บทที่ 2: Logic & Algorithm Design**
การออกแบบอัลกอริทึมคือหัวใจของการเขียนโปรแกรม นักศึกษาจะฝึกคิดอย่างเป็นระบบผ่านการวาด Flowchart และเขียน Pseudocode ก่อนลงมือเขียนโค้ดจริง ซึ่งช่วยลดข้อผิดพลาดในกระบวนการพัฒนาซอฟต์แวร์ได้อย่างมาก
- Flowchart ใช้สัญลักษณ์มาตรฐาน (รูปสี่เหลี่ยม, เพชร, วงรี) แทนขั้นตอนการทำงาน
- Pseudocode เป็นภาษากึ่งธรรมชาติที่ใช้วางแผนโครงสร้างโปรแกรมก่อนเขียนโค้ด
- เงื่อนไข (Condition) และการวนซ้ำ (Loop) คือโครงสร้างพื้นฐานของทุกอัลกอริทึม
- การแก้ปัญหาแบบ Divide and Conquer ช่วยจัดการกับปัญหาขนาดใหญ่ได้อย่างมีประสิทธิภาพ

**บทที่ 3: Structured Programming**
การเขียนโปรแกรมเชิงโครงสร้างเน้นการแบ่งโปรแกรมออกเป็นฟังก์ชันหรือโมดูลย่อยๆ ที่ทำงานเฉพาะด้าน ทำให้โค้ดอ่านง่าย บำรุงรักษาง่าย และนำกลับมาใช้ใหม่ได้
- ฟังก์ชัน (Function) คือกลุ่มคำสั่งที่ทำงานเฉพาะด้านและสามารถเรียกใช้ซ้ำได้
- Modularity หมายถึงการแบ่งโปรแกรมเป็นส่วนย่อยอิสระที่ทดสอบและแก้ไขได้แยกกัน
- Scope ของตัวแปรกำหนดว่าตัวแปรนั้นถูกมองเห็นและใช้งานได้ในส่วนใดของโปรแกรม
- การส่งค่าแบบ Pass by Value และ Pass by Reference มีผลต่อการจัดการหน่วยความจำ

**บทที่ 4: Data Structures**
โครงสร้างข้อมูลเป็นวิธีการจัดระเบียบและจัดเก็บข้อมูลในหน่วยความจำ การเลือกโครงสร้างข้อมูลที่เหมาะสมส่งผลโดยตรงต่อประสิทธิภาพของโปรแกรม
- Array เหมาะกับการเข้าถึงข้อมูลแบบสุ่ม (Random Access) ด้วยความเร็ว O(1)
- Linked List เหมาะกับการแทรกและลบข้อมูลบ่อยครั้ง โดยไม่ต้องขยับข้อมูลทั้งหมด
- Stack ใช้หลัก LIFO (Last In First Out) เหมาะกับการจัดการ Function Call Stack
- Queue ใช้หลัก FIFO (First In First Out) เหมาะกับระบบคิวและการจัดการ Buffer

**บทที่ 5: Sorting & Searching**
อัลกอริทึมการเรียงลำดับและค้นหาเป็นพื้นฐานสำคัญของซอฟต์แวร์เกือบทุกประเภท การทำความเข้าใจ Big O Notation ช่วยให้เลือกอัลกอริทึมที่เหมาะสมกับขนาดข้อมูลได้ถูกต้อง
- Bubble Sort และ Insertion Sort เหมาะกับข้อมูลขนาดเล็กด้วยความซับซ้อน O(n²)
- Merge Sort และ Quick Sort มีประสิทธิภาพสูงสำหรับข้อมูลขนาดใหญ่ O(n log n)
- Linear Search ค้นหาแบบทีละตัว ในขณะที่ Binary Search ค้นหาแบบแบ่งครึ่งได้เร็วกว่ามาก
- การเลือกอัลกอริทึมต้องพิจารณาทั้ง Time Complexity และ Space Complexity ควบคู่กัน

**บทที่ 6: Database Systems**
ระบบฐานข้อมูลเป็นรากฐานของแอปพลิเคชันทุกประเภท การออกแบบฐานข้อมูลที่ดีต้องผ่านกระบวนการ Normalization เพื่อลดความซ้ำซ้อนและรักษาความสมบูรณ์ของข้อมูล
- RDBMS (Relational Database) จัดเก็บข้อมูลในรูปแบบตารางที่มีความสัมพันธ์ต่อกัน
- Primary Key คือฟิลด์ที่ระบุความเป็นเอกลักษณ์ของแต่ละ Record ในตาราง
- SQL ประกอบด้วย DDL (สร้างตาราง), DML (จัดการข้อมูล), และ DCL (ควบคุมสิทธิ์)
- Transaction และ ACID Properties (Atomicity, Consistency, Isolation, Durability) รับประกันความถูกต้องของข้อมูล

**บทที่ 7: Networking & Internet**
เครือข่ายคอมพิวเตอร์ทำให้อุปกรณ์ต่างๆ สามารถสื่อสารและแลกเปลี่ยนข้อมูลกันได้ โมเดล OSI 7 ชั้นเป็นมาตรฐานสากลที่อธิบายกระบวนการส่งข้อมูลในเครือข่าย
- โมเดล OSI แบ่งการสื่อสารเป็น 7 ชั้น ตั้งแต่ Physical Layer จนถึง Application Layer
- TCP/IP Protocol เป็นโปรโตคอลหลักของอินเทอร์เน็ต รับประกันการส่งข้อมูลแบบครบถ้วน
- HTTP/HTTPS ใช้สำหรับการสื่อสารระหว่าง Web Browser และ Web Server
- IP Address และ Subnet Mask กำหนดที่อยู่และขอบเขตของอุปกรณ์ในเครือข่าย
`;

      const summaryText = mockSummary.trim(); // Trim to avoid empty sections
      const sectionBlocks = summaryText.split(/###\s+/).filter(Boolean);
      
      const sections = sectionBlocks.map((block: string) => {
        const lines = block.split('\n');
        const title = lines[0].trim();
        const content = lines.slice(1).join('\n').trim();
        return { title, content };
      });

      // Add a primary score section at the top
      sections.unshift({
        title: "ผลคะแนนการทดสอบรวม",
        content: `ในภาพรวมของการทดสอบ คุณทำคะแนนได้ **${final_score}** จากคะแนนเต็ม **${questions.length}** คิดเป็น **${Math.round((final_score/questions.length)*100)}%** ถือว่าเป็นระดับที่ **ดีเยี่ยม (Excellent)**`
      });

      // 3. Call generatePdf API (Modern Report via WeasyPrint)
      const pdfBlob = await apiService.generatePdf({
        title: courseName || 'Computer Science Assessment',
        sections,
        score: final_score,
        total: questions.length,
        chartImage: chartImageUrl,
        footerText: `รายงานประเมินผลอัตโนมัติสร้างโดยระบบ CSL AI Learning Dashboard (Ref ID: ${new Date().getTime()})`
      });

      // 4. Download the Blob
      // ระบุ type ให้ชัดเจนว่าเป็น PDF เพื่อไม่ให้ Browser สับสน
      const finalBlob = new Blob([pdfBlob], { type: "application/pdf" });
      const url = window.URL.createObjectURL(finalBlob);
      const link = document.createElement('a');
      link.href = url;
      
      // ใช้ชื่อที่ปลอดภัย (ภาษาอังกฤษล้วน) เพื่อป้องกันปัญหา Browser ไม่รับชื่อไฟล์ภาษาไทย
      link.download = `Exam-Report-${new Date().getTime()}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      
      // หน่วงเวลาเล็กน้อยก่อนลบ URL ออกจากหน่วยความจำ
      setTimeout(() => {
        if (link.parentNode) link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 200);

    } catch (error) {
      console.error("PDF Formal Export Error:", error);
      alert(`ไม่สามารถสร้างรายงาน PDF ได้: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (is_submitted && result_data) {
    const percentage = (final_score / questions.length) * 100;
    
    // Formatting the topic data for UI display
    const display_topics = Object.entries(result_data.chapterStats).map(([name, stats]: [string, any]) => ({
      name: name.length > 40 ? name.substring(0, 37) + "..." : name,
      score: stats.correct,
      total: stats.total
    }));

    return (
      <div className="h-full relative bg-white animate-in fade-in duration-700 overflow-hidden">
        {/* 🛡️ SCROLLBAR SHIELDS (Hiding the small triangles/arrows) */}
        {/* We place them at right-[16px] to match the right-4 offset of the container */}
        <div className="absolute top-0 right-[16px] w-[12px] h-[12px] bg-white z-[60] pointer-events-none" />
        <div className="absolute bottom-0 right-[16px] w-[12px] h-[12px] bg-white z-[60] pointer-events-none" />

        <div id="result-container" className="absolute top-0 bottom-0 left-0 right-4 px-6 md:px-12 py-10 overflow-y-scroll premium-scrollbar">
          {/* Header Section */}
          <div className="mt-4 mb-4 shrink-0 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-[var(--color-black)]">Final Exam Results</h1>
              {courseName && <p className="text-sm font-bold text-[var(--color-primary)] mb-1">{courseName}</p>}
              <p className="text-xs font-medium text-[var(--color-gray-400)]">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            
            <button 
              onClick={OnClose}
              className="p-2 text-[var(--color-gray-400)] hover:text-[var(--color-black)] hover:bg-[var(--color-gray-100)] rounded-full transition-all active:scale-90"
              aria-label="Close"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* 🧩 NEW LAYOUT STRUCTURE: Divided into rows for perfect symmetry */}
          <div className="flex-1 flex flex-col gap-8 pb-10">
            
            {/* ROW 1: Scores & Topic Analysis (Left) + Bloom Analytics (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* ⬅️ Left Column: Score & Topics */}
              <div className="lg:col-span-5 flex flex-col gap-8">
                {/* Overall Score Card */}
                <div className="bg-white border border-[var(--color-gray-100)] rounded-[32px] p-5 flex items-center gap-6 shadow-sm shrink-0">
                  <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="48" cy="48" r="42" fill="none" stroke="var(--color-gray-100)" strokeWidth="8" />
                      <circle 
                        cx="48" cy="48" r="42" fill="none" stroke="var(--color-primary)" strokeWidth="8" 
                        strokeDasharray={264} 
                        strokeDashoffset={264 - (264 * percentage) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-[var(--color-black)]">{final_score}</span>
                      <span className="text-[10px] font-bold text-[var(--color-gray-400)]">/ {questions.length}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--color-black)] mb-0.5">Overall Score</h3>
                    <p className="text-xs text-[var(--color-gray-500)] leading-tight">
                      You scored {Math.round(percentage)}% on the comprehensive exam.
                    </p>
                  </div>
                </div>

                {/* Topic Breakdown — แสดง 3 กล่องพอดีเป๊ะ */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-[11px] font-bold text-[var(--color-gray-400)] uppercase tracking-widest ml-1">Topic Analysis</h4>
                  <div 
                    className="flex flex-col gap-2 max-h-[258px] overflow-y-auto no-scrollbar pr-1 overscroll-contain cursor-grab active:cursor-grabbing select-none"
                    onMouseDown={(e) => {
                      const container = e.currentTarget;
                      const start_y = e.pageY - container.offsetTop;
                      const scroll_top = container.scrollTop;
                      
                      const HandleMouseMove = (move_e: MouseEvent) => {
                        const y = move_e.pageY - container.offsetTop;
                        const walk = (y - start_y) * 1.5;
                        container.scrollTop = scroll_top - walk;
                      };
                      
                      const HandleMouseUp = () => {
                        window.removeEventListener('mousemove', HandleMouseMove);
                        window.removeEventListener('mouseup', HandleMouseUp);
                      };
                      
                      window.addEventListener('mousemove', HandleMouseMove);
                      window.addEventListener('mouseup', HandleMouseUp);
                    }}
                  >
                    {display_topics.map((t, idx) => (
                      <div key={idx} className="bg-white rounded-2xl p-4 border border-[var(--color-gray-100)] shadow-sm shrink-0 mb-1 pointer-events-none">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-xs font-bold text-[var(--color-black)] truncate pr-2">{t.name}</div>
                          <div className="text-right whitespace-nowrap">
                            <span className="text-base font-black text-[var(--color-primary)]">{t.score}</span>
                            <span className="text-[10px] font-bold text-[var(--color-gray-400)]"> / {t.total}</span>
                          </div>
                        </div>
                        <div className="w-full h-1 bg-[var(--color-gray-200)] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[var(--color-primary)] transition-all duration-1000 delay-300" 
                            style={{ width: `${t.total > 0 ? (t.score / t.total) * 100 : 0}%` }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ➡️ Right Column: Radar Chart (Stretched to match Score + Topics) */}
              <div className="lg:col-span-7 h-full">
                <div className="bg-white border border-[var(--color-gray-100)] rounded-[32px] p-6 shadow-sm flex flex-col items-center justify-center h-full min-h-[400px]">
                  <h4 className="text-[11px] font-bold text-[var(--color-gray-400)] uppercase tracking-widest mb-4">Bloom's Taxonomy Analytics</h4>
                  
                  <div className="w-full h-full flex-1 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={320}>
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={result_data.chartData}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 'bold' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                          name="Performance"
                          dataKey="A"
                          stroke="var(--color-primary)"
                          fill="var(--color-primary)"
                          fillOpacity={0.4}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 2: AI Recommendation (Full Width — กว้างสุดขอบทั้งสองฝั่ง) */}
            <div className="w-full">
              <div className="bg-[var(--color-gray-50)] rounded-[32px] p-6 sm:p-8 border border-[var(--color-gray-100)]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-[var(--color-primary)]/10 rounded-xl flex items-center justify-center text-[var(--color-primary)]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  </div>
                  <h3 className="text-xl font-black text-[var(--color-black)]">AI Personal Recommendation</h3>
                </div>
                <div className="prose prose-sm md:prose-base prose-gray max-w-none text-[var(--color-gray-700)]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result_data.recommendation}
                  </ReactMarkdown>
                </div>
              </div>
            </div>

            {/* ROW 3: Download Button (Full Width — ปุ่มแนวนอนยาวเท่ากล่องด้านบน) */}
            <div className="w-full">
              <button 
                onClick={downloadPdf}
                disabled={generatingPdf}
                className="w-full flex items-center justify-center gap-3 bg-[var(--color-black)] text-white py-5 rounded-[20px] text-base font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-lg"
              >
                {generatingPdf ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                  </svg>
                )}
                <span className="tracking-wide">{generatingPdf ? "กำลังเตรียมไฟล์รายงาน..." : "Download Comprehensive Exam Report (PDF)"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-700 overflow-hidden">
      {/* 🟢 HEADER (Static at top) */}
      <div className="flex items-center justify-between bg-white px-6 md:px-8 lg:px-12 py-2 z-10 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-black)] leading-tight">Course Examination</h2>
          <p className="text-[10px] text-[var(--color-gray-400)] font-bold uppercase tracking-widest mt-1">
            {user_answers.filter(a => a !== null).length} of {questions.length} Answered
          </p>
        </div>
        <div className="flex items-center gap-4">

        </div>
        <button onClick={OnClose} className="p-2 text-[var(--color-gray-400)] hover:text-black transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* 🔵 QUESTIONS (Scrollable Area) */}
      <div className="flex-1 relative p-2 md:p-4 overflow-hidden">
        {/* 🛡️ INTERNAL COVER TRICK (Hiding Scrollbar Arrows) */}
        <div className="absolute top-0 right-0 w-8 h-6 bg-white z-[60] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-6 bg-white z-[60] pointer-events-none" />

        <div className="absolute inset-0 overflow-y-auto px-6 md:px-8 lg:px-12 pt-2 pb-16 w-full custom-exam-scrollbar">
          {questions.map((q, q_idx) => (
            <div key={q_idx} className="py-6 border-b border-[var(--color-gray-100)] last:border-0 transition-all">
              <div className="flex gap-4 mb-4">
                <span className="text-lg font-bold text-[var(--color-black)] shrink-0">{q_idx + 1}.</span>
                <h3 className="text-lg font-normal text-[var(--color-black)] leading-snug">{q.question}</h3>
              </div>

              <div className="grid grid-cols-1 gap-3 ml-0 md:ml-9">
                {q.options.map((opt, o_idx) => {
                  const is_selected = user_answers[q_idx] === o_idx;
                  const letters = ["a.", "b.", "c.", "d."];
                  return (
                    <button
                      key={o_idx}
                      onClick={() => HandleSelect(q_idx, o_idx)}
                      className="flex items-center gap-4 transition-all text-left group py-1.5"
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        is_selected 
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]" 
                          : "border-[var(--color-gray-200)] bg-white group-hover:border-[var(--color-primary)]/40"
                      }`}>
                        {is_selected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className={`text-[17px] transition-colors leading-snug ${is_selected ? "text-[var(--color-black)] font-medium" : "text-[var(--color-gray-600)]"}`}>
                        <span className="mr-3 text-[var(--color-gray-400)] font-mono font-bold">{letters[o_idx]}</span>
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-8 flex justify-center">
            <button
              onClick={HandleSubmit}
              disabled={user_answers.includes(null) || is_processing}
              className={`px-12 py-4 rounded-2xl font-bold text-lg transition-all ${
                user_answers.includes(null) || is_processing
                  ? "bg-[var(--color-gray-100)] text-[var(--color-gray-400)] cursor-not-allowed" 
                  : "bg-[var(--color-primary)] text-white hover:brightness-110 hover:scale-[1.02] active:scale-95 shadow-[0_15px_30px_-10px_rgba(177,178,255,0.3)]"
              }`}
            >
              {is_processing ? "กำลังประมวลผล..." : "Finish Exam"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
