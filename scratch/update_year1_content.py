#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
สคริปต์สำหรับอัปเดตเนื้อหาปี 1 ใน lessons.json
โดย parse จากไฟล์ year1addcontent.txt แล้วแทนที่เนื้อหาเดิมที่สั้นเกินไป
"""

import json
import re
import os
import sys
import copy

# แก้ปัญหา encoding สำหรับ Windows console
sys.stdout.reconfigure(encoding='utf-8')

# กำหนด path ของไฟล์
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TXT_FILE = os.path.join(BASE_DIR, "year1addcontent.txt")
LESSONS_FILE = os.path.join(BASE_DIR, "frontend", "src", "data", "lessons.json")
BACKUP_FILE = LESSONS_FILE + ".bak2"

# แมปชื่อวิชาในไฟล์ txt -> slug ใน lessons.json
COURSE_HEADERS = {
    "1. Introduction to Computer Science": "intro-to-cs",
    "2. Structured Programming": "structured-programming",
    "3. Discrete Structures": "discrete-structures",
    "4. Functional Programming": "functional-programming",
    "5. Object Oriented Programming": "oop",
    "6. Digital and Boolean Algebra": "digital-boolean-algebra",
}

# Regex สำหรับจับ pattern หัวข้อบท
CHAPTER_PATTERN = re.compile(r'^บทที่\s*(\d+)\s*:\s*(.+?)(?:\s*\(.*?\))?\s*$')
# Pattern สำหรับบทที่อยู่บรรทัดเดียวกับเนื้อหา (ไม่มี newline หลังชื่อบท)
CHAPTER_INLINE_PATTERN = re.compile(r'^(บทที่\s*\d+\s*:\s*.+?(?:\(.*?\)))\s*(.+)$')


def ReadTextFile(file_path):
    """อ่านไฟล์ text และคืนค่าเป็น list ของบรรทัด"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    return content


def ParseCourseChapters(text_content):
    """
    Parse เนื้อหาจากไฟล์ txt แยกตามวิชาและบทเรียน
    คืนค่า dict: { course_slug: [ { title, content }, ... ] }
    """
    lines = text_content.split('\n')
    # ลบ \r ออก
    lines = [line.rstrip('\r') for line in lines]
    
    result = {}
    current_course_slug = None
    current_chapter_title = None
    current_chapter_content_lines = []
    current_chapter_number = None
    
    def SaveCurrentChapter():
        """บันทึกบทเรียนปัจจุบันเข้า result"""
        nonlocal current_chapter_title, current_chapter_content_lines, current_course_slug
        if current_course_slug and current_chapter_title:
            # รวมเนื้อหาของบท
            content_text = '\n'.join(current_chapter_content_lines).strip()
            if current_course_slug not in result:
                result[current_course_slug] = []
            result[current_course_slug].append({
                'title': current_chapter_title.strip(),
                'content': content_text
            })
            current_chapter_title = None
            current_chapter_content_lines = []
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # ตรวจสอบว่าเป็นหัวข้อวิชาหรือไม่
        is_course_header = False
        for header, slug in COURSE_HEADERS.items():
            if line == header:
                # บันทึกบทก่อนหน้า
                SaveCurrentChapter()
                current_course_slug = slug
                is_course_header = True
                break
        
        if is_course_header:
            i += 1
            continue
        
        # ตรวจสอบว่าเป็นหัวข้อบทหรือไม่
        if line.startswith('บทที่') or line.startswith('ทที่'):
            # แก้ปัญหาบาง line ที่ขึ้นต้นด้วย "ทที่" (typo ในไฟล์ต้นฉบับ)
            fixed_line = line
            if line.startswith('ทที่'):
                fixed_line = 'บ' + line
            
            # ตรวจสอบว่าหัวข้อบทอยู่บรรทัดเดียวกับเนื้อหาหรือไม่
            # Pattern: "บทที่ X: ชื่อบท (English Title)เนื้อหาต่อเลย..."
            # หาว่า title จบตรงไหน - จบที่ ) แล้วตามด้วยเนื้อหาต่อ
            
            # ลองจับ pattern แบบมีวงเล็บปิด
            paren_match = re.match(r'^(บทที่\s*\d+\s*:\s*[^(]+\([^)]+\))\s*(.+)', fixed_line)
            if not paren_match:
                # ลองจับ pattern แบบไม่มีวงเล็บ - หัวข้อบทอยู่คนเดียว
                chapter_match = re.match(r'^บทที่\s*(\d+)\s*:\s*(.+)', fixed_line)
                if chapter_match:
                    SaveCurrentChapter()
                    ch_num = chapter_match.group(1)
                    ch_name = chapter_match.group(2).strip()
                    current_chapter_title = f"บทที่ {ch_num}: {ch_name}"
                    current_chapter_content_lines = []
                    current_chapter_number = int(ch_num)
            else:
                # มีเนื้อหาต่อจากหัวข้อบทในบรรทัดเดียวกัน
                SaveCurrentChapter()
                title_part = paren_match.group(1).strip()
                inline_content = paren_match.group(2).strip()
                
                chapter_match = re.match(r'^บทที่\s*(\d+)\s*:\s*(.+)', title_part)
                if chapter_match:
                    ch_num = chapter_match.group(1)
                    ch_name = chapter_match.group(2).strip()
                    current_chapter_title = f"บทที่ {ch_num}: {ch_name}"
                    current_chapter_content_lines = [inline_content]
                    current_chapter_number = int(ch_num)
            
            i += 1
            continue
        
        # ถ้ามีบทเรียนปัจจุบันอยู่ ให้เพิ่มบรรทัดเข้าไป
        if current_chapter_title:
            current_chapter_content_lines.append(lines[i].rstrip('\r'))
        
        i += 1
    
    # บันทึกบทสุดท้าย
    SaveCurrentChapter()
    
    return result


