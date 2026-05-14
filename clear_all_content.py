import sys
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# 1. ตั้งค่า stdout ให้รองรับ UTF-8 สำหรับ Windows console
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# 2. โหลดไฟล์ .env
base_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(base_dir, "backend", ".env")
load_dotenv(dotenv_path)

# 3. เตรียมค่ากำหนดต่างๆ
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_ANON_KEY")

if not url or not key:
    print(f"Error: Missing environment variables in {dotenv_path}")
    exit(1)

supabase: Client = create_client(url, key)

def clear_content():
    print("--- Starting Content Deletion ---")
    
    # 1. ลบข้อมูลจากตาราง lessons
    try:
        print("Cleaning lessons...")
        res = supabase.table('lessons').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        print(f"Successfully cleared lessons.")
    except Exception as e:
        print(f"Error during cleaning lessons: {e}")

    # 2. ลบข้อมูลจากตาราง lesson_chunks
    try:
        print("Cleaning lesson_chunks...")
        # ลองใช้ filter ที่เป็นกลางกว่า (id ไม่เท่ากับค่าที่เป็นไปไม่ได้)
        res = supabase.table('lesson_chunks').delete().neq('id', '0').execute()
        print(f"Successfully cleared lesson_chunks.")
    except Exception as e:
        print(f"Error during cleaning lesson_chunks: {e}")
        
    print("\n--- Deletion Process Finished ---")

if __name__ == "__main__":
    clear_content()
