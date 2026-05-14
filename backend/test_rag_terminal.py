# -*- coding: utf-8 -*-
"""
test_rag_terminal.py
สคริปต์สำหรับทดสอบการดึงข้อมูลของ RAG (Vector Search) ผ่าน Terminal
"""

import asyncio
import sys
import os

# ตั้งค่า stdout ให้รองรับ UTF-8 สำหรับ Windows console
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# โหลด .env ก่อน import retriever
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# Import ฟังก์ชันค้นหาแบบ Vector จากระบบที่เราเพิ่งแก้ไป
from retriever import search_lessons_vector

async def main():
    print("=" * 60)
    print("🤖 ทดสอบระบบ RAG Vector Search")
    print("พิมพ์ 'exit' เพื่อออกจากการทดสอบ")
    print("=" * 60)

    while True:
        query = input("\n🔍 ใส่คำค้นหา (หัวข้อหรือเนื้อหาที่อยากดึง): ")
        if query.lower() in ['exit', 'quit']:
            break
            
        if not query.strip():
            continue

        print(f"\n⏳ กำลังค้นหา: '{query}' ...")
        
        try:
            # ค้นหาโดยจำกัดผลลัพธ์ที่ 3 อันดับแรก (เพื่อไม่ให้ยาวเกินไป)
            context = await search_lessons_vector(query, limit=3)
            
            if not context:
                print("❌ ไม่พบเนื้อหาที่เกี่ยวข้องใน Database")
            else:
                print("\n✅ ผลลัพธ์ที่ดึงมาจาก Database (RAG Context):")
                print(context)
                
        except Exception as e:
            print(f"❌ เกิดข้อผิดพลาด: {e}")

if __name__ == "__main__":
    # รัน Async function
    asyncio.run(main())
