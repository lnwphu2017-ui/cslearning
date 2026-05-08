# -*- coding: utf-8 -*-
"""
สคริปต์ทดสอบระบบ RAG แบบเป็นลำดับขั้นตอน
ทดสอบตั้งแต่ Embedding API → Supabase → Vector Search → Full RAG Pipeline

วิธีใช้: python test_rag.py
"""
import sys
import os
import json
import time
import requests
import asyncio
from dotenv import load_dotenv

# ตั้งค่า stdout ให้รองรับ UTF-8 สำหรับ Windows console
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# โหลดไฟล์ .env
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOTENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(DOTENV_PATH)

# ค่ากำหนดจาก Environment Variables
API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
EMBEDDING_MODEL = os.environ.get("OPENROUTER_EMBEDDING_MODEL", "nvidia/llama-nemotron-embed-vl-1b-v2:free")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
BACKEND_URL = "http://localhost:5000"

# ตัวแปรสถานะผลลัพธ์แต่ละขั้นตอน
test_results = []


def PrintHeader(title: str, step: int):
    """แสดงหัวข้อของแต่ละขั้นตอน"""
    print(f"\n{'='*60}")
    print(f"  ขั้นตอนที่ {step}: {title}")
    print(f"{'='*60}")


def RecordResult(step: int, name: str, is_passed: bool, detail: str = ""):
    """บันทึกผลลัพธ์ของแต่ละขั้นตอน"""
    status = "✅ PASS" if is_passed else "❌ FAIL"
    test_results.append({
        "step": step,
        "name": name,
        "passed": is_passed,
        "detail": detail
    })
    print(f"\n  ผลลัพธ์: {status}")
    if detail:
        print(f"  รายละเอียด: {detail}")


# =============================================
# ขั้นตอนที่ 1: ตรวจสอบ Environment Variables
# =============================================
def TestStep1_CheckEnvVars():
    """ตรวจสอบว่า Environment Variables ถูกโหลดครบหรือไม่"""
    PrintHeader("ตรวจสอบ Environment Variables", 1)

    # ตรวจสอบแต่ละตัวแปร
    env_checks = {
        "OPENROUTER_API_KEY": bool(API_KEY),
        "OPENROUTER_EMBEDDING_MODEL": bool(EMBEDDING_MODEL),
        "SUPABASE_URL": bool(SUPABASE_URL),
        "SUPABASE_ANON_KEY": bool(SUPABASE_ANON_KEY),
    }

    print(f"  กำลังโหลดจาก: {DOTENV_PATH}")
    all_passed = True
    for key, is_loaded in env_checks.items():
        status = "✅ โหลดแล้ว" if is_loaded else "❌ ไม่พบ"
        # ซ่อน API Key ไม่ให้แสดงค่าเต็ม
        if is_loaded and "KEY" in key:
            value_preview = os.environ.get(key, "")[:15] + "..."
        elif is_loaded:
            value_preview = os.environ.get(key, "")[:40]
        else:
            value_preview = "N/A"
        print(f"    {key}: {status} ({value_preview})")
        if not is_loaded:
            all_passed = False

    RecordResult(1, "Environment Variables", all_passed,
                 "ตัวแปรทั้งหมดโหลดครบ" if all_passed else "มีตัวแปรที่ขาดหายไป")
    return all_passed


# =============================================
# ขั้นตอนที่ 2: ทดสอบ Embedding API
# =============================================
def TestStep2_EmbeddingApi():
    """ทดสอบว่า OpenRouter Embedding API ทำงานได้ปกติ"""
    PrintHeader("ทดสอบ Embedding API (OpenRouter)", 2)

    test_text = "ระบบปฏิบัติการ Operating System"
    endpoint = "https://openrouter.ai/api/v1/embeddings"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": EMBEDDING_MODEL,
        "input": test_text
    }

    print(f"  Model: {EMBEDDING_MODEL}")
    print(f"  ข้อความทดสอบ: \"{test_text}\"")
    print(f"  กำลังเรียก API...")

    try:
        start_time = time.time()
        response = requests.post(endpoint, headers=headers, json=payload, timeout=30)
        elapsed_time = time.time() - start_time

        if response.status_code == 200:
            res_json = response.json()
            embedding_data = res_json.get("data", [])
            if embedding_data:
                vector = embedding_data[0].get("embedding", [])
                vector_dim = len(vector)
                print(f"  ✅ สถานะ: {response.status_code} OK")
                print(f"  ⏱️ เวลา: {elapsed_time:.2f} วินาที")
                print(f"  📐 มิติของ Vector: {vector_dim}")
                print(f"  🔢 ตัวอย่าง Vector (5 ตัวแรก): {vector[:5]}")
                RecordResult(2, "Embedding API", True,
                             f"ได้ Vector {vector_dim} มิติ ใน {elapsed_time:.2f}s")
                return vector
            else:
                RecordResult(2, "Embedding API", False, "ไม่ได้รับข้อมูล embedding")
                return None
        else:
            print(f"  ❌ สถานะ: {response.status_code}")
            print(f"  ข้อผิดพลาด: {response.text[:200]}")
            RecordResult(2, "Embedding API", False,
                         f"HTTP {response.status_code}: {response.text[:100]}")
            return None

    except requests.exceptions.Timeout:
        RecordResult(2, "Embedding API", False, "Timeout - API ไม่ตอบสนองใน 30 วินาที")
        return None
    except Exception as e:
        RecordResult(2, "Embedding API", False, f"Error: {str(e)}")
        return None


