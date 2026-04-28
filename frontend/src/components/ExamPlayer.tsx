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
    const element = document.getElementById("result-container");
    if (!element) {
      alert("ไม่พบข้อมูลสำหรับการสร้าง PDF");
      return;
    }

    setGeneratingPdf(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const dataUrl = await toPng(element, { 
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2
      });
      
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(dataUrl);
      const imgWidth = pdfWidth - 20;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(dataUrl, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(dataUrl, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }

      const cleanCourseName = courseName ? courseName.replace(/[^a-zA-Z0-9_-]/g, '-') : 'Course';
      const fileName = `${cleanCourseName}-Exam-Report-${new Date().getTime()}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("PDF Export Detailed Error:", error);
      alert(`ไม่สามารถสร้าง PDF ได้: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      <div className="h-full relative overflow-hidden bg-white animate-in fade-in duration-700">
        <div id="result-container" className="h-full flex flex-col px-6 md:px-12 py-4 overflow-y-auto premium-scrollbar bg-white">
          {/* Header Section */}
          <div className="mb-4 shrink-0 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-[var(--color-black)]">Final Exam Results</h1>
              {courseName && <p className="text-sm font-bold text-[var(--color-primary)] mb-1">{courseName}</p>}
              <p className="text-xs font-medium text-[var(--color-gray-400)]">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            
            <button 
              onClick={OnClose}
              className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-xl text-sm font-bold hover:brightness-110 active:scale-95 transition-all shadow-[0_4px_10px_-2px_rgba(177,178,255,0.4)]"
            >
              Close
            </button>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6">
            {/* ⬅️ Left Column (Scores) */}
            <div className="lg:col-span-5 flex flex-col gap-5">
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

              {/* Topic Breakdown */}
              <div className="flex flex-col gap-3">
                <h4 className="text-[11px] font-bold text-[var(--color-gray-400)] uppercase tracking-widest ml-1">Topic Analysis</h4>
                <div className="flex flex-col gap-2">
                  {display_topics.map((t, idx) => (
                    <div key={idx} className="bg-[var(--color-gray-50)]/50 rounded-2xl p-4 border border-[var(--color-gray-100)] shrink-0">
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
              
              <div className="mt-4">
                <button 
                  onClick={downloadPdf}
                  disabled={generatingPdf}
                  className="w-full flex items-center justify-center gap-2 bg-[var(--color-black)] text-white py-3.5 rounded-xl text-sm font-bold hover:brightness-110 active:scale-95 transition-all"
                >
                  {generatingPdf ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                    </svg>
                  )}
                  {generatingPdf ? "กำลังเตรียมไฟล์..." : "Download Report"}
                </button>
              </div>
            </div>

            {/* ➡️ Right Column (Radar & Recommendations) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="bg-white border border-[var(--color-gray-100)] rounded-[32px] p-6 shadow-sm flex flex-col items-center justify-center">
                <h4 className="text-[11px] font-bold text-[var(--color-gray-400)] uppercase tracking-widest mb-4">Bloom's Taxonomy Analytics</h4>
                
                <div className="w-full h-[280px] sm:h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
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

              {/* AI Recommendations */}
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-700 overflow-hidden">
      {/* 🟢 HEADER (Static at top) */}
      <div className="flex items-center justify-between bg-white px-6 md:px-8 lg:px-12 py-4 z-10 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-black)] leading-tight">Course Examination</h2>
          <p className="text-[10px] text-[var(--color-gray-400)] font-bold uppercase tracking-widest mt-1">
            {user_answers.filter(a => a !== null).length} of {questions.length} Answered
          </p>
        </div>
        <button onClick={OnClose} className="p-2 text-[var(--color-gray-400)] hover:text-black transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* 🔵 QUESTIONS (Scrollable Area) */}
      <div className="flex-1 relative overflow-hidden p-2 md:p-4">
        {/* 🛡️ INTERNAL COVER TRICK (Hiding Scrollbar Arrows) */}
        <div className="absolute top-0 right-0 w-8 h-6 bg-white z-[60] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-6 bg-white z-[60] pointer-events-none" />

        <div className="h-full overflow-y-auto premium-scrollbar px-6 md:px-8 lg:px-12 pt-6 pb-20 w-full">
          {questions.map((q, q_idx) => (
            <div key={q_idx} className="bg-white border border-[var(--color-gray-100)] rounded-[32px] p-4 md:p-6 transition-all hover:border-[var(--color-gray-200)] hover:shadow-[0_4px_20px_-5px_rgba(0,0,0,0.03)] mb-2">
              <div className="flex gap-4 mb-3">
                <span className="text-base font-bold text-[var(--color-black)] shrink-0">{q_idx + 1}.</span>
                <h3 className="text-base font-medium text-[var(--color-black)] leading-snug">{q.question}</h3>
              </div>

              <div className="grid grid-cols-1 gap-1.5 ml-0 md:ml-9">
                {q.options.map((opt, o_idx) => {
                  const is_selected = user_answers[q_idx] === o_idx;
                  const letters = ["a.", "b.", "c.", "d."];
                  return (
                    <button
                      key={o_idx}
                      onClick={() => HandleSelect(q_idx, o_idx)}
                      className="flex items-center gap-4 transition-all text-left group py-0.5"
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        is_selected 
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]" 
                          : "border-[var(--color-gray-200)] bg-white group-hover:border-[var(--color-gray-300)]"
                      }`}>
                        {is_selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className={`text-[15px] transition-colors leading-snug ${is_selected ? "text-[var(--color-black)] font-medium" : "text-[var(--color-gray-600)]"}`}>
                        <span className="mr-2 text-[var(--color-gray-400)] font-mono">{letters[o_idx]}</span>
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
