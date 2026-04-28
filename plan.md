# Project Blueprint: CSLearning (AI-Powered CS Learning Hub)

## 1. Project Concept & Vision
* *Name:* CSLearning
* *Type:* โปรเจคสหกิจศึกษา (Co-operative Education)
* *Team:* 2 คน
* *Target Users:* นักศึกษา CS ในมหาวิทยาลัย (Internal Use)
* *Mission:* แพลตฟอร์มการเรียนรู้ระดับพรีเมียมสำหรับนักศึกษา CS ที่ใช้ระบบ *Stateful AI Agents* เพื่อจัดการเนื้อหาบทเรียนที่ซับซ้อนให้แม่นยำและตรงประเด็นที่สุด
* *Key Feature:* การใช้ *LangGraph* ควบคุมกระบวนการคิดของ AI ให้มีการตรวจสอบความถูกต้อง (Verification) ก่อนแสดงผล
* *Content Strategy:*
  - **รายชื่อวิชา** → จาก syllabus.txt (ของจริงจากหลักสูตร)
  - **เนื้อหาบทเรียน** → **Static Content** เขียน/สร้างไว้ล่วงหน้า เก็บเป็นไฟล์ JSON/Markdown แสดงผลตรงๆ (ไม่ใช่ AI เจนใหม่ทุกรอบ)
  - **AI** → ใช้เฉพาะ **ฟีเจอร์ interactive** เท่านั้น (Quiz Generation, Flashcard Generation, Chat Q&A, Summary)
  - **ผู้ใช้** → ไม่ต้องอัพโหลดอะไร ทุกอย่างพร้อมใช้งาน

---

## 2. Design Language (White Clean Premium)
* *Aesthetics:* Apple-style Minimalist, High-quality Typography, Spacious Layout.
* *Color Palette:*

| Token | สี | ใช้งาน |
|-------|-----|--------|
| Primary | `#007AFF` | ปุ่มหลัก, Accent, Link |
| Primary Hover | `#0056CC` | Hover state |
| Primary Light | `#E8F2FF` | Background ที่เกี่ยวข้องกับ primary |
| Success | `#34C759` | ตอบถูก, สถานะสำเร็จ |
| Error | `#FF3B30` | ตอบผิด, Error |
| Warning | `#FF9500` | เตือน, AI กำลังประมวลผล |
| Info | `#5AC8FA` | ข้อมูลทั่วไป |
| BG Primary | `#FFFFFF` | พื้นหลังหลัก |
| BG Secondary | `#F9FAFB` | พื้นหลังรอง |
| BG Tertiary | `#F2F2F7` | พื้นหลังระดับ 3 |
| Text Primary | `#1D1D1F` | ข้อความหลัก |
| Text Secondary | `#6E6E73` | ข้อความรอง |
| Text Tertiary | `#AEAEB2` | ข้อความระดับ 3 |
| Border | `#D2D2D7` | เส้นขอบ |
| AI Thinking | `#FF9500` | AI กำลังคิด |
| AI Complete | `#34C759` | AI ประมวลผลเสร็จ |

* *Typography:* `Inter` + `Noto Sans Thai` (Primary), `JetBrains Mono` (Code)
* *UI Focus:* การใช้ Soft Shadows (`0 4px 12px rgba(0,0,0,0.08)`) และ Micro-interactions เพื่อสร้างประสบการณ์ที่ลื่นไหลและดูแพง
* *Thai Text:* `line-height: 1.8` สำหรับเนื้อหาภาษาไทย เพื่อความอ่านง่าย

---

## 3. AI Agent Architecture (Powered by LangGraph)
เพื่อให้ AI ตอบตรงกับเนื้อหาที่ผู้ใช้เรียนที่สุด เราจะเปลี่ยนจาก Linear Call เป็น *Cyclic Graph Workflow*:

