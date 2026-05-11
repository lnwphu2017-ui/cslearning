"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

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

/**
 * CodePopup Component
 * Modal popup แสดงโค้ดเต็มจอ พร้อม Syntax Highlighting + Line Numbers
 */
const CodePopup = ({ code_content, language, OnClose }: {
  code_content: string;
  language: string;
  OnClose: () => void;
}) => {
  const [is_copied, set_is_copied] = useState(false);

  /* คัดลอกโค้ดจาก popup */
  const HandleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code_content);
      set_is_copied(true);
      setTimeout(() => set_is_copied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code!", err);
    }
  };

  /* ปิด popup ด้วยปุ่ม Escape + ล็อค body scroll */
  useEffect(() => {
    const HandleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') OnClose();
    };
    document.addEventListener('keydown', HandleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', HandleKeyDown);
      document.body.style.overflow = '';
    };
  }, [OnClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8"
      style={{ animation: 'FadeIn 0.2s ease-out' }}
      onClick={OnClose}
    >
      {/* Backdrop มืด + Blur */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Popup Container */}
      <div
        className="relative w-full max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden bg-[#282c34] border border-white/10 shadow-2xl flex flex-col"
        style={{ animation: 'FadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Popup Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] shrink-0">
          <span className="text-[14px] font-semibold text-white/80 tracking-wide">
            {language || 'code'}
          </span>

          <div className="flex items-center gap-2">
            {/* Copy Button ใน popup */}
            <button
              onClick={HandleCopy}
              className="flex items-center gap-1.5 text-white/40 hover:text-white/80 transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-white/5"
              title="Copy code"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span className="text-[12px] font-medium">
                {is_copied ? 'Copied!' : 'Copy'}
              </span>
            </button>

            {/* Close Button */}
            <button
              onClick={OnClose}
              className="text-white/40 hover:text-white/90 transition-colors duration-200 p-1.5 rounded-lg hover:bg-white/5"
              title="Close (Esc)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Popup Code Content — scroll ทั้งแนวตั้งและแนวนอน + Line Numbers */}
        <div className="flex-1 overflow-auto code-scrollbar p-6">
          <SyntaxHighlighter
            language={(language || 'python').toLowerCase()}
            style={oneDark}
            useInlineStyles={true}
            showLineNumbers={true}
            PreTag="div"
            lineNumberStyle={{
              color: 'rgba(255, 255, 255, 0.2)',
              fontSize: '12px',
              minWidth: '2.5em',
              paddingRight: '1em',
              userSelect: 'none' as const
            }}
            customStyle={{
              margin: 0,
              padding: 0,
              background: 'transparent',
              fontSize: '14px',
              lineHeight: '1.8',
              fontFamily: 'var(--font-mono), monospace',
              border: 'none',
              boxShadow: 'none'
            }}
            codeTagProps={{
              style: {
                background: 'transparent',
                padding: 0,
                borderRadius: 0,
                border: 'none',
                boxShadow: 'none',
                color: 'inherit'
              }
            }}
          >
            {code_content}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>,
    document.body
  );
};

/**
 * TablePopup Component
 * Modal popup แสดงตารางเต็มจอ พร้อม Scroll แนวนอนและแนวตั้ง
 */
const TablePopup = ({ children, OnClose }: { children: React.ReactNode; OnClose: () => void }) => {
  useEffect(() => {
    const HandleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') OnClose();
    };
    document.addEventListener('keydown', HandleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', HandleKeyDown);
      document.body.style.overflow = '';
    };
  }, [OnClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8"
      style={{ animation: 'FadeIn 0.2s ease-out' }}
      onClick={OnClose}
    >
      {/* Backdrop มืด + Blur */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Popup Container (Light Theme) */}
      <div
        className="relative w-full max-w-5xl max-h-[85vh] rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-2xl flex flex-col"
        style={{ animation: 'FadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Popup Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0 bg-gray-50/80">
          <span className="text-[14px] font-semibold text-gray-800 tracking-wide">
            Data Table
          </span>

          <button
            onClick={OnClose}
            className="text-gray-400 hover:text-gray-700 transition-colors duration-200 p-1.5 rounded-lg hover:bg-gray-200/50"
            title="Close (Esc)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Popup Table Content - allow horizontal scroll if still needed */}
        <div className="flex-1 overflow-auto code-scrollbar bg-white">
          <div className="markdown-prose p-6 w-full [&_table]:!m-0 [&_table]:!border-none [&_table]:!bg-transparent [&_th]:!bg-gray-50 [&_th]:!border-b-gray-200 [&_th]:!text-gray-800 [&_td]:!border-b-gray-100 [&_td]:!text-gray-700 [&_tr:hover_td]:!bg-gray-50/50 [&_th]:!border-x-0 [&_td]:!border-x-0">
            <table className="w-full text-left border-collapse">
               {children}
            </table>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

/**
 * TableBlock Component
 * ตกแต่งตารางให้พรีเมียม บีบให้พอดีจอ และมีปุ่ม Expand popup
 */
const TableBlock = ({ children, ...props }: any) => {
  const [is_popup_open, set_is_popup_open] = useState(false);

  return (
    <>
      <div className="my-5 rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm flex flex-col">
        {/* Header — ชื่อ Table ซ้าย + Expand ขวา */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/80">
          <span className="text-[13px] font-medium text-gray-600 tracking-wide uppercase">
            table
          </span>

          <button
            onClick={() => set_is_popup_open(true)}
            className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 transition-colors duration-200 p-1.5 rounded-md hover:bg-gray-200/50"
            title="Expand table"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9"></polyline>
              <polyline points="9 21 3 21 3 15"></polyline>
              <line x1="21" y1="3" x2="14" y2="10"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
            <span className="text-[12px] font-medium hidden sm:inline">Expand</span>
          </button>
        </div>
        
        {/* Compressed Table content without horizontal scrollbar */}
        <div className="overflow-hidden bg-white">
          <div className="markdown-prose p-0 m-0 w-full [&_table]:!m-0 [&_table]:!border-none [&_table]:!rounded-none [&_table]:!bg-transparent [&_th]:!bg-gray-50 [&_th]:!border-b-gray-200 [&_th]:!text-gray-800 [&_td]:!border-b-gray-100 [&_td]:!text-gray-700 [&_tr:hover_td]:!bg-gray-50/50 [&_th]:!border-x-0 [&_td]:!border-x-0 [&_strong]:!text-gray-900 [&_em]:!text-gray-800 [&_p]:!text-gray-700 [&_a]:!text-blue-600">
            <table className="w-full text-[13.5px] text-left border-collapse break-words" {...props}>
              {children}
            </table>
          </div>
        </div>
      </div>

      {is_popup_open && (
        <TablePopup OnClose={() => set_is_popup_open(false)}>
          {children}
        </TablePopup>
      )}
    </>
  );
};

/**
 * CodeBlock Component
 * ตกแต่งบล็อกโค้ดให้พรีเมียม มี Header, ปุ่ม Copy, และปุ่ม Expand popup
 */
const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const [is_copied, set_is_copied] = useState(false);
  const [is_popup_open, set_is_popup_open] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const code_content = String(children).replace(/\n$/, '');

  const HandleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code_content);
      set_is_copied(true);
      setTimeout(() => set_is_copied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code!", err);
    }
  };

  /* ตรวจจับ inline code อย่างแม่นยำสำหรับ React-Markdown v10 */
  /* inline code: ไม่มี language class AND ไม่มี newline ในเนื้อหา */
  const is_inline = inline === true || (!className && !code_content.includes('\n'));

  if (is_inline) {
    return (
      <code className="bg-white/10 px-1.5 py-0.5 rounded text-[var(--color-primary-light)] font-mono" {...props}>
        {children}
      </code>
    );
  }

  return (
    <>
      <div className="not-prose my-5 rounded-xl overflow-hidden bg-[#282c34] border border-white/[0.06]">
        {/* Header — ชื่อภาษาซ้าย + Expand & Copy ขวา */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
          <span className="text-[13px] font-medium text-white/70 tracking-wide">
            {language || 'code'}
          </span>

          <div className="flex items-center gap-1">
            {/* ปุ่ม Expand — เปิด popup โค้ดเต็มจอ */}
            <button
              onClick={() => set_is_popup_open(true)}
              className="flex items-center gap-1.5 text-white/40 hover:text-white/80 transition-colors duration-200 p-1.5 rounded-md hover:bg-white/5"
              title="Expand code"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            </button>

            {/* ปุ่ม Copy */}
            <button
              onClick={HandleCopy}
              className="flex items-center gap-1.5 text-white/40 hover:text-white/80 transition-colors duration-200 p-1.5 rounded-md hover:bg-white/5"
              title="Copy code"
            >
              {is_copied ? (
                <span className="text-[12px] font-medium text-green-400 px-0.5">Copied!</span>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <span className="text-[12px] font-medium">Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="px-5 pt-4 pb-3 overflow-x-auto code-scrollbar">
          <SyntaxHighlighter
            language={(language || 'python').toLowerCase()}
            style={oneDark}
            useInlineStyles={true}
            PreTag="div"
            customStyle={{
              margin: 0,
              padding: 0,
              background: 'transparent',
              fontSize: '13.5px',
              lineHeight: '1.75',
              fontFamily: 'var(--font-mono), monospace',
              border: 'none',
              boxShadow: 'none'
            }}
            codeTagProps={{
              style: {
                background: 'transparent',
                padding: 0,
                borderRadius: 0,
                border: 'none',
                boxShadow: 'none',
                color: 'inherit'
              }
            }}
          >
            {code_content}
          </SyntaxHighlighter>
        </div>
      </div>

      {/* Popup Modal — แสดงเมื่อกดปุ่ม Expand */}
      {is_popup_open && (
        <CodePopup
          code_content={code_content}
          language={language}
          OnClose={() => set_is_popup_open(false)}
        />
      )}
    </>
  );
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
    <div className="markdown-prose max-w-full overflow-hidden [&_code]:!bg-transparent [&_code]:!shadow-none [&_code]:!p-0 [&_code]:before:!content-none [&_code]:after:!content-none [&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:!m-0">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm, remarkMath]} 
        rehypePlugins={[rehypeKatex]}
        components={{
          code: CodeBlock,
          table: TableBlock,
          /* ลบ <pre> wrapper ออกเพื่อป้องกันพื้นหลังซ้ำซ้อนกับ CodeBlock */
          pre: ({ children }) => <>{children}</>,
          p: ({ children }) => <div className="mb-4 last:mb-0">{children}</div>
        }}
      >
        {displayed}
      </ReactMarkdown>
    </div>
  );
};
