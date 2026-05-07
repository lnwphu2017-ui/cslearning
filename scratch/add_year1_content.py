import json
import re
import os

def clean_title(title):
    return re.sub(r'^บทที่\s*\d+\s*:\s*', '', title).strip()

def is_heading(line):
    line = line.strip()
    if not line: return False
    # Heuristics for headings:
    # 1. Ends with :
    # 2. Starts with a number or letter followed by . (e.g. 1. , A. )
    # 3. Short line (< 80 chars) and standalone
    if line.endswith(':'): return True
    if re.match(r'^[\d\w]\.\s+', line): return True
    if len(line) < 80 and not line.endswith('.') and not line.endswith('ครับ') and not line.endswith('ค่ะ'):
        return True
    return False

def parse_addcontent(file_path):
    print(f"Parsing {file_path}...")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        with open(file_path, 'r', encoding='cp874') as f:
            content = f.read()
    
    content = content.replace('\r\n', '\n')
    
    # Split by "บทที่ X:" (must be at the start of a line or after a newline)
    parts = re.split(r'\n(?=บทที่\s*\d+\s*:)', content)
    
    title_map = {} # cleaned_title -> additional_content
    for part in parts:
        part = part.strip()
        if not part: continue
        
        # Match the title line
        match = re.match(r'(บทที่\s*\d+\s*:[^\n]*)', part)
        if match:
            full_title_line = match.group(1).strip()
            # The rest of the content after the title line
            # Careful: if the title line had content appended directly, we need to split it
            # But usually re.match with [^\n]* stops at the newline.
            # If there was no newline, everything is in match.group(1).
            
            # Let's split by the first newline to be safe
            split_part = part.split('\n', 1)
            title_line = split_part[0]
            body = split_part[1] if len(split_part) > 1 else ""
            
            # Special case: If content starts right after title on the same line
            # e.g. "บทที่ 6: Title)Content starts here"
            # We can try to detect the closing parenthesis or similar if present
            # But for now, let's just use the title as defined until the newline
            
            cleaned_title = clean_title(title_line)
            
            formatted_body = []
            for line in body.split('\n'):
                if is_heading(line):
                    formatted_body.append(f"**{line.strip()}**")
                else:
                    formatted_body.append(line)
            
            title_map[cleaned_title] = "\n\n" + "\n".join(formatted_body)
            
    return title_map

import sys

# Ensure UTF-8 output for Windows console
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

def main():
    lessons_path = 'frontend/src/data/lessons.json'
    addcontent_path = 'year1addcontent.txt'
    
    if not os.path.exists(lessons_path) or not os.path.exists(addcontent_path):
        print("Missing files.")
        return

    with open(lessons_path, 'r', encoding='utf-8') as f:
        lessons_data = json.load(f)

    title_map = parse_addcontent(addcontent_path)
    
    # Update Year 1 lessons
    updated_count = 0
    for slug, lessons in lessons_data.get('year1', {}).items():
        for lesson in lessons:
            title = lesson['title']
            cleaned_target = clean_title(title)
            
            # Try to find a match in our additional content map
            # We use fuzzy match (cleaned)
            found_match = None
            for add_title, add_content in title_map.items():
                if cleaned_target in add_title or add_title in cleaned_target:
                    found_match = add_content
                    break
            
            if found_match:
                lesson['content'] += found_match
                updated_count += 1
                print(f"Updated {slug} - {title}")

    # Save back to lessons.json
    with open(lessons_path, 'w', encoding='utf-8') as f:
        json.dump(lessons_data, f, ensure_ascii=False, indent=2)

    print(f"Successfully added content to {updated_count} lessons in Year 1.")

if __name__ == "__main__":
    main()