### กระบวนการทำงาน (Stateful Graph):
```
User Request
     ↓
[1. Content Classifier] → จำแนกประเภทคำร้องขอ (Quiz/Flashcard/Summary/Q&A)
     ↓
[2. Semantic Cache Check] → ถ้ามีคำตอบแคชอยู่ → ส่งกลับทันที
     ↓ (ถ้าไม่มีแคช)
[3. Analyze Content (RAG)] → ดึงเนื้อหาจาก Vector DB (เนื้อหาที่ระบบสร้างไว้แล้ว)
     ↓
[4. Generator Agent] → สร้างเนื้อหาตามประเภทที่ Classifier กำหนด
     ↓
[5. Reviewer Agent (The Critic)] → ตรวจสอบความถูกต้องเทียบกับต้นฉบับ
     ├── ❌ หากข้อมูลคลาดเคลื่อน → ส่งกลับ Generator (Loopback, สูงสุด 3 รอบ)
     └── ✅ หากถูกต้อง → ส่งต่อ
     ↓
[6. Formatter Agent] → จัดรูปแบบข้อมูล (Markdown/JSON) ก่อนส่ง Frontend
     ↓
[7. User Feedback Collector] → รับ 👍/👎 + แก้ไข → ปรับปรุง RAG ในรอบถัดไป
```

### ⚠️ แยก 2 ระบบ: Static Content vs AI Interactive

```
┌─────────────────────────────────────────────────────────────────┐
│  ระบบที่ 1: STATIC CONTENT (เนื้อหาบทเรียน)                      │
│  ────────────────────────────────────────────                    │
│  เขียน/สร้างไว้ล่วงหน้า → เก็บเป็น JSON/Markdown                  │
│  → แสดงผลตรงๆ ไม่ผ่าน AI → โหลดเร็ว, ไม่เสีย API                 │
│                                                                 │
│  syllabus.txt → ดึงหัวข้อวิชา/บท                                  │
│       ↓                                                         │
│  ทีมพัฒนาเขียนเนื้อหา → เก็บเป็น Static Files                    │
│       ↓                       (JSON/Markdown)                   │
│  Frontend อ่านไฟล์แสดงผลทันที (ไม่ต้องเรียก AI)                   │
│                                                                 │
│  + Embed เนื้อหาลง ChromaDB (สำหรับ AI อ้างอิง)                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ระบบที่ 2: AI INTERACTIVE (Quiz, Flashcard, Chat)              │
│  ────────────────────────────────────────────                    │
│  เรียก AI ผ่าน LangGraph เฉพาะเมื่อผู้ใช้ร้องขอ                   │
│                                                                 │
│  ผู้ใช้กดสร้าง Quiz / ถามคำถาม / สร้าง Flashcard                  │
│       ↓                                                         │
│  [LangGraph Pipeline] → ดึง Static Content จาก ChromaDB (RAG)  │
│       ↓                                                         │
│  [AI สร้าง Quiz/Flashcard/ตอบคำถาม] → ตรวจสอบ → แสดงผล          │
└─────────────────────────────────────────────────────────────────┘
```

**หลักการสำคัญ:**
* 📖 **เนื้อหาบทเรียน = Static** → ไม่เรียก AI ไม่เสีย API ไม่ต้องรอ
* 🤖 **Quiz/Flashcard/Chat = AI** → เรียก GPT-OSS-120B เฉพาะตอนที่ต้องการ
* 🔍 **RAG** → AI อ้างอิงเนื้อหา Static เพื่อสร้าง Quiz/ตอบคำถามให้ตรงประเด็น

### กฎความปลอดภัยของ Agent:
* `MAX_RETRIES = 3` — ป้องกัน Infinite Loop ระหว่าง Generator ↔ Reviewer
* ถ้าเกิน 3 รอบ → ส่ง partial result + warning ให้ผู้ใช้
* Prompt Injection Prevention — sanitize input ก่อนส่งเข้า LLM
* Output Sanitization — กรอง content ที่ไม่เหมาะสมก่อนแสดงผล

