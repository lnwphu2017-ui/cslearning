
import json
import re
import os
import sys

# Set encoding for Thai characters
if sys.stdout.encoding != 'utf-8':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def refine_formatting(text):
    # 1. Remove colon from main headers: # บทที่ X: ... -> # บทที่ X ...
    text = re.sub(r'(# บทที่ \d+):', r'\1', text)
    
    # 2. Process subheaders
    # Pattern: Line start, followed by "กลไก..." or any text, ending with ":"
    # We want to: 
    # - Remove "กลไก" or "กลไกล"
    # - Remove any leading "และ" or "การ" if it was part of the "กลไก" prefix
    # - Remove the ":"
    # - Wrap in **bold**
    
    lines = text.split('\n')
    new_lines = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            new_lines.append(line)
            continue
            
        # Match subheaders like "หลอดสูญญากาศ (Vacuum Tubes):" or "กลไกและข้อจำกัด:"
        # Also handle cases where content follows on the same line: "กลไกหลัก: ในมุมมอง..."
        
        # Regex to capture the header part (before colon)
        # It should be at the start of the line or paragraph
        header_match = re.match(r'^([^:\n]+):', stripped)
        if header_match:
            header_part = header_match.group(1).strip()
            content_part = stripped[header_match.end():].strip()
            
            # Clean "กลไก" / "กลไกล"
            # Pattern: matches "กลไก" or "กลไกล" potentially followed by "และ" or "การ" or "หลัก"
            clean_header = re.sub(r'^กลไก(ล)?(การ|และ|หลัก)?\s*', '', header_part).strip()
            
            # If the whole header was just "กลไก", use a fallback or keep it empty
            if not clean_header and "กลไก" in header_part:
                # If it was "กลไกหลัก", and we stripped everything, maybe keep "หลัก"
                if "หลัก" in header_part: clean_header = "หลัก"
                elif "การ" in header_part: clean_header = "การ"
                else: clean_header = header_part # Keep original if nothing left
            
            # Bold the header, remove colon
            formatted_header = f"**{clean_header}**"
            
            if content_part:
                new_lines.append(f"{formatted_header} {content_part}")
            else:
                new_lines.append(formatted_header)
        else:
            new_lines.append(line)
            
    return '\n'.join(new_lines)

def update_files():
    # Update lessons.json
    json_path = 'frontend/src/data/lessons.json'
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if 'year1' in data:
        for slug, lessons in data['year1'].items():
            for lesson in lessons:
                if 'content' in lesson:
                    lesson['content'] = refine_formatting(lesson['content'])
                    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    # Update year1addcontent.txt
    txt_path = 'year1addcontent.txt'
    if os.path.exists(txt_path):
        with open(txt_path, 'r', encoding='utf-8') as f:
            content = f.read()
        updated_content = refine_formatting(content)
        with open(txt_path, 'w', encoding='utf-8') as f:
            f.write(updated_content)

if __name__ == "__main__":
    update_files()
    print("Formatting updated: Removed colons, bolded headers, and stripped 'กลไก'")
