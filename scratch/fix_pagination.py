import json
import re

LESSONS_PATH = r'c:\Users\Admin\Desktop\Project7\project1.3\propro1\frontend\src\data\lessons.json'

with open(LESSONS_PATH, 'r', encoding='utf-8') as f:
    data = json.load(f)

intro = data['year1']['intro-to-cs']

def fix_content(content_str):
    """
    Add proper paragraph breaks (\n\n) to content that is stored as a single block.
    The frontend splits on \n\n and \n followed by # to create pagination blocks.
    
    Strategy:
    1. Replace literal \\n with actual newlines first for processing
    2. Add double newlines before numbered sections (e.g. "1. Title", "2. Title")
    3. Add double newlines before key topic transitions
    4. Re-encode back to the JSON-friendly format
    """
    text = content_str
    
    # Check if already has enough paragraph breaks
    if text.count('\n\n') >= 5:
        return text  # Already formatted properly
    
    # Pattern 1: Add break before numbered section headers like "1. Title" or "2. Title"
    # These patterns match lines starting with a number followed by a period and a space
    text = re.sub(
        r'(?<!\n\n)(?<!\A)(\d+\.\s+(?:[ก-๙A-Z\u0E00-\u0E7F]))',
        r'\n\n\1',
        text
    )
    
    # Pattern 2: Add break before Thai section keywords that signal new topics
    section_keywords = [
        r'การก่อร่างสร้าง',
        r'สุนทรียภาพแห่ง',
        r'การจับจังหวะ',
        r'จิตวิทยาเสียง',
        r'ปัญหาคอขวด',
        r'ความชาญฉลาด',
        r'ยุคเริ่มต้น',
        r'สถาปัตยกรรมระดับโลก',
        r'ความลวงตา',
        r'การขยายขีดจำกัด',
        r'สถาปัตยกรรมหน่วยความจำ',
        r'ช่องโหว่ทางเทคนิค',
        r'ช่องโหว่ทางจิตวิทยา',
        r'รูปแบบการโจมตี',
        r'อคติของอัลกอริทึม',
        r'วิศวกรรมทางศีลธรรม',
        r'แนวคิดดั้งเดิม',
        r'กฎหมายไม่ได้เป็น',
        r'กระบวนทัศน์แห่ง',
        r'กลไกสถาปัตยกรรม',
        r'การก้าวกระโดด',
        r'จุดบรรจบ',
        r'โครงสร้างสถาปัตยกรรม',
        r'นวัตกรรมที่แท้จริง',
        r'ความเข้าใจผิด',
    ]
    
    for kw in section_keywords:
        text = re.sub(
            rf'(?<!\n\n)({kw})',
            rf'\n\n\1',
            text
        )
    
    # Pattern 3: Add break before English topic headers in the text
    english_headers = [
        r'Confidentiality',
        r'Integrity \(ความถูกต้อง',
        r'Availability \(ความพร้อม',
        r'Perimeter Defense',
        r'Access Control',
        r'Principle of Least',
        r'Data Minimization',
        r'The Right to be Forgotten',
        r'Immutable Ledgers',
        r'Authorization vs\.',
        r'ภาระหน้าที่',
        r'ความรับผิดทาง',
        r'Lossless Compression',
        r'Lossy Compression',
        r'การสุ่มตัวอย่าง',
        r'การแบ่งระดับ',
        r'User Space',
        r'Kernel Space',
        r'Decomposition',
        r'Pattern Recognition',
        r'Abstraction \(การคิด',
        r'Algorithm Design',
        r'Sequence \(การทำงาน',
        r'Selection',
        r'Iteration',
    ]
    
    for hdr in english_headers:
        text = re.sub(
            rf'(?<!\n\n)({hdr})',
            rf'\n\n\1',
            text
        )
    
    # Pattern 4: Generic - add break before any line that starts with a bold Thai section
    # like "การ..." after at least 200 chars of content
    # This is a fallback for content that doesn't match specific patterns
    
    # Clean up: remove triple+ newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text


def count_pages(content):
    """Simulate the exact frontend pagination logic"""
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
    return len(pages), len(blocks)


# Process each chapter
print("=" * 90)
print("FIXING PAGINATION - Introduction to Computer Science")
print("=" * 90)

for i, ch in enumerate(intro):
    pages_before, blocks_before = count_pages(ch['content'])
    
    if pages_before <= 1 and len(ch['content']) > 1000:
        # This chapter needs fixing
        fixed = fix_content(ch['content'])
        intro[i]['content'] = fixed
        pages_after, blocks_after = count_pages(fixed)
        print(f"Ch {i+1:2d}: FIXED  | blocks: {blocks_before} -> {blocks_after} | pages: {pages_before} -> {pages_after}")
    else:
        print(f"Ch {i+1:2d}: OK     | blocks: {blocks_before} | pages: {pages_before}")

# Save
with open(LESSONS_PATH, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print()
print("=" * 90)
print("VERIFICATION AFTER FIX")
print("=" * 90)

# Reload and verify
with open(LESSONS_PATH, 'r', encoding='utf-8') as f:
    data2 = json.load(f)

intro2 = data2['year1']['intro-to-cs']
all_ok = True
for i, ch in enumerate(intro2):
    pages, blocks = count_pages(ch['content'])
    status = "OK" if pages > 1 else "!! STILL SINGLE PAGE !!"
    if pages <= 1:
        all_ok = False
    print(f"Ch {i+1:2d}: pages={pages:2d} | blocks={blocks:3d} | {status}")

if all_ok:
    print("\nAll chapters now have proper pagination!")
else:
    print("\nSome chapters still need manual attention.")
