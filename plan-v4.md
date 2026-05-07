# แผนการพัฒนาระบบ RAG สำหรับ AI Computer Science Study Planner (Fast Track)

แผนการทำงานฉบับเน้นความรวดเร็วและใช้งานจริง: ใช้ LangChain เป็นแกนหลัก, ดึง Embedding ผ่าน Hugging Face, และประมวลผลข้อสอบผ่าน OSS LLM API เพื่อความรวดเร็วและเลี่ยงปัญหา Timeout

---

## 1. Tech Stack (เครื่องมือหลัก)
- **Vector Database:** Supabase (`pgvector` ขนาด 768 หรือ 1024 มิติ)
- **Framework:** LangChain (JS/TS หรือ Python)
- **Embedding API:** Hugging Face API (`intfloat/multilingual-e5-base` หรือ `BAAI/bge-m3`)
- **LLM API:** Groq หรือ OpenRouter (ใช้โมเดล OSS เช่น Llama 3.1 70B หรือ Qwen 2.5 72B)

---

## 2. โครงสร้างฐานข้อมูล (Database Schema)
ตาราง `lesson_chunks` สำหรับเก็บข้อมูลที่พร้อมค้นหา:
- `id`: uuid (Primary Key)
- `content`: text (เนื้อหาย่อยที่หั่นแล้ว)
- `embedding`: vector
- `year`: int (ชั้นปี)
- `subject_name`: text (ชื่อวิชา)
- `chapter_id`: int (ลำดับบทที่)

---

## 3. ขั้นตอนการเตรียมข้อมูล (Data Ingestion)
1. **Fetch & Clean:** ดึงเนื้อหา CS มาทำความสะอาด (คงรูปแบบ Code Snippet ไว้)
2. **Chunking:** ใช้ `RecursiveCharacterTextSplitter` ของ LangChain (ขนาด 800-1000, Overlap 200)
3. **Embed & Store:** แปลงข้อความเป็น Vector ผ่าน Hugging Face API และ Insert ลง Supabase พร้อม Metadata (`year`, `subject`, `chapter`)

---

## 4. ระบบการค้นหาและสร้างเนื้อหา (Retrieval & Generation)

### 4.1 การทำงานของ LangChain (Linear Flow)
ใช้แนวคิด RAG มาตรฐาน โดยร้อยเรียงคำสั่ง (Chain) ดังนี้:
1. **Retriever:** ค้นหาเนื้อหาจาก Supabase ตามวิชา/บทเรียนที่ผู้ใช้เลือก (ได้ Context)
2. **Prompt Template:** นำ Context มาผสมกับคำสั่งสร้างข้อสอบ พร้อมระบุเงื่อนไข Bloom's Taxonomy
3. **LLM:** ส่ง Prompt ไปยัง Groq / OpenRouter API
4. **Parser:** ใช้ `StructuredOutputParser` ของ LangChain บังคับให้ผลลัพธ์ออกมาเป็น JSON Array ที่นำไปใช้ต่อได้ทันที

### 4.2 กลยุทธ์การสร้าง Exam (40 ข้อ)
เพื่อป้องกัน API ตอบกลับช้าจนติด Timeout:
- ใช้วิธี **Batching:** ใช้ For Loop วนคำสั่ง LangChain รอบละ 5 ข้อ (สลับดึง Context ตาม `chapter_id`) ทั้งหมด 8 รอบ
- เมื่อครบ 8 รอบ ให้นำ JSON ทั้งหมดมาต่อกัน (Concat) และสลับลำดับข้อ (Shuffle) ก่อนส่งไปแสดงผลที่หน้า Frontend

---

## 5. โครงสร้าง JSON ผลลัพธ์ (Output Format)
```json
[
  {
    "question": "คำถาม...",
    "options": ["A", "B", "C", "D"],
    "answer": "ข้อที่ถูก",
    "bloom_level": "ระดับการเรียนรู้",
    "explanation": "คำอธิบายอ้างอิงจากเนื้อหา"
  }
]
```
