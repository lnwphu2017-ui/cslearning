import json
import re

def clean_and_format(content):
    if not content: return content
    
    # 1. Basic cleaning
    content = content.replace('\\n', '\n')
    
    # 2. Remove double/triple horizontal rules
    content = re.sub(r'\n-+\n-+', '\n---', content)
    content = re.sub(r'(-{3,}\n)+-{3,}', '---', content)
    
    # 3. Remove empty headers like "## ##" or "##  ##"
    content = re.sub(r'^##\s*#*\s*$', '', content, flags=re.MULTILINE)
    content = re.sub(r'^##\s*️?\s*##\s*$', '', content, flags=re.MULTILINE)
    
    # 4. Fix missing newlines before section numbers
    content = re.sub(r'([^\n])(\d+\.\s+[ก-๙a-zA-Z])', r'\1\n\n## \2', content)
    
    # 5. Ensure sections have H2
    content = re.sub(r'^(\d+\.\s+.*)$', r'## \1', content, flags=re.MULTILINE)
    
    # 6. Remove ANY remaining emojis
    content = re.sub(r'[📜🏗️🗣️🛡️🌐📊🔢⚡📝💡📖✅❌⚠️❗❓🎯🚩]', '', content)

    # 7. Format sub-headers
    content = re.sub(r'^(ขั้นตอนที่\s*\d+:)', r'### \1', content, flags=re.MULTILINE)

    # 8. Normalize spacing
    lines = [line.strip() for line in content.split('\n')]
    new_lines = []
    for line in lines:
        if not line:
            if new_lines and new_lines[-1] != "":
                new_lines.append("")
            continue
        new_lines.append(line)
        if line.startswith('#'):
            new_lines.append("")
            
    content = "\n".join(new_lines)
    
    # 9. Clean up again
    content = re.sub(r'\n{3,}', '\n\n', content)
    content = re.sub(r'\n---', r'\n\n---\n', content)
    
    return content.strip()

file_path = r'c:/Users/kil/Desktop/New folder (2)/Product/frontend/src/data/lessons.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for year in data:
    if isinstance(data[year], dict):
        for course in data[year]:
            for lesson in data[year][course]:
                lesson['content'] = clean_and_format(lesson.get('content', ''))

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Final cleanup and formatting complete (No emojis, no empty headers).")