---

## 4. Technical Stack

| ส่วน | เทคโนโลยี | เหตุผล |
|------|-----------|--------|
| **Frontend** | Next.js 15 (App Router) | เวอร์ชันล่าสุด, Server Components, Streaming |
| **Styling** | Tailwind CSS + Shadcn/UI | Rapid development, Consistent design |
| **AI Orchestration** | LangGraph | จัดการ Workflow/Loops ของ Agent |
| **LLM** | GPT-OSS-120B (ผ่าน OpenRouter) | ฟรี, Open-weight, Apache 2.0, MoE architecture |
| **LLM Fallback** | GPT-OSS-120B self-hosted / อื่นๆ บน OpenRouter | กรณี Free tier หมดโควตา |
| **Backend** | FastAPI (Python) | Async, High-performance |
| **Vector Database** | ChromaDB | ฟรี, ง่ายต่อการตั้งค่า, เหมาะกับ Internal use |
| **Database** | Supabase PostgreSQL | ฟรี tier, Auth ในตัว |
| **Authentication** | NextAuth.js v5 | จัดการ Login/Session |
| **Real-time** | Server-Sent Events (SSE) | แสดง AI Thought Process แบบ streaming |
| **PDF Export** | Playwright | CSS styling ดี, ผลลัพธ์สวย |
| **Monitoring** | Sentry + LangSmith | ติดตาม error + debug LangGraph chain |
| **Caching** | Semantic Cache (embedding similarity) | ลดการเรียก LLM ซ้ำ |

### หมายเหตุ GPT-OSS-120B:
* **สถาปัตยกรรม:** Mixture-of-Experts (MoE), ~116.8B params, ~5.1B active per pass
* **License:** Apache 2.0 (ใช้ได้ฟรี)
* **เข้าถึงผ่าน:** OpenRouter API (ฟรี tier) — ใช้ API format เดียวกับ OpenAI
* **ความสามารถ:** Reasoning, Function calling, Tool use, Structured outputs
* **ข้อจำกัด:** Free tier อาจมี rate limit → ใช้ Semantic Cache ช่วยลดการเรียก

---

## 5. Page Design & Layout

### 5.1 Layout หลัก — 3 Column Layout
```
┌──────────────────────────────────────────────────────────────────────┐
│  🎓 CSL AI            Content  Quiz  Flashcards  Exam       👤 User │
├─────────┬────────────────────────────────────────────┬───────────────┤
│ 📚      │  📍 Breadcrumb Navigation                  │  🤖 AI Chat   │
│ Sidebar │  ████████░░░░ Progress Bar                 │  Panel        │
│ (260px) │  ┌────────────────────────────┐            │  (360px)      │
│ TOC +   │  │  เนื้อหาบทเรียน / Quiz     │            │  Expandable   │
│ Progress│  │  / Flashcard / Exam        │            │  Context-     │
│         │  └────────────────────────────┘            │  Aware        │
│         │  ◀ Previous          Next ▶                │  Streaming    │
├─────────┴────────────────────────────────────────────┴───────────────┤
│  © CSLearning 2026                                                   │
└──────────────────────────────────────────────────────────────────────┘
```

### 5.2 หน้าหลัก 5 หน้า
1. **📖 Content** — เนื้อหาบทเรียนแบบ Accordion พร้อม Interactive Diagrams + Key Takeaway boxes
2. **📝 Quiz** — ข้อสอบพร้อม Timer, Difficulty indicator, Feedback panel + คำอธิบายหลังตอบ
3. **📇 Flashcards** — Card flip animation (3D Y-axis) พร้อม Spaced Repetition System (SRS)
4. **📋 Exam** — สอบจำลอง Midterm/Final แบ่งส่วนปรนัย + อัตนัย, มี Draft save
5. **📊 Dashboard** — ภาพรวมการเรียน: Progress รายวิชา, Weakness Analysis, Streak, Heatmap