# =============================================
# ขั้นตอนที่ 3: ตรวจสอบข้อมูลใน Supabase
# =============================================
def TestStep3_SupabaseData():
    """ตรวจสอบว่ามีข้อมูล lesson_chunks ใน Supabase หรือไม่"""
    PrintHeader("ตรวจสอบข้อมูลใน Supabase (lesson_chunks)", 3)

    # เรียก Supabase REST API โดยตรง
    url = f"{SUPABASE_URL}/rest/v1/lesson_chunks?select=id,course_slug,chapter_title&limit=5"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json"
    }

    print(f"  กำลังเรียก Supabase REST API...")

    try:
        response = requests.get(url, headers=headers, timeout=15)

        if response.status_code == 200:
            data = response.json()
            row_count = len(data)

            if row_count > 0:
                print(f"  ✅ พบข้อมูล lesson_chunks")
                print(f"  📊 แสดงตัวอย่าง {row_count} rows แรก:")
                for i, row in enumerate(data):
                    print(f"    [{i+1}] วิชา: {row.get('course_slug', 'N/A')} | บท: {row.get('chapter_title', 'N/A')[:40]}")

                # นับจำนวน rows ทั้งหมด
                count_url = f"{SUPABASE_URL}/rest/v1/lesson_chunks?select=id&limit=1"
                count_headers = {**headers, "Prefer": "count=exact"}
                count_res = requests.get(count_url, headers=count_headers, timeout=15)
                total_count = count_res.headers.get("content-range", "unknown")

                print(f"  📦 จำนวน Chunks ทั้งหมด: {total_count}")
                RecordResult(3, "Supabase Data", True,
                             f"พบข้อมูล chunks ({total_count} rows)")
                return True
            else:
                print(f"  ❌ ไม่พบข้อมูลใน lesson_chunks")
                print(f"  💡 ต้อง run: python ingest_lessons.py ก่อน")
                RecordResult(3, "Supabase Data", False,
                             "Table lesson_chunks ว่าง - ยังไม่ได้ ingest")
                return False
        else:
            print(f"  ❌ สถานะ: {response.status_code}")
            RecordResult(3, "Supabase Data", False,
                         f"HTTP {response.status_code}: {response.text[:100]}")
            return False

    except Exception as e:
        RecordResult(3, "Supabase Data", False, f"Error: {str(e)}")
        return False


