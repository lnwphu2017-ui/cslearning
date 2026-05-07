import os
import json
import re
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Initialize Supabase client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_ANON_KEY")

if not url or not key:
    print("Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env")
    exit(1)

supabase: Client = create_client(url, key)

# Path to lessons.json
JSON_PATH = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'src', 'data', 'lessons.json')

def migrate_lessons():
    print(f"--- Starting Migration ---")
    print(f"Reading lessons from {JSON_PATH}...")
    
    try:
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading JSON file: {e}")
        return

    # 1. Clean existing data to avoid duplicates
    print("Cleaning existing lessons data...")
    try:
        # Deleting all rows where id is not null (effective truncate via REST)
        supabase.table('lessons').delete().neq('title', 'placeholder_that_doesnt_exist').execute()
        print("Existing data cleared.")
    except Exception as e:
        print(f"Warning during cleanup: {e}")

    total_inserted = 0
    
    # Structure is year (e.g., 'year1') -> course_slug -> list of lessons
    for year_key, courses in data.items():
        # Extract numeric year from key 'year1' -> 1
        year_num = int(re.search(r'\d+', year_key).group()) if re.search(r'\d+', year_key) else 0
        
        for course_slug, lessons_list in courses.items():
            print(f"\nMigrating: Year {year_num} | Course: {course_slug} | {len(lessons_list)} lessons")
            
            for index, lesson in enumerate(lessons_list):
                title = lesson.get('title', f"Lesson {index+1}")
                content = lesson.get('content', '')
                
                payload = {
                    "title": title,
                    "content": content,
                    "order_index": index,
                    "course_slug": course_slug,
                    "year": year_num  # New column
                }
                
                try:
                    # Using a small batch or individual insert for better error tracking
                    response = supabase.table('lessons').insert([payload]).execute()
                    if response.data:
                        # Print only every 5th or first/last to keep logs clean
                        if index == 0 or index == len(lessons_list) - 1:
                            print(f"  [OK] Lesson: {title[:40]}")
                        total_inserted += 1
                except Exception as e:
                    print(f"  [FAILED] {title[:30]}: {e}")

    print(f"\n--- Migration Complete ---")
    print(f"Total inserted: {total_inserted} lessons.")

if __name__ == "__main__":
    migrate_lessons()