### 5.3 AI Chat Panel — ปรับปรุงจากแบบเดิม
| ด้าน | ❌ เดิม | ✅ ใหม่ |
|------|--------|--------|
| ขนาด | กล่องเล็ก 200px | Panel 360px, expandable |
| ตำแหน่ง | ลอยมุมขวาบน | Docked ด้านขวาเป็น Column |
| ปิด/เปิด | ไม่ได้ | Toggle (⌘+K / Ctrl+K) |
| Streaming | ไม่มี | SSE streaming ทีละตัวอักษร |
| Context | ไม่รู้บริบท | Context-aware (รู้ว่าอ่านบทไหน) |
| Feedback | ไม่มี | 👍/👎 + Copy button |

### 5.4 Sidebar Navigation — ใหม่
* แสดง Table of Contents แบบ Expandable
* Progress icons: ✅ เรียนจบ, 🔵 กำลังเรียน, ○ ยังไม่เรียน
* Progress bar ด้านบนแสดง % ภาพรวม
* Quick stats ด้านล่าง: คะแนน Quiz + จำนวน Flashcard ที่ต้องทบทวน
* Collapsible: บน Mobile ซ่อนเป็น Hamburger menu

### 5.5 Responsive Breakpoints
| Breakpoint | ขนาด | Layout |
|-----------|------|--------|
| Mobile | < 768px | Sidebar ซ่อน (Hamburger), AI Chat ซ่อน (FAB button) |
| Tablet | 768-1024px | Sidebar icon-only (60px), AI Chat overlay |
| Desktop | 1024-1440px | 3-column layout เต็มรูปแบบ |
| Large | > 1440px | Content max-width 800px, เพิ่ม padding |

### 5.6 Micro-Animations
| Element | Animation | Duration |
|---------|----------|----------|
| Accordion | Smooth height + fade | 300ms ease |
| Page transition | Slide left/right | 250ms ease-out |
| AI Chat message | Fade in + slide up | 200ms ease |
| AI Streaming | Typewriter effect | 20ms/char |
| Flashcard flip | 3D rotate Y-axis | 400ms ease-in-out |
| Quiz answer select | Scale pulse | 150ms |
| Progress bar | Width + color change | 500ms ease |
| Success feedback | Confetti (subtle) | 1000ms |
| Error feedback | Shake X-axis | 300ms |
| Skeleton loading | Shimmer gradient | 1500ms loop |

---

## 6. Features (เรียงตาม Priority)

### 🔴 Must-Have (MVP) — ทั้ง 2 คนต้องทำให้ได้
1. **Content Viewer** — แสดงเนื้อหาจาก syllabus.txt แบบ Accordion + Navigation
2. **AI Chat (Context-Aware)** — ถาม AI ตามบริบทบทเรียนที่กำลังอ่าน (ผ่าน GPT-OSS-120B)
3. **Quiz Generation** — AI สร้าง Quiz จากเนื้อหา + ตรวจคำตอบ + อธิบาย
4. **Flashcard Generation** — AI สร้าง Flashcard + ระบบ Flip card
5. **AI Thought Process Viewer** — แสดงขั้นตอนการคิดของ AI แบบ real-time

### 🟡 Should-Have — ควรทำถ้ามีเวลา
6. **Spaced Repetition System (SRS)** — ระบบทบทวน Flashcard อัตโนมัติ
7. **Study Dashboard** — Progress tracking, Weakness analysis, Streak system
8. **Exam Mode** — สอบจำลอง Midterm/Final แบบจับเวลา
9. **PDF Export** — Export Quiz/Flashcard/Summary เป็น PDF Premium
10. **Authentication** — Login/Register สำหรับนักศึกษา