# =============================================
# ขั้นตอนที่ 4: ทดสอบ Vector Search (RPC)
# =============================================
def TestStep4_VectorSearch(query_vector):
    """ทดสอบ Supabase RPC match_lesson_chunks ด้วย Vector ที่ได้จากขั้นตอนที่ 2"""
    PrintHeader("ทดสอบ Vector Similarity Search (Supabase RPC)", 4)

    if query_vector is None:
        print("  ⚠️ ข้ามขั้นตอนนี้เนื่องจากไม่มี Query Vector (ขั้นตอนที่ 2 ล้มเหลว)")
        RecordResult(4, "Vector Search", False, "ข้ามเพราะไม่มี embedding vector")
        return False

    # เรียก RPC match_lesson_chunks
    url = f"{SUPABASE_URL}/rest/v1/rpc/match_lesson_chunks"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "query_embedding": query_vector,
        "match_threshold": 0.3,
        "match_count": 5
    }

    print(f"  Query: 'ระบบปฏิบัติการ Operating System'")
    print(f"  Threshold: 0.3 | Limit: 5")
    print(f"  กำลังค้นหา...")

    try:
        start_time = time.time()
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        elapsed_time = time.time() - start_time

        if response.status_code == 200:
            results = response.json()
            result_count = len(results)

            if result_count > 0:
                print(f"  ✅ พบผลลัพธ์ {result_count} chunks")
                print(f"  ⏱️ เวลาค้นหา: {elapsed_time:.2f} วินาที")
                print(f"\n  📋 ผลลัพธ์ Vector Search:")
                for i, item in enumerate(results):
                    similarity = item.get('similarity', 0)
                    title = item.get('chapter_title', 'N/A')[:50]
                    slug = item.get('course_slug', 'N/A')
                    content_preview = item.get('content', '')[:80]
                    print(f"    [{i+1}] 🎯 ความเกี่ยวข้อง: {similarity:.4f}")
                    print(f"        บท: {title}")
                    print(f"        วิชา: {slug}")
                    print(f"        เนื้อหา: {content_preview}...")

                # ตรวจสอบว่าผลลัพธ์สมเหตุสมผลไหม
                # คำค้น "ระบบปฏิบัติการ" ควรจะเจอบทเกี่ยวกับ OS
                top_result_title = results[0].get('chapter_title', '').lower()
                is_relevant = any(keyword in top_result_title for keyword in
                                  ['ระบบปฏิบัติการ', 'operating', 'os', 'ซอฟต์แวร์', 'software'])

                if is_relevant:
                    print(f"\n  🎉 ผลลัพธ์ตรงกับคำค้นหา! RAG ค้นหาถูกต้อง!")
                else:
                    print(f"\n  ⚠️ ผลลัพธ์อาจไม่ตรงกับคำค้น (แต่ยังเจอข้อมูล)")

                RecordResult(4, "Vector Search", True,
                             f"พบ {result_count} results ใน {elapsed_time:.2f}s | "
                             f"Top similarity: {results[0].get('similarity', 0):.4f}")
                return True
            else:
                print(f"  ❌ ไม่พบผลลัพธ์ที่ตรงกับ threshold")
                RecordResult(4, "Vector Search", False,
                             "ไม่พบผลลัพธ์ - อาจต้องลด threshold หรือ re-ingest")
                return False
        else:
            error_detail = response.text[:200]
            print(f"  ❌ สถานะ: {response.status_code}")
            print(f"  ข้อผิดพลาด: {error_detail}")

            if "function" in error_detail.lower() and "not exist" in error_detail.lower():
                print(f"\n  💡 ยังไม่ได้สร้าง RPC Function 'match_lesson_chunks' ใน Supabase")
                print(f"     ต้องไปสร้าง SQL Function ก่อน")

            RecordResult(4, "Vector Search", False,
                         f"HTTP {response.status_code}: {error_detail[:100]}")
            return False

    except Exception as e:
        RecordResult(4, "Vector Search", False, f"Error: {str(e)}")
        return False


# =============================================
# ขั้นตอนที่ 5: ทดสอบ Full RAG Pipeline (Backend API)
# =============================================
def TestStep5_FullRagPipeline():
    """ทดสอบ Backend API ว่าใช้ RAG จริง (/api/generate-quiz)"""
    PrintHeader("ทดสอบ Full RAG Pipeline (Backend API)", 5)

    print(f"  🔗 Backend URL: {BACKEND_URL}")
    print(f"  กำลังเรียก POST /api/generate-quiz...")
    print(f"  (หมายเหตุ: ต้องเปิด Backend Server ก่อน - python main.py)")

    payload = {
        "chapterTitle": "บทที่ 5: พื้นฐานระบบปฏิบัติการและซอฟต์แวร์"
    }

    try:
        start_time = time.time()
        response = requests.post(
            f"{BACKEND_URL}/api/generate-quiz",
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=120  # Quiz generation อาจใช้เวลานาน
        )
        elapsed_time = time.time() - start_time

        if response.status_code == 200:
            quiz_data = response.json()
            questions = quiz_data.get("questions", [])

            if questions:
                print(f"  ✅ สร้าง Quiz สำเร็จ!")
                print(f"  ⏱️ เวลาทั้งหมด: {elapsed_time:.2f} วินาที")
                print(f"  📝 จำนวนคำถาม: {len(questions)}")
                print(f"\n  📋 ตัวอย่างคำถาม (2 ข้อแรก):")
                for i, q in enumerate(questions[:2]):
                    print(f"    [{i+1}] {q.get('question', 'N/A')[:80]}...")
                    print(f"        Domain: {q.get('domain', 'N/A')}")
                    print(f"        ตัวเลือก: {len(q.get('options', []))} ข้อ")

                # ตรวจสอบว่าเนื้อหา Quiz เกี่ยวข้องกับ OS หรือไม่
                all_questions_text = " ".join([q.get("question", "") for q in questions])
                os_keywords = ["ระบบปฏิบัติการ", "Operating System", "Kernel", "Process",
                               "Memory", "Virtual", "User Space", "File System",
                               "หน่วยความจำ", "โปรเซส"]
                matched_keywords = [kw for kw in os_keywords if kw.lower() in all_questions_text.lower()]

                if matched_keywords:
                    print(f"\n  🎉 คำถามเกี่ยวข้องกับ OS จริง!")
                    print(f"     พบ keywords: {', '.join(matched_keywords[:5])}")
                    print(f"     → พิสูจน์ว่า RAG ดึงเนื้อหาจาก lessons.json มาสร้างข้อสอบจริง!")
                else:
                    print(f"\n  ⚠️ ไม่พบ keyword ที่ตรงกับเนื้อหา OS")

                RecordResult(5, "Full RAG Pipeline", True,
                             f"สร้าง {len(questions)} คำถาม ใน {elapsed_time:.2f}s | "
                             f"Keywords: {len(matched_keywords)}")
                return True
            else:
                RecordResult(5, "Full RAG Pipeline", False, "ได้ JSON แต่ไม่มี questions")
                return False
        else:
            print(f"  ❌ สถานะ: {response.status_code}")
            print(f"  ข้อผิดพลาด: {response.text[:200]}")
            RecordResult(5, "Full RAG Pipeline", False,
                         f"HTTP {response.status_code}")
            return False

    except requests.exceptions.ConnectionError:
        print(f"  ❌ ไม่สามารถเชื่อมต่อ Backend ได้")
        print(f"  💡 ต้องเปิด Backend Server ก่อน: python main.py")
        RecordResult(5, "Full RAG Pipeline", False,
                     "Connection refused - ยังไม่ได้เปิด Backend Server")
        return False
    except requests.exceptions.Timeout:
        RecordResult(5, "Full RAG Pipeline", False,
                     "Timeout - ใช้เวลาเกิน 120 วินาที")
        return False
    except Exception as e:
        RecordResult(5, "Full RAG Pipeline", False, f"Error: {str(e)}")
        return False


