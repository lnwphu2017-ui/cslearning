import json
import re

def smart_reformat(content):
    if not content: return content
    
    # 1. Fix missing newlines before section numbers (e.g. "text1. Title" -> "text\n## 1. Title")
    # This matches a digit followed by a dot and space, preceded by a non-newline character.
    content = re.sub(r'([^\n])(\d+\.\s+[ก-๙a-zA-Z])', r'\1\n\n## \2', content)
    
    # 2. Convert standard starts of lines to H2 if they look like sections
    content = re.sub(r'^(\d+\.\s+.*)$', r'## \1', content, flags=re.MULTILINE)
    
    # 3. Add Emoji to H2 headers based on keywords
    def add_emoji(match):
        title = match.group(1)
        if "ประวัติ" in title: title = "📜 " + title
        elif "สถาปัตยกรรม" in title: title = "🏗️ " + title
        elif "ภาษา" in title: title = "🗣️ " + title
        elif "ความปลอดภัย" in title: title = "🛡️ " + title
        elif "เครือข่าย" in title: title = "🌐 " + title
        elif "ข้อมูล" in title: title = "📊 " + title
        elif "ขั้นตอน" in title or "อัลกอริทึม" in title: title = "🔢 " + title
        return f"## {title}"
    
    content = re.sub(r'^##\s*(.*)$', add_emoji, content, flags=re.MULTILINE)

    # 4. Bold terms in parentheses (English terms)
    content = re.sub(r'\(([a-zA-Z\s\-]{3,})\)', r'(**\1**)', content)

    # 5. Handle lists (lines starting with - or * or specific keywords)
    content = re.sub(r'^(ขั้นตอนที่\s*\d+:)', r'### \1', content, flags=re.MULTILINE)

    # 6. Ensure double newlines between paragraphs
    lines = [line.strip() for line in content.split('\n')]
    new_lines = []
    for i, line in enumerate(lines):
        if not line: continue
        new_lines.append(line)
        # Add extra newline after headers or if next line exists
        if line.startswith('#') or (i < len(lines)-1 and lines[i+1]):
            new_lines.append("")
            
    content = "\n".join(new_lines)
    
    # 7. Add Horizontal Rules before H2
    content = re.sub(r'\n## ', r'\n---\n## ', content)
    
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
                # Skip the one I manually polished
                if lesson['title'] == "ระบบตัวเลขและการแทนข้อมูล":
                    continue
                lesson['content'] = smart_reformat(lesson.get('content', ''))

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Smart reformatting complete.")
