"use client";

import { useState, useRef, useEffect } from "react";
import { apiService, ChatMessage } from "@/services/api";
import { TypewriterEffect } from "./TypewriterEffect";

interface InlineAIChatProps {
  courseName: string;
  initialTopic?: string;
}

export function InlineAIChat({ courseName, initialTopic }: InlineAIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'assistant',
    content: `สวัสดีครับ! มีข้อสงสัยไหนในวิชา **${courseName}** ที่อยากให้ผมช่วยอธิบายเพิ่มเติมไหมครับ?`,
    animate: false
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // To provide context to the AI, we can inject a system prompt or just rely on the user's flow.
    const systemMessage: ChatMessage = { 
      role: 'system', 
      content: `คุณคือติวเตอร์วิชา ${courseName} จงตอบคำถามอย่างกระชับที่สุด ตรงประเด็น ไม่ต้องเกริ่นนำ และประหยัด Token` 
    };

    let actualInput = input.trim();
    const newMessages: ChatMessage[] = [systemMessage, ...messages, { role: 'user', content: actualInput }];
    
    // Display original input to user, not the hidden context
    const displayMessages = [...messages, { role: 'user', content: input.trim(), animate: false } as ChatMessage];
    
    // Add an empty assistant message as a placeholder for streaming
    setMessages([...displayMessages, { role: 'assistant', content: "", animate: true }]);
    
    setInput("");
    setIsLoading(true);

    try {
      await apiService.streamChatMessage(newMessages, (chunk) => {
        setMessages(prev => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: updated[lastIndex].content + chunk
          };
          return updated;
        });
      });
    } catch (error) {
      console.error(error);
      setMessages(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        updated[lastIndex] = {
          ...updated[lastIndex],
          content: updated[lastIndex].content + "\n\n*(ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์)*"
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-primary-dark)] rounded-3xl overflow-hidden border border-white/20">
      {/* Header */}
      <div className="h-[73px] border-b border-white/10 flex items-center justify-center px-6 shrink-0 bg-white/5">
        <h2 className="text-lg font-bold tracking-tight text-white">CHATBOT</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 relative overflow-hidden bg-black/5">

        <div className="h-full overflow-y-auto premium-scrollbar px-5 py-6 flex flex-col gap-6 relative z-0">
          {messages.map((msg, idx) => {
          // Hide empty assistant messages to prevent double bubbles
          if (msg.role === 'assistant' && !msg.content) return null;
          
          return (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] text-[13.5px] leading-[1.6] ${
                  msg.role === 'user' 
                  ? 'bg-[var(--color-primary)] text-white rounded-2xl px-4 py-2.5 shadow-[0_6px_20px_rgba(177,178,255,0.3)]' 
                  : 'text-white/90 py-2'
                }`}
              >
                {msg.role === 'user' 
                  ? msg.content.replace(/\[Context:.*?\]\s*/, "") 
                  : (
                    <div className="flex gap-4 items-start">
                      <div className="w-9 h-9 flex items-center justify-center shrink-0 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.1)] mt-0.5">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 3C12 7.97056 7.97056 12 3 12C7.97056 12 12 16.0294 12 21C12 16.0294 16.0294 12 21 12C16.0294 12 12 7.97056 12 3Z" fill="white" />
                        </svg>
                      </div>
                      <div className="assistant-message-dark pt-1">
                        <TypewriterEffect text={msg.content} animate={msg.animate} />
                      </div>
                    </div>
                  )}
              </div>
            </div>
          );
        })}
        {/* Show generic loading animation only if the last message is assistant and content is still empty (waiting for first byte) */}
        {isLoading && messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1]?.content && (
          <div className="flex justify-start animate-fade-in-up py-4">
            <div className="max-w-[85%] flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>

      {/* Input Area — Clean Minimalist Design */}
      <div className="px-6 pb-6 pt-3 shrink-0 bg-white/5 border-t border-white/10">
        <form 
          onSubmit={handleSendMessage}
          className="flex items-end gap-2 bg-[var(--color-gray-50)] border border-[var(--color-gray-300)] focus-within:border-[var(--color-primary)] focus-within:bg-white rounded-[24px] p-1.5 transition-all duration-200 shadow-[0_4px_15px_rgba(0,0,0,0.05)]"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="ถามโจทย์ หรือให้อธิบายเนื้อหา..."
            className="flex-1 max-h-48 min-h-[44px] bg-transparent border-none outline-none focus:outline-none focus:ring-0 resize-none px-4 py-3 text-[14px] leading-relaxed text-[var(--color-black)] placeholder:text-[var(--color-gray-400)] no-scrollbar"
            rows={1}
          />
          
          <div className="flex items-center pr-1 pb-0.5">
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                input.trim() && !isLoading 
                ? 'bg-[var(--color-primary)] text-white hover:scale-105 shadow-sm' 
                : 'bg-transparent text-[var(--color-gray-300)]'
              }`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={input.trim() ? "mr-0.5 mt-0.5" : ""}>
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
