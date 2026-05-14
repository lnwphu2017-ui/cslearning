# -*- coding: utf-8 -*-
"""
ingest_curriculum.py
สคริปต์สำหรับนำเนื้อหาหลักสูตรทั้ง 4 ชั้นปีขึ้น Supabase Database
แบ่งเป็น 2 ขั้นตอน:
  1. Insert ข้อมูลดิบลง curriculum_content
  2. Chunk + Embed ลง curriculum_chunks (สำหรับ RAG Vector Search)

การใช้งาน:
  python ingest_curriculum.py                 # ทำทุกขั้นตอน
  python ingest_curriculum.py --content-only  # เฉพาะ step 1
  python ingest_curriculum.py --chunks-only   # เฉพาะ step 2
"""

import sys
import os
import json
import time
import argparse
import requests
from typing import List, Dict, Any
from dotenv import load_dotenv
from supabase import create_client, Client

# ตั้งค่า stdout ให้รองรับ UTF-8 สำหรับ Windows console
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# โหลด .env
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOTENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(DOTENV_PATH)

# ค่ากำหนดจาก environment
SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY: str = os.environ.get("SUPABASE_ANON_KEY", "")
API_KEY: str = os.environ.get("OPENROUTER_API_KEY", "")
EMBEDDING_MODEL: str = os.environ.get(
    "OPENROUTER_EMBEDDING_MODEL",
    "nvidia/llama-nemotron-embed-vl-1b-v2:free"
)

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# พาธไปยังไฟล์ JSON ของแต่ละปี
FRONTEND_DATA_DIR = os.path.join(BASE_DIR, '..', 'frontend', 'src', 'data')
COURSES_JSON_PATH = os.path.join(FRONTEND_DATA_DIR, 'courses.json')

YEAR_JSON_FILES = {
    1: os.path.join(FRONTEND_DATA_DIR, 'year1-content.json'),
    2: os.path.join(FRONTEND_DATA_DIR, 'year2-content.json'),
    3: os.path.join(FRONTEND_DATA_DIR, 'year3-content.json'),
    4: os.path.join(FRONTEND_DATA_DIR, 'year4-content.json'),
}

# ค่ากำหนดสำหรับ Text Chunking
CHUNK_SIZE = 800
CHUNK_OVERLAP = 150
# จำนวน texts ที่ส่งไป embed ต่อ batch (API limit)
EMBEDDING_BATCH_SIZE = 20
# หน่วงเวลาระหว่าง batch (วินาที) เพื่อไม่ให้โดน rate limit
BATCH_DELAY_SECONDS = 1.5