### 🟢 Nice-to-Have — Bonus ถ้าเหลือเวลา
11. **Content Pre-Generation Pipeline** — สร้างเนื้อหาทั้ง 27 วิชา ล่วงหน้า
12. **Semantic Cache** — ลดการเรียก API ซ้ำ
13. **Leaderboard** — กระดานคะแนนรวม

---

## 7. Security Plan

| ด้าน | รายละเอียด |
|------|-----------|
| **Authentication** | JWT + Refresh Token, Secure session, HttpOnly cookies |
| **API Security** | Rate limiting, Input validation (Zod), CORS strict |
| **AI Security** | Prompt injection prevention, Output sanitization |
| **API Key Management** | Environment variables (.env.local), ไม่ hardcode |
| **Headers** | HSTS, X-Content-Type-Options, X-Frame-Options, CSP |

---

## 8. Project Structure (Monorepo)

```
cslearning/
├── frontend/                    # Next.js 15 App
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   ├── components/         # UI components
│   │   │   ├── ui/             # Shadcn/UI base components
│   │   │   ├── content/        # Content viewer components
│   │   │   ├── quiz/           # Quiz components
│   │   │   ├── flashcard/      # Flashcard components
│   │   │   ├── exam/           # Exam components
│   │   │   ├── dashboard/      # Dashboard components
│   │   │   └── chat/           # AI Chat panel components
│   │   ├── hooks/              # Custom hooks
│   │   ├── services/           # API client services
│   │   ├── types/              # TypeScript types
│   │   ├── utils/              # Utility functions
│   │   ├── constants/          # Constants
│   │   └── config/             # Configuration
│   └── public/                 # Static assets
│
├── backend/                    # FastAPI App
│   ├── app/
│   │   ├── api/                # API endpoints
│   │   │   ├── routes/         # Route handlers
│   │   │   └── dependencies/   # Dependency injection
│   │   ├── agents/             # LangGraph agents
│   │   │   ├── nodes/          # Graph nodes (classifier, generator, reviewer, formatter)
│   │   │   ├── graphs/         # Graph definitions
│   │   │   └── state/          # State schemas
│   │   ├── services/           # Business logic
│   │   ├── models/             # Database models
│   │   ├── utils/              # Utilities
│   │   └── config/             # Configuration
│   ├── tests/                  # Test files
│   └── data/                   # Syllabus data + Pre-generated content
│
├── shared/                     # Shared types/contracts
├── docs/                       # Documentation
├── docker-compose.yml          # Container orchestration
└── README.md
```

---

## 9. Deployment Plan

| สภาพแวดล้อม | เทคโนโลยี | เหตุผล |
|-------------|-----------|--------|
| **Frontend** | Vercel | ฟรี tier, รองรับ Next.js ได้ดีที่สุด |
| **Backend** | Railway / Render | รองรับ FastAPI + Python |
| **Vector DB** | ChromaDB on Railway | ฟรี, Internal use เพียงพอ |
| **Database** | Supabase PostgreSQL | ฟรี tier |
| **LLM API** | OpenRouter (GPT-OSS-120B Free) | ฟรี, ไม่ต้อง self-host |
| **Monitoring** | Sentry (Free tier) | Error tracking |

---

## 10. Task Division — แบ่งงาน 2 คน

### 👤 คนที่ 1: Frontend Developer
| Phase | งาน |
|-------|-----|
| Phase 1 | Setup Next.js 15 + Tailwind + Shadcn/UI + Design System |
| Phase 1 | สร้าง Layout หลัก (Top Bar, Sidebar, Content Area, AI Chat Panel) |
| Phase 2 | AI Chat Panel (SSE streaming, Context-aware) |
| Phase 2 | AI Thought Process Viewer component |
| Phase 3 | Quiz UI (Timer, Answer selection, Feedback) |
| Phase 3 | Flashcard UI (3D flip animation, SRS buttons) |
| Phase 4 | Dashboard, Exam Mode, Responsive, Animations |

