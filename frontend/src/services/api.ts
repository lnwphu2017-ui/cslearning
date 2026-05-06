// API Service for connecting to the LangGraph Backend
// Fast endpoints use Next.js proxy (/api/...), AI generation endpoints call backend directly to avoid proxy timeout.

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  animate?: boolean;
}

export const apiService = {
  // 1. Chat Generation (direct to backend - can be slow)
  async sendChatMessage(messages: ChatMessage[], userId?: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, userId })
      });
      if (!res.ok) throw new Error('Network response was not ok');
      return await res.json();
    } catch (error) {
      console.error('Error in sendChatMessage:', error);
      throw error;
    }
  },

  // 1.1 Chat Generation with Stream (direct to backend)
  async streamChatMessage(messages: ChatMessage[], onChunk: (chunk: string) => void, userId?: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, userId })
      });
      
      if (!res.ok) throw new Error('Network response was not ok');
      if (!res.body) throw new Error('ReadableStream not supported');
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          onChunk(chunk);
        }
      }
    } catch (error) {
      console.error('Error in streamChatMessage:', error);
      throw error;
    }
  },

  // 2. Quiz Generation (direct to backend - takes 30-60s)
  async generateQuiz(chapterTitle: string, content?: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterTitle, content })
      });
      if (!res.ok) throw new Error('Network response was not ok');
      return await res.json();
    } catch (error) {
      console.error('Error in generateQuiz:', error);
      throw error;
    }
  },

  // 3. Flashcard Generation (direct to backend - takes 30-60s)
  async generateFlashcards(chapterTitle: string, content?: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/generate-flashcards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterTitle, content })
      });
      if (!res.ok) throw new Error('Network response was not ok');
      return await res.json();
    } catch (error) {
      console.error('Error in generateFlashcards:', error);
      throw error;
    }
  },
  
  // 4. Exam Generation (direct to backend - takes 60-120s)
  async generateExam(chapterTitles: string[]) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/generate-exam`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterTitles })
      });
      if (!res.ok) throw new Error('Network response was not ok');
      return await res.json();
    } catch (error) {
      console.error('Error in generateExam:', error);
      throw error;
    }
  },

  // 5. PDF Summary Generation (direct to backend)
  async generatePdfSummary(data: { quizScores: any, examResults: any, radarScores: any }) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/generate-pdf-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Network response was not ok');
      return await res.json();
    } catch (error) {
      console.error('Error in generatePdfSummary:', error);
      throw error;
    }
  },

  // 6. Supabase - Get Lessons
  async getLessons() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/lessons`);
      if (!res.ok) throw new Error('Failed to fetch lessons');
      return await res.json();
    } catch (error) {
      console.error('Error in getLessons:', error);
      throw error;
    }
  },

  // 7. Supabase - Mark Lesson as Completed
  async completeLesson(userId: string, lessonId: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/complete-lesson`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, lessonId })
      });
      if (!res.ok) throw new Error('Failed to complete lesson');
      return await res.json();
    } catch (error) {
      console.error('Error in completeLesson:', error);
      throw error;
    }
  },

  async getUserProgress(userId: string, retries = 3) {
    if (!userId) return [];
    const url = `${BACKEND_URL}/api/user-progress/${userId}`;
    
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch user progress');
        return await res.json();
      } catch (error) {
        if (i === retries - 1) {
          console.error(`Final attempt failed for getUserProgress:`, error);
          return []; // Return empty progress instead of crashing the UI
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
      }
    }
    return [];
  },

  // 8. Supabase - Save Score
  async saveScore(data: { userId: string, lessonId: string, type: 'quiz' | 'flashcard', score: number, totalQuestions: number }) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/save-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to save score');
      return await res.json();
    } catch (error) {
      console.error('Error in saveScore:', error);
      throw error;
    }
  },

  // 9. Supabase - Save Exam Result
  async saveExamResult(data: { 
    userId: string, 
    totalScore: number, 
    totalQuestions: number, 
    categoryScores: any, 
    recommendation: string 
  }) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/save-exam-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to save exam result');
      return await res.json();
    } catch (error) {
      console.error('Error in saveExamResult:', error);
      throw error;
    }
  },

  // 10. PDF Generation via WeasyPrint Backend
  async generatePdf(data: { 
    title: string, 
    sections: { title: string, content: string }[], 
    chartImage?: string | null, 
    footerText?: string 
  }): Promise<Blob> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`PDF generation failed: ${errText}`);
      }
      return await res.blob();
    } catch (error) {
      console.error('Error in generatePdf:', error);
      throw error;
    }
  }
};
