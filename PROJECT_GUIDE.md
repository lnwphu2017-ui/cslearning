# 📘 คู่มือโครงสร้างโปรเจค CSLearning (Project Guide)

คู่มือนี้สรุปโครงสร้างไฟล์และการทำงานของส่วนต่างๆ ในโปรเจค เพื่อให้ง่ายต่อการพัฒนาและแก้ไขในอนาคต

---

## 📂 โครงสร้างภาพรวม (High-Level Structure)

```text
propro/
├── frontend/             # ส่วนหน้าบ้าน (Next.js 15, Tailwind CSS)
├── backend/              # ส่วนหลังบ้าน (Node.js, Express, LangGraph)
├── plan.md               # พิมพ์เขียวและแผนงานดั้งเดิม
└── syllabus.txt          # ข้อมูลหลักสูตรดิบ
```

---

## 🖥️ ส่วน Frontend (`/frontend`)

ใช้เทคโนโลยี Next.js 15 (App Router) และดีไซน์แบบ **Premium Monochrome Glassmorphism**

### 1. หน้าหลักและการนำทาง (`src/app`)
- **`app/page.tsx`**: Landing Page หลัก (หน้าที่มีการเลือกชั้นปี Year 1-4)
- **`app/layout.tsx`**: โครงสร้างหลักของเว็บ (รวม AuthProvider และ Navbar)
- **`app/globals.css`**: ไฟล์ CSS หลักที่เก็บ **Design Tokens** (สี, Font, Animation และสไตล์ Scrollbar)
- **`app/year/[number]/page.tsx`**: หน้ารายชื่อวิชาของแต่ละชั้นปี
- **`app/course/[slug]/page.tsx`**: หน้าห้องเรียนหลัก (มีแท็บ Content, Flashcards, Quiz, Exam)

### 2. คอมโพเนนต์ที่สำคัญ (`src/components`)
- **`InlineAIChat.tsx`**: ห้องแชท AI ที่อยู่ด้านขวาของหน้าเรียน
- **`AIChatPanel.tsx`**: แผงควบคุมแชท AI
- **`AuthNavbar.tsx`**: แถบเมนูด้านบนที่จัดการเรื่องการล็อกอิน

### 3. ระบบจัดการข้อมูลและ Auth (`src/contexts`, `src/services`, `src/lib`)
- **`contexts/AuthContext.tsx`**: **(สำคัญ)** จัดการเรื่องการ Login ด้วย Google และสถานะผู้ใช้
- **`lib/firebase.ts`**: การตั้งค่า Firebase SDK สำหรับ Google Auth
- **`services/api.ts`**: ตัวเชื่อมต่อ (API Client) ระหว่าง Frontend และ Backend
- **`data/courses.json`**: ไฟล์ฐานข้อมูลวิชาทั้งหมด (ชื่อวิชา, รหัสวิชา, บทเรียน)

---

## ⚙️ ส่วน Backend (`/backend`)

ใช้ Node.js (Express) ร่วมกับ LangChain และ LangGraph ในการจัดการ AI

### 1. ไฟล์หลัก
- **`server.js`**: **(สำคัญ)** ไฟล์หลักที่รัน Server และจัดการ API Endpoints ทั้งหมด (รวมถึงการเชื่อมต่อ OpenAI/OpenRouter)
- **`retriever.js`**: จัดการระบบ RAG (Retrieval-Augmented Generation) เพื่อดึงเนื้อหาจากฐานข้อมูลมาตอบคำถาม
- **`.env`**: เก็บ API Keys ต่างๆ (ห้ามนำขึ้น Git)

### 2. ข้อมูลและการประมวลผล
- **`data/`**: เก็บเนื้อหาบทเรียนที่ถูกแปลงเป็นฟอร์แมตที่ AI เข้าใจได้

---

## 🎨 จุดที่ต้องแก้ไขบ่อย (Common Customizations)

### แก้ไขสีหรือดีไซน์หลัก
- เข้าไปที่ `frontend/src/app/globals.css` มองหาช่วง `:root` เพื่อเปลี่ยนค่าตัวแปรสี (Design Tokens)

### เพิ่ม/ลดวิชาหรือบทเรียน
- แก้ไขที่ `frontend/src/data/courses.json` ระบบจะอัปเดตหน้าเว็บและเมนู Sidebar ให้โดยอัตโนมัติ

### ปรับเปลี่ยนการตอบสนองของ AI
- แก้ไข Prompt หรือ Logic ใน `backend/server.js`

### แก้ไขหน้าห้องเรียน (Content/Quiz/Exam)
- แก้ไขที่ `frontend/src/app/course/[slug]/page.tsx` ซึ่งเป็นจุดศูนย์กลางของ Logic แท็บต่างๆ

---

## 🚀 วิธีการรันโปรเจค (Development)

1. **Backend**: เข้าไปที่โฟลเดอร์ `backend` แล้วรัน `npm run dev`
2. **Frontend**: เข้าไปที่โฟลเดอร์ `frontend` แล้วรัน `npm run dev`

---
*คู่มือนี้จัดทำขึ้นเพื่อให้ทีมพัฒนาเข้าใจตำแหน่งไฟล์ได้รวดเร็วขึ้น หากมีการเพิ่มฟีเจอร์ใหญ่ๆ ควรมาอัปเดตไฟล์นี้ด้วย*