def LoadCoursesMapping() -> Dict[str, int]:
    """
    โหลด courses.json เพื่อ map slug -> year_number
    คืนค่า dict เช่น {"intro-to-cs": 1, "database-systems": 2, ...}
    """
    with open(COURSES_JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    slug_to_year: Dict[str, int] = {}
    for year_group in data.get("years", []):
        year_num = year_group.get("year", 0)
        for course in year_group.get("courses", []):
            slug = course.get("slug", "")
            if slug:
                slug_to_year[slug] = year_num

    return slug_to_year


def LoadAllContent() -> List[Dict[str, Any]]:
    """
    โหลดและรวมข้อมูลจาก JSON ทั้ง 4 ปีเป็น list ของ records
    แต่ละ record = 1 dropdown item
    """
    slug_to_year = LoadCoursesMapping()
    all_records: List[Dict[str, Any]] = []

    for year_num, json_path in YEAR_JSON_FILES.items():
        if not os.path.exists(json_path):
            print(f"  ⚠️  ไม่พบไฟล์: {json_path}")
            continue

        with open(json_path, 'r', encoding='utf-8') as f:
            year_data = json.load(f)

        for slug, course_data in year_data.items():
            course_title = course_data.get("course_title", "")
            # ใช้ year จาก courses.json mapping เป็นหลัก, fallback เป็น year_num
            resolved_year = slug_to_year.get(slug, year_num)

            for chapter in course_data.get("chapters", []):
                ch_number = chapter.get("chapter_number", 0)
                ch_title = chapter.get("chapter_title", "")

                for dropdown in chapter.get("dropdowns", []):
                    header = dropdown.get("header", "")
                    content = dropdown.get("content", "")

                    if header and content:
                        all_records.append({
                            "year": resolved_year,
                            "course_slug": slug,
                            "course_title": course_title,
                            "chapter_number": ch_number,
                            "chapter_title": ch_title,
                            "dropdown_header": header,
                            "dropdown_content": content,
                        })

    return all_records


def IngestContent(records: List[Dict[str, Any]]) -> None:
    """
    Step 1: นำข้อมูลดิบ (dropdown items) ทั้งหมดลง table curriculum_content
    """
    print("\n📥 Step 1: กำลัง insert ข้อมูลดิบลง curriculum_content...")

    # ลบข้อมูลเก่าก่อน
    try:
        supabase.table('curriculum_content').delete().neq(
            'course_slug', '__placeholder__'
        ).execute()
        print("  🧹 ลบข้อมูลเก่าเรียบร้อย")
    except Exception as e:
        print(f"  ⚠️  ลบข้อมูลเก่าไม่สำเร็จ (อาจเป็น table ใหม่): {e}")

    # Insert เป็น batch (Supabase insert limit ~1000 rows ต่อครั้ง)
    BATCH_SIZE = 200
    total_inserted = 0

    for i in range(0, len(records), BATCH_SIZE):
        batch = records[i:i + BATCH_SIZE]
        try:
            supabase.table('curriculum_content').insert(batch).execute()
            total_inserted += len(batch)
            print(f"  ✅ Inserted batch {i // BATCH_SIZE + 1}: {len(batch)} records (รวม {total_inserted})")
        except Exception as e:
            print(f"  ❌ Error inserting batch {i // BATCH_SIZE + 1}: {e}")
            # ลอง insert ทีละ record เพื่อหา record ที่มีปัญหา
            for j, record in enumerate(batch):
                try:
                    supabase.table('curriculum_content').insert([record]).execute()
                    total_inserted += 1
                except Exception as inner_e:
                    print(f"    ❌ Record error [{record['course_slug']}] {record['dropdown_header']}: {inner_e}")

    print(f"\n  📊 สรุป: Insert สำเร็จ {total_inserted}/{len(records)} records")


def SplitTextIntoChunks(text: str, chunk_size: int = CHUNK_SIZE,
                         chunk_overlap: int = CHUNK_OVERLAP) -> List[str]:
    """
    แบ่งข้อความเป็น chunks โดยใช้ separators หลายระดับ
    """
    # ถ้าข้อความสั้นพอ ไม่ต้องแบ่ง
    if len(text) <= chunk_size:
        return [text.strip()] if text.strip() else []

    chunks: List[str] = []
    separators = ["\n\n", "\n", " "]

    # หา separator ที่เหมาะสมที่สุด
    current_sep = " "
    for sep in separators:
        if sep in text:
            current_sep = sep
            break

    parts = text.split(current_sep)
    current_chunk = ""

    for part in parts:
        # ถ้าเพิ่ม part แล้วไม่เกิน chunk_size
        test_chunk = current_chunk + current_sep + part if current_chunk else part
        if len(test_chunk) <= chunk_size:
            current_chunk = test_chunk
        else:
            # บันทึก chunk ปัจจุบัน
            if current_chunk.strip():
                chunks.append(current_chunk.strip())
            # เริ่ม chunk ใหม่พร้อม overlap
            if chunk_overlap > 0 and current_chunk:
                overlap_text = current_chunk[-chunk_overlap:]
                current_chunk = overlap_text + current_sep + part
            else:
                current_chunk = part

    # chunk สุดท้าย
    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    return chunks


def GetEmbeddingsFromOpenrouter(texts: List[str]) -> List[List[float]]:
    """
    เรียก OpenRouter Embedding API เพื่อสร้าง vectors
    """
    endpoint = "https://openrouter.ai/api/v1/embeddings"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": EMBEDDING_MODEL,
        "input": texts
    }

    response = requests.post(endpoint, headers=headers, json=payload, timeout=60)
    if response.status_code != 200:
        raise Exception(f"OpenRouter Error: {response.status_code} - {response.text[:200]}")

    res_json = response.json()
    data = res_json.get("data", [])
    if not data:
        raise Exception("No embedding data received from OpenRouter")

    # เรียงตาม index เพื่อให้ตรงกับลำดับ input
    sorted_data = sorted(data, key=lambda x: x.get("index", 0))
    return [item["embedding"] for item in sorted_data]


