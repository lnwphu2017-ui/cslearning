import json
import re
import os

def migrate():
    y1_path = r'c:\Users\Admin\Desktop\Project7\project1.3\propro1\backend\data\y1.txt'
    lessons_path = r'c:\Users\Admin\Desktop\Project7\project1.3\propro1\frontend\src\data\lessons.json'
    
    if not os.path.exists(y1_path):
        print(f"Error: {y1_path} not found")
        return
    
    if not os.path.exists(lessons_path):
        print(f"Error: {lessons_path} not found")
        return

    # Read y1.txt
    with open(y1_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the start of the first course
    # ### 1. 09-131-101 Introduction to Computer Science (10 บท)
    course_match = re.search(r'### 1\..*?Introduction to Computer Science.*?\n', content)
    if not course_match:
        print("Error: Could not find course header in y1.txt")
        return

    course_content = content[course_match.end():]
    
    # Split into chapters
    # Use finditer to get positions and markers
    # Use (?:\n|^) to match either a newline or the start of the string
    marker_pattern = r'(?:\n|^)\s*\*\s*\*\*บทที่ (\d+):'
    matches = list(re.finditer(marker_pattern, course_content))
    print(f"Found {len(matches)} chapter markers")
    for m in matches:
        print(f"  Marker: บทที่ {m.group(1)}")

    # Extract content between markers
    final_chapters = []
    for i in range(len(matches)):
        start = matches[i].end()
        end = matches[i+1].start() if i+1 < len(matches) else len(course_content)
        ch_text = course_content[start:end]
        
        # Remove the summary line (the part after the marker on the same line)
        parts = ch_text.split('\n', 1)
        if len(parts) > 1:
            body = parts[1].strip()
            final_chapters.append(body)
        else:
            final_chapters.append(ch_text.strip())

    # Load lessons.json
    with open(lessons_path, 'r', encoding='utf-8') as f:
        lessons_data = json.load(f)

    if "year1" not in lessons_data:
        print("Error: 'year1' key not found in lessons.json")
        return

    if "intro-to-cs" not in lessons_data["year1"]:
        print("Error: 'intro-to-cs' key not found in lessons.json['year1']")
        return

    # Update content
    for i, ch_body in enumerate(final_chapters):
        if i < len(lessons_data["year1"]["intro-to-cs"]):
            lessons_data["year1"]["intro-to-cs"][i]["content"] = ch_body
        else:
            print(f"Warning: Chapter {i+1} found in y1.txt but no corresponding entry in lessons.json")

    # Save lessons.json
    with open(lessons_path, 'w', encoding='utf-8') as f:
        json.dump(lessons_data, f, ensure_ascii=False, indent=2)

    print("Migration completed successfully!")

if __name__ == "__main__":
    migrate()
