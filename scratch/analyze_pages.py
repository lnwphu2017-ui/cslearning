import json
import re

with open(r'c:\Users\Admin\Desktop\Project7\project1.3\propro1\frontend\src\data\lessons.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

intro = data['year1']['intro-to-cs']
print("=" * 90)
print("PAGINATION ANALYSIS - Introduction to Computer Science")
print("=" * 90)

for i, ch in enumerate(intro):
    content = ch['content']
    length = len(content)
    
    # Simulate the exact frontend pagination logic
    full_content = content.replace('\\n', '\n')
    blocks = [b for b in re.split(r'\n(?=#|## )|\n\n', full_content) if b.strip()]
    
    MAX = 900
    pages = []
    current = ''
    for block in blocks:
        if len(current + block) > MAX and len(current) > 0:
            pages.append(current.strip())
            current = block + '\n\n'
        else:
            current += block + '\n\n'
    if current:
        pages.append(current.strip())
    
    title_short = ch['title'][:35]
    status = "OK" if len(pages) > 1 else "!! SINGLE PAGE !!"
    print(f"Ch {i+1:2d}: {title_short:35s} | chars={length:6d} | blocks={len(blocks):3d} | pages={len(pages):2d} | {status}")

print()
print("Chapters with only 1 page need paragraph breaks (\\n\\n) added to their content.")