def FormatLessonContent(title, raw_content, existing_content):
    """
    จัดรูปแบบเนื้อหาบทเรียนให้ตรงกับ format ที่ใช้ใน lessons.json
    - เพิ่ม heading (#)
    - เพิ่ม keyword block ถ้ามีอยู่แล้ว
    - จัดรูปแบบเนื้อหาเป็น markdown
    """
    # ดึง keyword จากเนื้อหาเดิม (ถ้ามี)
    keyword_line = ""
    if existing_content:
        keyword_match = re.search(r'>\s*\*\*Keyword\*\*:\s*(.+?)(?:\n|$)', existing_content)
        if keyword_match:
            keyword_line = f"> **Keyword**: {keyword_match.group(1).strip()}"
    
    # สร้างเนื้อหา markdown
    formatted_parts = [f"# {title}"]
    
    if keyword_line:
        formatted_parts.append(keyword_line)
    
    # จัดรูปแบบเนื้อหาหลัก
    if raw_content:
        # แยกเนื้อหาเป็นย่อหน้า
        paragraphs = raw_content.split('\n')
        clean_paragraphs = []
        
        for para in paragraphs:
            para = para.strip()
            if para:
                clean_paragraphs.append(para)
            else:
                clean_paragraphs.append('')
        
        content_text = '\n'.join(clean_paragraphs)
        formatted_parts.append(content_text)
    
    return '\n'.join(formatted_parts)


