"""
parse_year1_content.py
-----------------------
Script สำหรับ parse เนื้อหาจาก year1editcontent.txt และ update lessons.json
โดยเก็บส่วน Keyword และย่อหน้าแรก (introPart) ไว้เหมือนเดิม
แต่แทนที่เนื้อหา dropdown ด้วยเนื้อหาจากไฟล์ใหม่

รูปแบบไฟล์ year1editcontent.txt:
- หัวข้อกล่อง: บรรทัดที่มี "ชื่อหัวข้อ (English): เนื้อหา..."  → ชื่อก่อน ":" เป็นชื่อกล่อง
- เนื้อหาจบด้วย "/" ที่บรรทัดสุดท้ายของกล่องนั้น
- แต่ละกล่องคั่นด้วยบรรทัดว่าง
"""

import json
import re
import sys
import os

# ---- ตั้งค่า encoding สำหรับ Windows Console ----
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# ---- ตั้งค่า path ----
CONTENT_FILE = os.path.join(os.path.dirname(__file__), '..', '..', 'year1editcontent.txt')
LESSONS_JSON  = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'src', 'data', 'lessons.json')


# =========================================================
# STEP 1: Parse year1editcontent.txt
# =========================================================

def ParseContentFile(file_path: str) -> dict:
    """
    Parse ไฟล์ year1editcontent.txt
    คืนค่าเป็น dict: { course_slug: [ [box, box, ...], [box, box, ...] ] }
    แต่ละ "box" = { "header": str, "body": str }
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        raw = f.read()

    # แบ่งตาม subject header (เช่น "1. Introduction to Computer Science")
    # รูปแบบ: "\n{digit}. {SubjectName}\n"
    subject_pattern = re.compile(r'\n(\d+)\.\s+(.+?)\n', re.MULTILINE)

    # Mapping ลำดับ subject → course slug (ต้องตรงกับ lessons.json)
    SUBJECT_SLUG_MAP = {
        1: 'intro-to-cs',
        2: 'structured-programming',
        3: 'discrete-structures',
        4: 'functional-programming',
        5: 'oop',
        6: 'digital-boolean-algebra',
    }

    # หาตำแหน่งของแต่ละ subject header
    subject_matches = list(subject_pattern.finditer(raw))

    result: dict = {}

    for i, match in enumerate(subject_matches):
        subject_num = int(match.group(1))
        slug = SUBJECT_SLUG_MAP.get(subject_num)
        if not slug:
            print(f"[WARN] Subject {subject_num} ไม่พบใน slug map — ข้าม")
            continue

        # ดึงเนื้อหาของ subject นี้จนถึง subject ถัดไป (หรือจนจบไฟล์)
        start_pos = match.end()
        end_pos = subject_matches[i + 1].start() if i + 1 < len(subject_matches) else len(raw)
        subject_block = raw[start_pos:end_pos]

        # แบ่งแต่ละบทภายใน subject โดยใช้ "บทที่ X " เป็นตัวแบ่ง
        # บรรทัดที่ขึ้นต้นด้วย "บทที่" = หัวของบทใหม่
        chapter_pattern = re.compile(r'(?:^|\n)(บทที่\s+\d+[^\n]*)\n', re.MULTILINE)
        chapter_matches = list(chapter_pattern.finditer(subject_block))

        chapters_boxes: list = []  # list of list of boxes (แต่ละบท)

        for j, ch_match in enumerate(chapter_matches):
            ch_start = ch_match.end()
            ch_end = chapter_matches[j + 1].start() if j + 1 < len(chapter_matches) else len(subject_block)
            chapter_block = subject_block[ch_start:ch_end]

            # Parse boxes ภายในบทนี้
            boxes = ParseBoxesFromBlock(chapter_block)
            chapters_boxes.append(boxes)

        result[slug] = chapters_boxes
        print(f"[OK] Subject {subject_num} ({slug}): พบ {len(chapters_boxes)} บท")

    return result


def ParseBoxesFromBlock(block: str) -> list:
    """
    Parse กล่อง dropdown จากเนื้อหาของบทหนึ่ง
    
    รูปแบบกล่อง:
    - บรรทัดแรก: "หัวข้อ (English): เนื้อหาบรรทัดแรก..."
    - บรรทัดถัดไป: เนื้อหาเพิ่มเติม
    - บรรทัดสุดท้าย: ลงท้ายด้วย "/"
    - กล่องแต่ละกล่องคั่นด้วยบรรทัดว่าง
    
    คืนค่า: list of { "header": str, "body": str }
    """
    boxes = []
    lines = block.split('\n')

    # รวมบรรทัดที่เป็น group เดียวกัน (คั่นด้วยบรรทัดว่าง)
    current_group: list = []
    groups: list = []

    for line in lines:
        stripped = line.rstrip('\r')
        if stripped.strip() == '':
            # บรรทัดว่าง → จบ group ปัจจุบัน
            if current_group:
                groups.append(current_group)
                current_group = []
        else:
            current_group.append(stripped)

    # เพิ่ม group สุดท้าย
    if current_group:
        groups.append(current_group)

    # Parse แต่ละ group เป็น box
    for group in groups:
        if not group:
            continue

        # บรรทัดแรกของ group = title line
        title_line = group[0]

        # หาว่ามี ":" ในบรรทัดแรกหรือไม่
        colon_idx = title_line.find(':')
        if colon_idx == -1:
            # ไม่มี ":" → ไม่ใช่ box header ที่ถูกต้อง เพิ่มเข้า body ของ box ก่อนหน้า
            if boxes:
                boxes[-1]['body'] += '\n' + '\n'.join(group)
            continue

        # หัวข้อ = ทุกอย่างก่อน ":"
        header_raw = title_line[:colon_idx].strip()

        # เนื้อหาหลัง ":" ในบรรทัดแรก
        after_colon = title_line[colon_idx + 1:].strip()

        # รวมบรรทัดที่เหลือของ group
        remaining_lines = group[1:]

        # ลบเครื่องหมาย "/" ออกจากบรรทัดสุดท้าย
        all_body_lines = []
        if after_colon:
            all_body_lines.append(after_colon)
        all_body_lines.extend(remaining_lines)

        # ลบ "/" ออกจากบรรทัดสุดท้าย
        if all_body_lines:
            last_line = all_body_lines[-1]
            if last_line.rstrip().endswith('/'):
                all_body_lines[-1] = last_line.rstrip()[:-1].rstrip()

        # ลบบรรทัดว่างต้นและท้าย
        while all_body_lines and not all_body_lines[0].strip():
            all_body_lines.pop(0)
        while all_body_lines and not all_body_lines[-1].strip():
            all_body_lines.pop()

        body_text = '\n'.join(all_body_lines)

        if header_raw:
            boxes.append({
                'header': header_raw,
                'body': body_text,
            })

    return boxes


# =========================================================
# STEP 2: สร้าง Markdown content สำหรับแต่ละ lesson
# =========================================================

def BuildDropdownMarkdown(boxes: list) -> str:
    """
    สร้าง markdown สำหรับ dropdown boxes
    format: **header** (ตรงกับ page.tsx parser ที่ใช้ split /\n(?=\*\*)/
    """
    parts = []
    for box in boxes:
        header = box['header']
        body = box['body']
        # format ที่ page.tsx จะ parse ได้:
        # **ชื่อหัวข้อ (English)**\nเนื้อหา...
        parts.append(f"**{header}**\n{body}")
    return '\n\n'.join(parts)


def ExtractIntroPart(existing_content: str) -> str:
    """
    ดึงเฉพาะส่วน heading + Keyword blockquote + ย่อหน้าแรก จาก content เดิม
    โดยหยุดที่ separator '---' ตัวแรก เพื่อไม่ให้เนื้อหา dropdown เดิมติดมา
    """
    # ตัดที่ "---" separator ตัวแรก
    separator_idx = existing_content.find('\n---\n')
    if separator_idx != -1:
        # เอาเฉพาะส่วนก่อน separator แรก
        before_separator = existing_content[:separator_idx].strip()
        return before_separator

    # ถ้าไม่มี separator → หา **header** ตัวแรกที่ไม่ใช่ Keyword
    parts = re.split(r'\n(?=\*\*(?!Keyword|บทที่|Lesson))', existing_content)

    if len(parts) <= 1:
        return existing_content.strip()

    # หาส่วน intro (ก่อน dropdown แรก)
    intro_parts = []
    for part in parts:
        stripped = part.strip()
        if (stripped.startswith('**') and
            not stripped.startswith('**Keyword') and
            not stripped.startswith('**บทที่') and
            not stripped.startswith('**Lesson')):
            break
        intro_parts.append(part)

    return '\n\n'.join(p.strip() for p in intro_parts if p.strip())


# =========================================================
# STEP 3: Update lessons.json
# =========================================================

def UpdateLessonsJson(parsed_content: dict, json_path: str):
    """อัปเดต lessons.json ด้วยเนื้อหาใหม่จาก parsed_content"""
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    year1_data = data.get('year1', {})
    updated_count = 0

    for slug, chapters_boxes in parsed_content.items():
        if slug not in year1_data:
            print(f"[WARN] Slug '{slug}' ไม่พบใน lessons.json — ข้าม")
            continue

        lessons_list = year1_data[slug]

        for chapter_idx, boxes in enumerate(chapters_boxes):
            # ตรวจสอบว่า chapter นี้มีใน lessons_list หรือไม่
            if chapter_idx >= len(lessons_list):
                print(f"[WARN] {slug} บทที่ {chapter_idx+1} ไม่มีใน lessons.json — ข้าม")
                continue

            if not boxes:
                print(f"[INFO] {slug} บทที่ {chapter_idx+1} ไม่มี box ใดๆ — ข้าม")
                continue

            # ดึง intro part จาก content เดิม
            existing_content = lessons_list[chapter_idx].get('content', '')
            intro_part = ExtractIntroPart(existing_content)

            # สร้าง dropdown markdown ใหม่จากไฟล์
            dropdown_md = BuildDropdownMarkdown(boxes)

            # รวม intro + separator + dropdown
            new_content = intro_part + '\n\n---\n\n' + dropdown_md

            # อัปเดต
            lessons_list[chapter_idx]['content'] = new_content
            updated_count += 1

            print(f"  [OK] {slug} บทที่ {chapter_idx+1}: อัปเดตแล้ว ({len(boxes)} กล่อง)")

        year1_data[slug] = lessons_list

    data['year1'] = year1_data

    # บันทึกกลับ
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n✅ อัปเดตสำเร็จ {updated_count} บท → {json_path}")


# =========================================================
# Main
# =========================================================
if __name__ == '__main__':
    print("=== Parse year1editcontent.txt ===")
    content_path = os.path.abspath(CONTENT_FILE)
    json_path = os.path.abspath(LESSONS_JSON)

    print(f"Content file: {content_path}")
    print(f"JSON file:    {json_path}")

    if not os.path.exists(content_path):
        print(f"[ERROR] ไม่พบไฟล์: {content_path}")
        sys.exit(1)

    if not os.path.exists(json_path):
        print(f"[ERROR] ไม่พบไฟล์: {json_path}")
        sys.exit(1)

    # Parse เนื้อหา
    parsed = ParseContentFile(content_path)

    # แสดงตัวอย่าง
    for slug, chapters in parsed.items():
        print(f"\n--- {slug}: {len(chapters)} บท ---")
        for i, boxes in enumerate(chapters):
            print(f"  บทที่ {i+1}: {len(boxes)} กล่อง")
            for box in boxes[:2]:  # แสดงแค่ 2 กล่องแรก
                print(f"    • [{box['header'][:40]}...]")

    # ยืนยันก่อน update
    confirm = input("\n⚡ ยืนยันการอัปเดต lessons.json? (y/n): ").strip().lower()
    if confirm != 'y':
        print("ยกเลิก")
        sys.exit(0)

    # Update JSON
    UpdateLessonsJson(parsed, json_path)
