"use client";

import { useState } from "react";
import { apiService } from "@/services/api";

interface Question {
  question: string;
  options: string[];
  correct_answer: number;
}

interface QuizPlayerProps {
  questions: Question[];
  OnClose: () => void;
  userId?: string;
  lessonId?: string;
}

export function QuizPlayer({ questions, OnClose, userId, lessonId }: QuizPlayerProps) {
  const [current_idx, set_current_idx] = useState(0);
  const [selected_option, set_selected_option] = useState<number | null>(null);
  const [score, set_score] = useState(0);
  const [is_finished, set_is_finished] = useState(false);
  const [is_saving, set_is_saving] = useState(false);

  const HandleOptionClick = (idx: number) => {
    set_selected_option(idx);
  };

  const HandleNext = async () => {
    // Calculate score for the current question
    const isCorrect = selected_option === questions[current_idx].correct_answer;
    let finalScore = score;
    if (isCorrect) {
      finalScore += 1;
      set_score(finalScore);
    }

    if (current_idx < questions.length - 1) {
      set_current_idx(current_idx + 1);
      set_selected_option(null);
    } else {
      set_is_finished(true);
      
      // Save score to backend if logged in and lesson is known
      if (userId && lessonId) {
        set_is_saving(true);
        try {
          await apiService.saveScore({
            userId,
            lessonId,
            type: 'quiz',
            score: finalScore,
            totalQuestions: questions.length
          });
        } catch (error) {
          console.error("Failed to save score:", error);
        } finally {
          set_is_saving(false);
        }
      }
    }
  };

  if (is_finished) {
    return (
      <div className="h-full flex flex-col items-center justify-center pb-24 animate-in fade-in zoom-in-95 duration-500">
        <h2 className="text-3xl font-bold text-[var(--color-black)] mb-1">Quiz Completed!</h2>
        <p className="text-[var(--color-gray-500)] mb-6">You've finished the assessment</p>
        
        <div className="bg-[var(--color-gray-50)] border-2 border-[var(--color-gray-200)] rounded-[32px] p-10 flex flex-col items-center mb-10 w-full max-w-sm">
          <div className="text-6xl font-black text-[var(--color-primary)] mb-2">{score}/{questions.length}</div>
          <div className="text-sm font-bold text-[var(--color-gray-400)] uppercase tracking-widest">Your Score</div>
          {is_saving && <div className="text-xs text-[var(--color-gray-400)] mt-2">Saving your score...</div>}
        </div>

        <button
          onClick={OnClose}
          className="px-10 py-4 bg-[var(--color-primary)] text-white rounded-2xl font-bold text-lg hover:brightness-110 active:scale-95 transition-all"
        >
          Back to Course
        </button>
      </div>
    );
  }

  const current_q = questions[current_idx];
  const progress = ((current_idx + 1) / questions.length) * 100;

  return (
    <div className="h-full flex flex-col px-6 md:px-8 lg:px-12 pt-4 md:pt-6 pb-20 animate-in fade-in duration-500 overflow-hidden w-full">
      {/* Top Progress */}
      <div className="mb-6 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[13px] font-bold text-[var(--color-primary)]">
            Question {current_idx + 1} <span className="text-[var(--color-gray-300)] font-normal">of {questions.length}</span>
          </div>
          <button onClick={OnClose} className="p-2 text-[var(--color-gray-400)] hover:text-black transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="w-full h-1.5 bg-[var(--color-gray-100)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--color-primary)] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Main Content Area: Question + Options */}
      <div className="flex-1 flex flex-col overflow-hidden relative p-2 md:p-4">
        {/* 🛡️ INTERNAL COVER TRICK (Hiding Scrollbar Arrows) */}
        <div className="absolute top-0 right-0 w-8 h-6 bg-white z-[60] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-6 bg-white z-[60] pointer-events-none" />

        {/* Question */}
        <div className="mb-6 shrink-0">
          <h2 className="text-base md:text-lg font-normal text-[var(--color-black)] leading-tight">
            {current_idx + 1}. {current_q.question}
          </h2>
        </div>

        {/* Options - Scrollable only if content exceeds space */}
        <div className="h-full overflow-y-auto premium-scrollbar pr-2 pb-4">
          <div className="grid grid-cols-1 gap-3">
            {current_q.options.map((option, idx) => {
              const letters = ["A", "B", "C", "D"];
              const is_selected = selected_option === idx;

              let border_color = "border-[var(--color-gray-200)]";
              let bg_color = "bg-white";
              let text_color = "text-[var(--color-gray-700)]";

              if (is_selected) {
                border_color = "border-[var(--color-primary)]";
                bg_color = "bg-[var(--color-primary)]/10";
                text_color = "text-[var(--color-black)]";
              }

              return (
                <button
                  key={idx}
                  onClick={() => HandleOptionClick(idx)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left group ${border_color} ${bg_color} ${selected_option === null ? "hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5" : ""}`}
                >
                  <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0 text-sm font-bold transition-all ${is_selected ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white" : "border-[var(--color-gray-200)] text-[var(--color-gray-400)] group-hover:border-[var(--color-primary)] group-hover:text-[var(--color-primary)]"}`}>
                    {letters[idx]}
                  </div>
                  <span className={`text-base font-normal ${text_color}`}>{option}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="pt-6 shrink-0 flex justify-end">
        <button
          onClick={HandleNext}
          disabled={selected_option === null}
          className={`px-10 py-3.5 rounded-2xl font-bold text-base transition-all ${selected_option === null 
            ? "bg-[var(--color-gray-100)] text-[var(--color-gray-400)] cursor-not-allowed" 
            : "bg-[var(--color-primary)] text-white hover:brightness-110 active:scale-95"}`}
        >
          {current_idx === questions.length - 1 ? "Finish Quiz" : "Next Question"}
        </button>
      </div>
    </div>
  );
}
