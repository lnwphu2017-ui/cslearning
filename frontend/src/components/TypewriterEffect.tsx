"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface TypewriterEffectProps {
  text: string;
  animate?: boolean;
}

/**
 * Preprocess math delimiters to ensure compatibility with KaTeX
 * Converts \[ ... \] to $$ ... $$ and \( ... \) to $ ... $
 */
const PreprocessMath = (content: string) => {
  if (!content) return "";
  return content
    .replace(/\\\[/g, '$$$$')
    .replace(/\\\]/g, '$$$$')
    .replace(/\\\(/g, '$$')
    .replace(/\\\)/g, '$$');
};

export const TypewriterEffect = ({ text, animate }: TypewriterEffectProps) => {
  // Use a ref so the start state is determined only on mount
  const should_animate = useRef(animate === true);
  const processed_text = PreprocessMath(text);
  const [displayed, set_displayed] = useState(should_animate.current ? "" : processed_text);

  useEffect(() => {
    const current_processed = PreprocessMath(text);
    if (!should_animate.current) {
      set_displayed(current_processed);
      return;
    }

    if (displayed.length < current_processed.length) {
      const timeout = setTimeout(() => {
        set_displayed(current_processed.slice(0, displayed.length + 3)); // Type 3 chars per tick
      }, 15);
      return () => clearTimeout(timeout);
    }
  }, [text, displayed]);

  return (
    <div className="markdown-prose">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm, remarkMath]} 
        rehypePlugins={[rehypeKatex]}
      >
        {displayed}
      </ReactMarkdown>
    </div>
  );
};
