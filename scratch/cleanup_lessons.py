import json
import re
import os
import sys

# Ensure UTF-8 output for Windows console
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

def clean_content(content):
    # Normalize: Ensure blocks starting with ** are separated by double newlines
    content = re.sub(r'([^\n])\n\*\*', r'\1\n\n**', content)
    
    # Split by double newlines or more
    blocks = [b.strip() for b in re.split(r'\n\s*\n', content) if b.strip()]
    if len(blocks) < 3:
        return content
    
    new_blocks = []
    
    # Identify key blocks
    title_idx = -1
    keyword_idx = -1
    first_heading_idx = -1
    
    for i, b in enumerate(blocks):
        if b.startswith('# '):
            title_idx = i
        elif b.startswith('> **Keyword**'):
            keyword_idx = i
        elif b.startswith('**') and first_heading_idx == -1:
            # First block starting with ** is our first heading
            first_heading_idx = i

    # If we found title and keyword, keep them
    if title_idx != -1:
        new_blocks.append(blocks[title_idx])
    if keyword_idx != -1:
        new_blocks.append(blocks[keyword_idx])
        
    # Find summary paragraphs between keyword and first heading
    start_search = keyword_idx + 1 if keyword_idx != -1 else 0
    # If no heading found, the rest are summaries? No, that would delete content.
    # If no heading found, let's assume the first non-special block is summary.
    end_search = first_heading_idx if first_heading_idx != -1 else len(blocks)
    
    summaries = []
    detailed_from_summaries = []
    for i in range(start_search, end_search):
        b = blocks[i]
        if b and not b.startswith('#') and not b.startswith('>'):
            if not summaries:
                summaries.append(b)
            else:
                # If we already have a summary, any subsequent non-heading block
                # between keyword and first heading might be actual content
                # OR a duplicate summary.
                # Usually, it's a duplicate if it's short or similar.
                # To be safe, if we don't have a first_heading_idx, we should NOT delete.
                if first_heading_idx == -1:
                    detailed_from_summaries.append(b)
                else:
                    # It's between keyword and first heading. 
                    # If there's more than one, the others are likely duplicates.
                    pass
    
    # Keep the FIRST summary
    if summaries:
        new_blocks.append(summaries[0])
    
    # Keep anything else we found if no heading was present
    for b in detailed_from_summaries:
        new_blocks.append(b)

    # Process everything from the first heading onwards
    if first_heading_idx != -1:
        for i in range(first_heading_idx, len(blocks)):
            b = blocks[i]
            
            # Fix bolding for headings
            if b.startswith('**'):
                # If the block contains a newline, the header might be joined with a paragraph
                header_text = b
                paragraph_text = ""
                if '\n' in b:
                    parts = b.split('\n', 1)
                    header_text = parts[0]
                    paragraph_text = parts[1]
                
                if paragraph_text:
                    header_text = header_text.replace('**', '').strip()
                    paragraph_text = paragraph_text.replace('**', '').strip()
                    
                    # Re-apply bolding to header_text ONLY
                    raw = header_text
                    if ')' in raw and raw.find(')') < 200:
                        idx = raw.rfind(')', 0, 300)
                        if idx == -1: idx = raw.rfind(')')
                        head = raw[:idx+1]
                        tail = raw[idx+1:]
                        header_text = f"**{head.strip()}**{tail}"
                    elif ':' in raw and raw.find(':') < 100:
                        idx = raw.find(':')
                        head = raw[:idx]
                        tail = raw[idx:]
                        header_text = f"**{head.strip()}**{tail}"
                    elif len(raw) < 150:
                        header_text = f"**{raw}**"
                    
                    b = header_text + "\n" + paragraph_text
                else:
                    # Original logic for standalone header
                    raw = b.replace('**', '').strip()
                    if ')' in raw and raw.find(')') < 200:
                        idx = raw.rfind(')', 0, 300)
                        if idx == -1: idx = raw.rfind(')')
                        head = raw[:idx+1]
                        tail = raw[idx+1:]
                        b = f"**{head.strip()}**{tail}"
                    elif ':' in raw and raw.find(':') < 100:
                        idx = raw.find(':')
                        head = raw[:idx]
                        tail = raw[idx:]
                        b = f"**{head.strip()}**{tail}"
                    elif len(raw) < 150:
                        b = f"**{raw}**"
                    else:
                        b = raw
            
            new_blocks.append(b)
            
    return "\n\n".join(new_blocks)

def main():
    lessons_path = 'frontend/src/data/lessons.json'
    if not os.path.exists(lessons_path):
        print("File not found.")
        return

    with open(lessons_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    updated_count = 0
    for year in data:
        if year != 'year1': continue
        for slug in data[year]:
            for lesson in data[year][slug]:
                old_content = lesson['content']
                new_content = clean_content(old_content)
                if old_content != new_content:
                    lesson['content'] = new_content
                    updated_count += 1

    with open(lessons_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Cleaned up {updated_count} lessons.")

if __name__ == "__main__":
    main()