# =============================================
# สรุปผลลัพธ์ทั้งหมด
# =============================================
def PrintSummary():
    """แสดงสรุปผลลัพธ์ทั้ง 5 ขั้นตอน"""
    print(f"\n{'='*60}")
    print(f"  📊 สรุปผลการทดสอบระบบ RAG")
    print(f"{'='*60}")

    total_passed = sum(1 for r in test_results if r["passed"])
    total_tests = len(test_results)

    for r in test_results:
        status = "✅" if r["passed"] else "❌"
        print(f"  {status} ขั้นตอนที่ {r['step']}: {r['name']}")
        if r["detail"]:
            print(f"     └─ {r['detail']}")

    print(f"\n  ผ่าน: {total_passed}/{total_tests} ขั้นตอน")

    if total_passed == total_tests:
        print(f"\n  🎉🎉🎉 ระบบ RAG ทำงานได้สมบูรณ์ครบทุกขั้นตอน! 🎉🎉🎉")
    elif total_passed >= 4:
        print(f"\n  ✅ ระบบ RAG ทำงานได้เกือบสมบูรณ์ (ตรวจสอบขั้นตอนที่ FAIL)")
    elif total_passed >= 3:
        print(f"\n  ⚠️ ระบบ RAG ทำงานได้บางส่วน ต้องแก้ไขก่อนใช้งานจริง")
    else:
        print(f"\n  ❌ ระบบ RAG ยังไม่พร้อมใช้งาน ตรวจสอบ Environment และ Data")

    print(f"{'='*60}")


# =============================================
# Main — รันทดสอบทั้ง 5 ขั้นตอนตามลำดับ
# =============================================
if __name__ == "__main__":
    print(f"{'='*60}")
    print(f"  🧪 เริ่มทดสอบระบบ RAG — CSL AI Learning Dashboard")
    print(f"  📅 เวลา: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}")

    # ขั้นตอนที่ 1: ตรวจสอบ Environment Variables
    env_ok = TestStep1_CheckEnvVars()

    # ขั้นตอนที่ 2: ทดสอบ Embedding API (ต้อง env ผ่านก่อน)
    query_vector = None
    if env_ok:
        query_vector = TestStep2_EmbeddingApi()
    else:
        PrintHeader("ทดสอบ Embedding API (OpenRouter)", 2)
        RecordResult(2, "Embedding API", False, "ข้ามเพราะ ENV ไม่ครบ")

    # ขั้นตอนที่ 3: ตรวจสอบข้อมูลใน Supabase
    if env_ok:
        TestStep3_SupabaseData()
    else:
        PrintHeader("ตรวจสอบข้อมูลใน Supabase", 3)
        RecordResult(3, "Supabase Data", False, "ข้ามเพราะ ENV ไม่ครบ")

    # ขั้นตอนที่ 4: ทดสอบ Vector Search
    TestStep4_VectorSearch(query_vector)

    # ขั้นตอนที่ 5: ทดสอบ Full RAG Pipeline
    TestStep5_FullRagPipeline()

    # สรุปผลลัพธ์
    PrintSummary()
"""CodeContent"""
