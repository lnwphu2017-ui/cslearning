import json
import re

def minimalist_reformat(content):
    if not content: return content
    
    # 1. Fix missing newlines before section numbers
    content = re.sub(r'([^\n])(\d+\.\s+[ก-๙a-zA-Z])', r'\1\n\n## \2', content)
    
    # 2. Convert standard starts of lines to H2
    content = re.sub(r'^(\d+\.\s+.*)$', r'## \1', content, flags=re.MULTILINE)
    
    # 3. NO EMOJIS - Ensure clean H2
    content = re.sub(r'^##\s*[📜🏗️🗣️🛡️🌐📊🔢]\s*', r'## ', content, flags=re.MULTILINE)
    
    # 4. Bold terms in parentheses (English terms)
    content = re.sub(r'\(([a-zA-Z\s\-]{3,})\)', r'(**\1**)', content)

    # 5. Handle sub-headers (e.g. "ขั้นตอนที่ 1:")
    content = re.sub(r'^(ขั้นตอนที่\s*\d+:)', r'### \1', content, flags=re.MULTILINE)

    # 6. Ensure consistent spacing
    lines = [line.strip() for line in content.split('\n')]
    new_lines = []
    for i, line in enumerate(lines):
        if not line: continue
        new_lines.append(line)
        # Add extra newline after headers or if next line exists
        if line.startswith('#') or (i < len(lines)-1 and lines[i+1]):
            new_lines.append("")
            
    content = "\n".join(new_lines)
    
    # 7. Add Horizontal Rules before H2 for a clean break
    # But only if it's not the first section
    sections = content.split('\n## ')
    if len(sections) > 1:
        new_content = sections[0]
        for section in sections[1:]:
            new_content += "\n\n---\n\n## " + section
        content = new_content
    
    # Clean up
    content = re.sub(r'\n{3,}', '\n\n', content)
    content = re.sub(r'(---\n)+---', r'---', content)
    
    return content

file_path = r'c:/Users/kil/Desktop/New folder (2)/Product/frontend/src/data/lessons.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for year in data:
    if isinstance(data[year], dict):
        for course in data[year]:
            for lesson in data[year][course]:
                # Apply minimalist polish
                lesson['content'] = minimalist_reformat(lesson.get('content', ''))

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Minimalist reformatting complete (No emojis).")
