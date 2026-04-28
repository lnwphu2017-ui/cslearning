"use client";

import { useState } from "react";

interface Flashcard {
  question: string;
  answer: string;
}

interface FlashcardsPlayerProps {
  flashcards: Flashcard[];
  OnClose: () => void;
}

export function FlashcardsPlayer({ flashcards, OnClose }: FlashcardsPlayerProps) {
  const [current_idx, set_current_idx] = useState(0);
  const [is_flipped, set_is_flipped] = useState(false);

  const HandleNext = () => {
    if (current_idx < flashcards.length - 1) {
      set_is_flipped(false);
      setTimeout(() => {
        set_current_idx(current_idx + 1);
      }, 100);
    }
  };

  const HandlePrev = () => {
    if (current_idx > 0) {
      set_is_flipped(false);
      setTimeout(() => {
        set_current_idx(current_idx - 1);
      }, 100);
    }
  };

  const current_card = flashcards[current_idx];
  const progress = ((current_idx + 1) / flashcards.length) * 100;

  return (
    <div className="flex-1 flex flex-col min-h-[500px] px-6 md:px-8 lg:px-12 pt-4 md:pt-6 pb-20 animate-in fade-in zoom-in-95 duration-500">
      {/* Top Navigation & Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono font-bold text-[var(--color-gray-400)] uppercase tracking-widest mb-1">
              Progress
            </span>
            <div className="text-sm font-bold text-[var(--color-primary)]">
              Card {current_idx + 1} <span className="text-[var(--color-gray-300)] font-normal">of {flashcards.length}</span>
            </div>
          </div>
          <button 
            onClick={OnClose}
            className="p-2 text-[var(--color-gray-400)] hover:text-black transition-colors rounded-full hover:bg-[var(--color-gray-50)]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-[var(--color-gray-100)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[#B1B2FF] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* The Card */}
      <div className="flex-1 flex flex-col items-center justify-center py-4 md:py-8">
        <div 
          onClick={() => set_is_flipped(!is_flipped)}
          className="relative w-full max-w-[600px] aspect-[4/3] md:aspect-[5/3] perspective-1000 cursor-pointer group"
        >
          <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${is_flipped ? 'rotate-y-180' : ''}`}>
            
            {/* Front: Question */}
            <div className="absolute inset-0 backface-hidden bg-[var(--color-primary)] border border-[var(--color-primary)]/20 rounded-[32px] p-8 md:p-12 flex flex-col items-center justify-center text-center group-hover:-translate-y-1 transition-all">
               <h3 className="text-xl md:text-3xl font-bold text-white leading-tight max-w-[90%]">
                 {current_card.question}
               </h3>
               <div className="absolute bottom-8 left-0 right-0 text-[10px] font-mono font-bold text-white/60 uppercase tracking-[0.2em] animate-pulse">
                 Tap to reveal answer
               </div>
            </div>

            {/* Back: Answer */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white border-2 border-[var(--color-gray-300)] rounded-[32px] p-8 md:p-12 flex flex-col items-center justify-center text-center">
               <div className="absolute top-8 left-0 right-0 text-[10px] font-mono font-bold text-[var(--color-primary)] uppercase tracking-[0.2em]">
                 Answer
               </div>
               <p className="text-lg md:text-2xl text-[var(--color-gray-800)] leading-relaxed font-normal max-w-[90%]">
                 {current_card.answer}
               </p>
            </div>

          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-auto py-6 flex items-center justify-center gap-4">
        <button
          onClick={HandlePrev}
          disabled={current_idx === 0}
          className={`flex items-center gap-2 px-8 py-3 rounded-2xl border text-sm font-bold transition-all ${current_idx === 0 
            ? 'bg-[var(--color-gray-50)] border-[var(--color-gray-100)] text-[var(--color-gray-300)] cursor-not-allowed' 
            : 'bg-white border-[var(--color-gray-200)] text-[var(--color-gray-600)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] active:scale-95'}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Previous
        </button>

        <button
          onClick={HandleNext}
          disabled={current_idx === flashcards.length - 1}
          className={`flex items-center gap-2 px-8 py-3 rounded-2xl border text-sm font-bold transition-all ${current_idx === flashcards.length - 1 
            ? 'bg-[var(--color-gray-50)] border-[var(--color-gray-100)] text-[var(--color-gray-300)] cursor-not-allowed' 
            : 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white hover:brightness-110 active:scale-95'}`}
        >
          Next
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      {/* CSS for Card Flip */}
      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
