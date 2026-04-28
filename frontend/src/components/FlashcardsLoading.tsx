"use client";

interface GeneratingLoadingProps {
  title?: string;
  subtitle?: string;
}

export function FlashcardsLoading({ 
  title = "Generating Flashcards", 
  subtitle = "AI is crafting your study materials..." 
}: GeneratingLoadingProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center pb-20 animate-in fade-in duration-500">
      <div className="relative w-full h-32 flex items-center justify-center">
        <div className="banter-loader">
          <div className="banter-loader__box"></div>
          <div className="banter-loader__box"></div>
          <div className="banter-loader__box"></div>
          <div className="banter-loader__box"></div>
          <div className="banter-loader__box"></div>
          <div className="banter-loader__box"></div>
          <div className="banter-loader__box"></div>
          <div className="banter-loader__box"></div>
          <div className="banter-loader__box"></div>
        </div>
      </div>
      <div className="mt-2 text-center">
        <h3 className="text-xl md:text-2xl font-bold text-[var(--color-black)] mb-1">
          {title}
        </h3>
        <p className="text-sm md:text-base text-[var(--color-gray-500)] animate-pulse">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
