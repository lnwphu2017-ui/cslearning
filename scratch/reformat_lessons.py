import json
import re
import os

def reformat_content(content, title):
    if not content:
        return content
    
    # Replace escaped newlines if any
    content = content.replace("\\n", "\n")
    
    # 1. Add Chapter Title as H1 if not present (but we'll let the UI handle H1)
    # Actually, let's keep it as is and just fix internal structure.
    
    # 2. Convert "1. Title", "2. Title" to "## 1. Title"
    content = re.sub(r'^(\d+\.\s+.*)$', r'## \1', content, flags=re.MULTILINE)
    
    # 3. Bold technical terms in parentheses: (Term) -> (**Term**)
    # Only if it's long-ish and looks like a term
    # content = re.sub(r'\(([^)]+)\)', r'(**\1**)', content) 
    # Be careful with math formulas
    
    # 4. Handle math formulas (ensure they are on their own line if $$ used)
    # The existing content uses $...$ for inline and $$...$$ for block.
    
    # 5. Add Horizontal Rule before major sections (H2)
    content = re.sub(r'^## ', r'---\n## ', content, flags=re.MULTILINE)
    
    # 6. Ensure double newlines between paragraphs
    paragraphs = content.split('\n')
    new_paragraphs = []
    for p in paragraphs:
        p = p.strip()
        if p:
            new_paragraphs.append(p)
    content = "\n\n".join(new_paragraphs)
    
    # 7. Clean up multiple horizontal rules
    content = re.sub(r'(---\n)+---', r'---', content)
    
    # 8. Fix some common issues (e.g. "ตัวอย่างเช่น :" -> "### ตัวอย่างเช่น")
    content = re.sub(r'ตัวอย่างเช่น\s*:', r'#### 💡 ตัวอย่างเช่น', content)
    content = re.sub(r'ข้อควรระวัง\s*:', r'> [!WARNING]\n> **ข้อควรระวัง**:', content)
    
    return content

file_path = r'c:/Users/kil/Desktop/New folder (2)/Product/frontend/src/data/lessons.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for year in data:
    if isinstance(data[year], dict):
        for course in data[year]:
            lessons = data[year][course]
            for lesson in lessons:
                lesson['content'] = reformat_content(lesson.get('content', ''), lesson.get('title', ''))

# Save backup before overwriting
with open(file_path + '.bak', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Reformatting complete. Backup created at lessons.json.bak")
