# AI-Powered Computer Science Learning Platform

ระบบแพลตฟอร์มการเรียนรู้วิทยาการคอมพิวเตอร์อัจฉริยะ ที่ใช้ AI ช่วยในการสอน ออกแบบมาเพื่อให้นักศึกษาเรียนรู้ได้ตรงประเด็นและทบทวนความรู้ได้อย่างมีประสิทธิภาพ

## 🌟 Overview

โปรเจกต์นี้เป็น Web Application สำหรับการเรียนการสอนในรายวิชาวิทยาการคอมพิวเตอร์ โดยมีจุดเด่นที่การนำ AI (Large Language Models) เข้ามาบูรณาการในทุกส่วนของการเรียนรู้ ตั้งแต่การตอบคำถามข้อสงสัยในบทเรียน ไปจนถึงการสุ่มสร้างข้อสอบและแบบฝึกหัดจากเนื้อหาบทเรียนโดยตรง เพื่อสร้างประสบการณ์การเรียนรู้แบบเฉพาะบุคคล (Personalized Learning)

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **State Management**: React Context API
- **Authentication**: [Firebase Auth](https://firebase.google.com/docs/auth) (Google Login)
- **Data Visualization**: [Recharts](https://recharts.org/) (สำหรับ Dashboard ผลสอบ)
- **Content Rendering**: React Markdown, Katex (สำหรับสมการคณิตศาสตร์)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **AI Orchestration**: [LangChain](https://www.langchain.com/) & [LangGraph](https://langchain-ai.github.io/langgraph/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **LLM Gateway**: [OpenRouter](https://openrouter.ai/) (รองรับ Llama 3.3, GPT-4o และอื่นๆ)
- **PDF Generation**: [WeasyPrint](https://weasyprint.org/) & Jinja2 templates

### Infrastructure
- **Containerization**: [Docker](https://www.docker.com/) & Docker Compose

## 🚀 Installation

### สิ่งที่ต้องเตรียม (Prerequisites)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ติดตั้งในเครื่อง
- API Key จาก OpenRouter
- Firebase Config (สำหรับ Auth)
- Supabase URL & Key (สำหรับ Database)

### ขั้นตอนการติดตั้ง
1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd propro1
   ```

2. **Setup Environment Variables**
   - สร้างไฟล์ `.env` ในโฟลเดอร์ `backend/` และใส่ค่าต่างๆ (OpenRouter Key, Supabase URL/Key)
   - ตั้งค่า Firebase ใน `frontend/src/lib/firebase.ts`

3. **Run with Docker Compose**
   ```bash
   docker-compose up --build
   ```
   - Frontend จะรันที่: `http://localhost:3000`
   - Backend จะรันที่: `http://localhost:5000`

## 📖 How it Works

### 1. Learning Management
เนื้อหาบทเรียนถูกจัดเก็บในรูปแบบ JSON (`lessons.json`) ซึ่งประกอบด้วยเนื้อหาหลัก, โค้ดตัวอย่าง และสมการทางคอมพิวเตอร์ รองรับการแสดงผลแบบ Interactive

### 2. AI Tutor (RAG System)
ระบบใช้เทคนิค **Retrieval-Augmented Generation (RAG)** โดย AI จะดึงบริบทจากหลักสูตร (Syllabus) และเนื้อหาบทเรียนมาช่วยในการตอบคำถาม เพื่อให้คำตอบมีความถูกต้องแม่นยำตามหลักสูตรที่เรียนจริง

### 3. Automated Evaluation
- **Quiz & Flashcards**: เมื่อจบแต่ละบทเรียน นักศึกษาสามารถกด Gen Quiz หรือ Flashcards ได้ โดย AI จะอ่านเนื้อหาในบทเรียนนั้นๆ แล้วออกคำถามแบบสุ่ม 10 ข้อ
- **Exam System**: ระบบสามารถสร้างข้อสอบจำลอง 20 ข้อ โดยเฉลี่ยจากทุกบทเรียนที่เรียนมา พร้อมจับเวลาเสมือนการสอบจริง

### 4. Progress & Analytics
คะแนนจากการทำ Quiz และ Exam จะถูกบันทึกลงใน Supabase และนำมาแสดงผลเป็นกราฟใยแมงมุม (Radar Chart) ตามหมวดหมู่ของ Bloom's Taxonomy เพื่อให้นักศึกษารู้จุดแข็งจุดอ่อนของตนเอง และสามารถส่งออกผลสรุปเป็นไฟล์ PDF ได้
