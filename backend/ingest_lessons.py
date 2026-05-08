import sys
import os
import json
import re
import requests
from typing import List, Dict, Any
from dotenv import load_dotenv
from supabase import create_client, Client
from langchain_text_splitters import RecursiveCharacterTextSplitter

# 1. ตั้งค่า stdout ให้รองรับ UTF-8 สำหรับ Windows console
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# 2. โหลดไฟล์ .env โดยระบุพาธที่ชัดเจน
base_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(base_dir, ".env")
load_dotenv(dotenv_path)

# 3. เตรียมค่ากำหนดต่างๆ
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_ANON_KEY")
api_key: str = os.environ.get("OPENROUTER_API_KEY")
embedding_model: str = os.environ.get("OPENROUTER_EMBEDDING_MODEL", "nvidia/llama-nemotron-embed-vl-1b-v2:free")

if not url or not key or not api_key:
    print(f"Error: Missing environment variables in {dotenv_path}")
    exit(1)

supabase: Client = create_client(url, key)

# 4. ฟังก์ชันสำหรับเรียก Embedding API โดยตรง
def get_embeddings_from_openrouter(texts: List[str]) -> List[List[float]]:
    endpoint = "https://openrouter.ai/api/v1/embeddings"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": embedding_model,
        "input": texts
    }
    
    response = requests.post(endpoint, headers=headers, json=payload)
    if response.status_code != 200:
        raise Exception(f"OpenRouter Error: {response.status_code} - {response.text}")
        
    res_json = response.json()
    # ดึงค่า embedding ออกมาเรียงตามลำดับ index
    data = res_json.get("data", [])
    if not data:
        raise Exception(f"No embedding data received from OpenRouter")
        
    # คืนค่า list ของ vector
    return [item["embedding"] for item in data]

# 5. ตั้งค่า Text Splitter
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
    separators=["\n\n", "\n", " ", ""]
)

JSON_PATH = os.path.join(base_dir, '..', 'frontend', 'src', 'data', 'lessons.json')

def ingest_lessons():
    print(f"--- Starting Data Ingestion ---")
    print(f"Using .env from: {dotenv_path}")
    
    try:
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading JSON: {e}")
        return

    print("Cleaning existing data...")
    supabase.table('lesson_chunks').delete().neq('course_slug', 'empty_placeholder').execute()

    total_chunks = 0
    for year_key, courses in data.items():
        year_num = int(re.search(r'\d+', year_key).group()) if re.search(r'\d+', year_key) else 0
        for course_slug, lessons_list in courses.items():
            print(f"\nProcessing Course: {course_slug}")
            for lesson in lessons_list:
                title = lesson.get('title', 'Untitled')
                content = lesson.get('content', '')
                if not content: continue
                
                chunks = text_splitter.split_text(content)
                print(f"  Lesson: '{title}' -> {len(chunks)} chunks")
                
                try:
                    # เรียกสร้าง Vector
                    chunk_embeddings = get_embeddings_from_openrouter(chunks)
                    
                    payloads = []
                    for i, (text, vec) in enumerate(zip(chunks, chunk_embeddings)):
                        payloads.append({
                            "content": text,
                            "embedding": vec,
                            "year": year_num,
                            "course_slug": course_slug,
                            "chapter_title": title,
                            "order_index": i
                        })
                    
                    if payloads:
                        supabase.table('lesson_chunks').insert(payloads).execute()
                        total_chunks += len(payloads)
                except Exception as e:
                    print(f"  [ERROR] {title}: {e}")

    print(f"\n--- Done! Total Chunks: {total_chunks} ---")

if __name__ == "__main__":
    ingest_lessons()