def UpdateLessonsJson(parsed_courses):
    """
    อัปเดตไฟล์ lessons.json ด้วยเนื้อหาใหม่จาก parsed_courses
    """
    # อ่าน lessons.json ปัจจุบัน
    with open(LESSONS_FILE, 'r', encoding='utf-8') as f:
        lessons_data = json.load(f)
    
    # สำรองข้อมูลก่อนแก้ไข
    with open(BACKUP_FILE, 'w', encoding='utf-8') as f:
        json.dump(lessons_data, f, ensure_ascii=False, indent=2)
    print(f"[สำรองข้อมูล] สร้างไฟล์สำรองที่: {BACKUP_FILE}")
    
    year1_data = lessons_data.get('year1', {})
    
    update_count = 0
    skip_count = 0
    
    for course_slug, chapters in parsed_courses.items():
        existing_lessons = year1_data.get(course_slug, [])
        
        if not existing_lessons:
            print(f"[คำเตือน] ไม่พบวิชา '{course_slug}' ใน lessons.json")
            continue
        
        print(f"\n{'='*60}")
        print(f"วิชา: {course_slug} ({len(chapters)} บทจาก txt, {len(existing_lessons)} บทใน json)")
        print(f"{'='*60}")
        
        for new_chapter in chapters:
            new_title = new_chapter['title']
            new_content = new_chapter['content']
            
            # หา chapter number จาก title
            ch_num_match = re.search(r'บทที่\s*(\d+)', new_title)
            if not ch_num_match:
                print(f"  [ข้าม] ไม่สามารถระบุหมายเลขบทได้: {new_title[:50]}")
                skip_count += 1
                continue
            
            ch_num = int(ch_num_match.group(1))
            ch_index = ch_num - 1  # 0-based index
            
            if ch_index >= len(existing_lessons):
                print(f"  [ข้าม] บทที่ {ch_num} เกินจำนวนบทใน json ({len(existing_lessons)} บท)")
                skip_count += 1
                continue
            
            existing_lesson = existing_lessons[ch_index]
            existing_title = existing_lesson.get('title', '')
            existing_content = existing_lesson.get('content', '')
            existing_content_len = len(existing_content)
            
            # จัดรูปแบบเนื้อหาใหม่
            formatted_content = FormatLessonContent(
                existing_title,  # ใช้ title เดิมจาก json เพื่อความ consistent
                new_content,
                existing_content
            )
            
            new_content_len = len(formatted_content)
            
            # อัปเดตถ้าเนื้อหาใหม่ยาวกว่าเดิม
            if new_content_len > existing_content_len:
                existing_lessons[ch_index]['content'] = formatted_content
                update_count += 1
                print(f"  [อัปเดต] บทที่ {ch_num}: {existing_title[:40]}... ({existing_content_len} -> {new_content_len} bytes)")
            else:
                skip_count += 1
                print(f"  [คงเดิม] บทที่ {ch_num}: {existing_title[:40]}... (เนื้อหาเดิมยาวกว่า: {existing_content_len} vs {new_content_len})")
    
    # บันทึกกลับ
    with open(LESSONS_FILE, 'w', encoding='utf-8') as f:
        json.dump(lessons_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*60}")
    print(f"[สรุปผล]")
    print(f"  อัปเดตแล้ว: {update_count} บท")
    print(f"  ข้าม/คงเดิม: {skip_count} บท")
    print(f"  บันทึกที่: {LESSONS_FILE}")
    print(f"{'='*60}")
    
    return update_count


def Main():
    """ฟังก์ชันหลักสำหรับรันสคริปต์"""
    print("=" * 60)
    print("สคริปต์อัปเดตเนื้อหาปี 1 จาก year1addcontent.txt")
    print("=" * 60)
    
    # ตรวจสอบไฟล์ที่จำเป็น
    if not os.path.exists(TXT_FILE):
        print(f"[ข้อผิดพลาด] ไม่พบไฟล์: {TXT_FILE}")
        return
    
    if not os.path.exists(LESSONS_FILE):
        print(f"[ข้อผิดพลาด] ไม่พบไฟล์: {LESSONS_FILE}")
        return
    
    # ขั้นตอนที่ 1: อ่านไฟล์ txt
    print("\n[ขั้นตอนที่ 1] อ่านไฟล์ year1addcontent.txt...")
    text_content = ReadTextFile(TXT_FILE)
    print(f"  อ่านได้ {len(text_content)} ตัวอักษร")
    
    # ขั้นตอนที่ 2: Parse เนื้อหาแยกตามวิชาและบท
    print("\n[ขั้นตอนที่ 2] Parse เนื้อหาแยกตามวิชาและบท...")
    parsed_courses = ParseCourseChapters(text_content)
    
    for slug, chapters in parsed_courses.items():
        print(f"  {slug}: {len(chapters)} บท")
        for ch in chapters:
            content_len = len(ch['content'])
            print(f"    - {ch['title'][:50]}... ({content_len} chars)")
    
    # ขั้นตอนที่ 3: อัปเดต lessons.json
    print("\n[ขั้นตอนที่ 3] อัปเดต lessons.json...")
    updated = UpdateLessonsJson(parsed_courses)
    
    if updated > 0:
        print(f"\n[สำเร็จ] อัปเดตเนื้อหา {updated} บทเรียนเรียบร้อยแล้ว!")
    else:
        print("\n[แจ้งเตือน] ไม่มีบทเรียนใดถูกอัปเดต")


if __name__ == "__main__":
    Main()