def IngestChunks(records: List[Dict[str, Any]]) -> None:
    """
    Step 2: Chunk เนื้อหา + สร้าง Embeddings + Insert ลง curriculum_chunks
    """
    print("\n📥 Step 2: กำลัง chunk + embed + insert ลง curriculum_chunks...")

    if not API_KEY:
        print("  ❌ Error: Missing OPENROUTER_API_KEY สำหรับสร้าง embeddings")
        return

    # ลบข้อมูลเก่า
    try:
        supabase.table('curriculum_chunks').delete().neq(
            'course_slug', '__placeholder__'
        ).execute()
        print("  🧹 ลบ chunks เก่าเรียบร้อย")
    except Exception as e:
        print(f"  ⚠️  ลบ chunks เก่าไม่สำเร็จ: {e}")

    # เตรียม chunks ทั้งหมดก่อน
    all_chunk_records: List[Dict[str, Any]] = []

    for record in records:
        text = f"{record['dropdown_header']}\n{record['dropdown_content']}"
        chunks = SplitTextIntoChunks(text)

        for idx, chunk_text in enumerate(chunks):
            all_chunk_records.append({
                "content": chunk_text,
                "year": record["year"],
                "course_slug": record["course_slug"],
                "chapter_number": record["chapter_number"],
                "chapter_title": record["chapter_title"],
                "dropdown_header": record["dropdown_header"],
                "order_index": idx,
            })

    print(f"  📊 จำนวน chunks ทั้งหมด: {len(all_chunk_records)}")

    # สร้าง embeddings เป็น batch แล้ว insert
    total_inserted = 0
    total_errors = 0

    for i in range(0, len(all_chunk_records), EMBEDDING_BATCH_SIZE):
        batch = all_chunk_records[i:i + EMBEDDING_BATCH_SIZE]
        batch_texts = [r["content"] for r in batch]
        batch_num = i // EMBEDDING_BATCH_SIZE + 1
        total_batches = (len(all_chunk_records) + EMBEDDING_BATCH_SIZE - 1) // EMBEDDING_BATCH_SIZE

        try:
            # สร้าง embeddings
            embeddings = GetEmbeddingsFromOpenrouter(batch_texts)

            # เพิ่ม embedding vector เข้าไปใน record
            payloads = []
            for record, vector in zip(batch, embeddings):
                payloads.append({
                    "content": record["content"],
                    "embedding": vector,
                    "year": record["year"],
                    "course_slug": record["course_slug"],
                    "chapter_number": record["chapter_number"],
                    "chapter_title": record["chapter_title"],
                    "dropdown_header": record["dropdown_header"],
                    "order_index": record["order_index"],
                })

            # Insert ลง Supabase
            supabase.table('curriculum_chunks').insert(payloads).execute()
            total_inserted += len(payloads)
            print(f"  ✅ Batch {batch_num}/{total_batches}: {len(payloads)} chunks embedded + inserted (รวม {total_inserted})")

        except Exception as e:
            total_errors += len(batch)
            print(f"  ❌ Batch {batch_num}/{total_batches} error: {str(e)[:150]}")

        # หน่วงเวลาเพื่อไม่ให้โดน rate limit
        if i + EMBEDDING_BATCH_SIZE < len(all_chunk_records):
            time.sleep(BATCH_DELAY_SECONDS)

    print(f"\n  📊 สรุป Chunks: สำเร็จ {total_inserted}, ผิดพลาด {total_errors}")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="นำเนื้อหาหลักสูตรขึ้น Supabase Database")
    parser.add_argument('--content-only', action='store_true',
                        help='เฉพาะ insert ข้อมูลดิบลง curriculum_content')
    parser.add_argument('--chunks-only', action='store_true',
                        help='เฉพาะ chunk + embed ลง curriculum_chunks')
    args = parser.parse_args()

    print("=" * 60)
    print("🚀 Curriculum Ingestion Tool")
    print("=" * 60)

    # โหลดข้อมูลทั้งหมด
    print("\n📖 กำลังโหลดข้อมูลจาก JSON files...")
    all_records = LoadAllContent()
    print(f"  📊 โหลดเสร็จ: {len(all_records)} dropdown items จากทุกชั้นปี")

    # แสดงสถิติ
    year_stats: Dict[int, int] = {}
    course_stats: Dict[str, int] = {}
    for r in all_records:
        year_stats[r["year"]] = year_stats.get(r["year"], 0) + 1
        course_stats[r["course_slug"]] = course_stats.get(r["course_slug"], 0) + 1

    print("\n  📊 สถิติแยกตามปี:")
    for year_num in sorted(year_stats.keys()):
        print(f"     ปี {year_num}: {year_stats[year_num]} items")
    print(f"     รวม: {len(all_records)} items จาก {len(course_stats)} วิชา")

    # ดำเนินการตาม args
    if args.content_only:
        IngestContent(all_records)
    elif args.chunks_only:
        IngestChunks(all_records)
    else:
        IngestContent(all_records)
        IngestChunks(all_records)

    print("\n" + "=" * 60)
    print("✅ เสร็จสิ้น!")
    print("=" * 60)


if __name__ == "__main__":
    main()
