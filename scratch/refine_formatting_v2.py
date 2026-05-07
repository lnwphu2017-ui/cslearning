
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
    
    # Special case: Fix the messed up Keyword line from previous run
    text = text.replace("**> **Keyword****", "> **Keyword**:")
    
    lines = text.split('\n')
    new_lines = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            new_lines.append(line)
            continue
            
        # Ignore lines starting with Markdown blockquote or list markers
        if stripped.startswith('>') or stripped.startswith('-') or stripped.startswith('*') or stripped.startswith('#'):
            new_lines.append(line)
            continue

        # Pattern: Line start, followed by text, ending with ":"
        # Or Line start, followed by "Header: Content"
        
        # We only want to bold if it's a "Header" (short part before colon)
        # and avoid bolding long sentences that just happen to end with a colon.
        
        header_match = re.match(r'^([^:\n]{2,60}):', stripped)
        if header_match:
            header_part = header_match.group(1).strip()
            content_part = stripped[header_match.end():].strip()
            
            # Clean "กลไก" / "กลไกล"
            # Note: The user said "กลไกล" (with extra ล) but likely means "กลไก"
            # We'll handle both.
            clean_header = re.sub(r'^กลไก(ล)?(การ|และ|หลัก)?\s*', '', header_part).strip()
            
            # Fallback if empty
            if not clean_header and "กลไก" in header_part:
                if "หลัก" in header_part: clean_header = "หลัก"
                elif "การ" in header_part: clean_header = "การ"
                else: clean_header = header_part
            
            formatted_header = f"**{clean_header}**"
            
            if content_part:
                new_lines.append(f"{formatted_header} {content_part}")
            else:
                new_lines.append(formatted_header)
        else:
            # Check for lines that were already bolded but might need "กลไก" removed
            # Example: **กลไกและข้อจำกัด**
            bold_match = re.match(r'^\*\*([^\*]+)\*\*(.*)', stripped)
            if bold_match:
                header_text = bold_match.group(1).strip()
                rest = bold_match.group(2).strip()
                
                # Remove "กลไก" if present inside bold
                clean_header = re.sub(r'^กลไก(ล)?(การ|และ|หลัก)?\s*', '', header_text).strip()
                if not clean_header and "กลไก" in header_text:
                    clean_header = header_text
                
                new_lines.append(f"**{clean_header}** {rest}")
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
    print("Formatting updated: Fixed Keyword, removed colons, bolded headers, and stripped 'กลไก'")