### 👤 คนที่ 2: Backend + AI Developer
| Phase | งาน |
|-------|-----|
| Phase 1 | Setup FastAPI + LangGraph boilerplate + ChromaDB |
| Phase 1 | Content Pipeline: syllabus.txt → Chunk → Embed → ChromaDB |
| Phase 2 | LangGraph Nodes: Classifier, Generator, Reviewer, Formatter |
| Phase 2 | เชื่อม GPT-OSS-120B ผ่าน OpenRouter API |
| Phase 3 | Quiz/Flashcard/Summary generation endpoints |
| Phase 3 | SSE streaming endpoints |
| Phase 4 | Auth, Rate limiting, Semantic Cache, Testing |

---

## 11. Phased Implementation

### Phase 1: Foundation (สัปดาห์ที่ 1-2) 🏗️
- [ ] ตั้ง Monorepo structure (Frontend + Backend)
- [ ] Setup Next.js 15 + Tailwind CSS + Shadcn/UI + Design System
- [ ] สร้าง Layout หลัก (3-column: Sidebar, Content, AI Chat)
- [ ] สร้างหน้า Content Viewer จาก syllabus.txt (Accordion + Navigation)
- [ ] Setup FastAPI + LangGraph + ChromaDB
- [ ] Content Pipeline: Parse syllabus.txt → สร้างเนื้อหา → Embed → ChromaDB
- [ ] เขียน API endpoint พื้นฐาน (list courses, get content)

### Phase 2: Core AI Pipeline (สัปดาห์ที่ 3-4) 🤖
- [ ] เชื่อม GPT-OSS-120B ผ่าน OpenRouter API
- [ ] สร้าง LangGraph State Schema + Content Classifier Node
- [ ] พัฒนา 4 Agent Nodes (Classifier, Generator, Reviewer, Formatter)
- [ ] เพิ่ม Max Retry (3 รอบ) + Error handling
- [ ] เชื่อม Frontend ↔ Backend (SSE streaming)
- [ ] สร้าง AI Thought Process Viewer
- [ ] สร้าง AI Chat Panel (Context-aware, Streaming)

### Phase 3: Feature Development (สัปดาห์ที่ 5-6) 🚀
- [ ] Quiz Generation + Interactive UI + Feedback panel
- [ ] Flashcard Generation + Flip animation + SRS
- [ ] Exam Mode (Midterm/Final จำลอง)
- [ ] Study Dashboard (Progress, Weakness, Streak)
- [ ] PDF Export

### Phase 4: Polish & Deploy (สัปดาห์ที่ 7-8) ✨
- [ ] Authentication (NextAuth.js v5)
- [ ] Semantic Cache
- [ ] Responsive Design (Mobile, Tablet, Desktop)
- [ ] Micro-animations ทั้งหมด
- [ ] Performance optimization (Lighthouse > 90)
- [ ] Security hardening
- [ ] Testing (Unit + Integration)
- [ ] Deploy to Production (Vercel + Railway)
- [ ] Documentation + README

---

## 12. Advantages of this Approach
* *Cost-Free:* ใช้ GPT-OSS-120B ฟรีผ่าน OpenRouter + ChromaDB + Supabase + Vercel free tier = ค่าใช้จ่าย $0
* *Accuracy:* ลด "AI หลอน" (Hallucination) เพราะมี Reviewer Agent ตรวจสอบซ้ำ
* *Precision:* ตอบคำถามตรงตามเนื้อหาที่ระบบสร้างไว้ ไม่ใช่ความรู้ทั่วไป
* *Premium UX:* 3-column layout + Micro-animations + AI Thought Process สร้างความประทับใจ
* *Scalable:* หากอนาคตต้องการเพิ่มวิชา แค่เพิ่มข้อมูลใน syllabus → ระบบสร้างเนื้อหาอัตโนมัติ
* *Technical Complexity:* แสดงทักษะ AI ระดับสูง (Agentic Workflow, RAG, LangGraph) เหมาะสำหรับสหกิจ