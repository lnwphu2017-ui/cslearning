#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
สคริปต์ v2: แทนที่ย่อหน้าแรกด้วย Year1.txt
- ลบเฉพาะ "ข้อความนำเข้า" (ระหว่าง Keyword กับหัวข้อย่อยแรก)
- แทนที่ด้วย Content สรุปจาก Year1.txt
- คงเนื้อหาหัวข้อย่อย (sub-sections) ทั้งหมดจาก year1addcontent.txt ไว้
"""

import json
import re
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
YEAR1_TXT = os.path.join(BASE_DIR, "Year1.txt")
LESSONS_FILE = os.path.join(BASE_DIR, "frontend", "src", "data", "lessons.json")

COURSE_NAME_MAP = {
    "intro-to-cs": "Introduction to Computer Science",
    "structured-programming": "Structured Programming",
    "discrete-structures": "Discrete Structures",
    "functional-programming": "Functional Programming",
    "oop": "Object Oriented Programming",
    "digital-boolean-algebra": "Digital and Boolean Algebra",
}


def ParseYear1Txt(file_path):
    """Parse Year1.txt: ดึง Content + Keywords ของแต่ละบท"""
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    result = {}
    current_course = None
    current_lesson = None
    
    for line in text.split('\n'):
        stripped = line.strip().rstrip('\r')
        
        if stripped.startswith('Course:'):
            current_course = stripped.replace('Course:', '').strip()
            if current_course not in result:
                result[current_course] = {}
        elif stripped.startswith('Lesson:'):
            current_lesson = stripped.replace('Lesson:', '').strip()
        elif stripped.startswith('Keywords:'):
            keywords = stripped.replace('Keywords:', '').strip()
            if current_course and current_lesson:
                if current_lesson not in result[current_course]:
                    result[current_course][current_lesson] = {}
                result[current_course][current_lesson]['keywords'] = keywords
        elif stripped.startswith('Content:'):
            content = stripped.replace('Content:', '').strip()
            if current_course and current_lesson:
                result[current_course][current_lesson]['content'] = content
    
    return result


def FindSubSectionStart(content_lines):
    """
    หาตำแหน่ง (index) ที่หัวข้อย่อยแรกเริ่มต้น
    หัวข้อย่อยคือบรรทัดที่ขึ้นต้นด้วย:
    - **ข้อความ** (bold heading)
    - ตัวเลข. (เช่น 1. ชื่อหัวข้อ)
    """
    for i, line in enumerate(content_lines):
        stripped = line.strip()
        if not stripped:
            continue
        # ตรวจสอบว่าเป็นหัวข้อย่อยหรือไม่
        if stripped.startswith('**'):
            return i
        # ตัวเลข + จุด + ช่องว่าง + ตัวอักษร (เช่น "1. หัวข้อ")
        if re.match(r'^\d+\.\s+', stripped):
            return i
    
    # ไม่พบหัวข้อย่อย
    return -1


def ReplaceIntroWithYear1(lesson_content, year1_summary, year1_keywords):
    """
    แทนที่ย่อหน้านำเข้า (intro) ด้วย Year1.txt summary
    คงหัวข้อย่อยและเนื้อหาส่วนที่เหลือไว้ทั้งหมด
    
    โครงสร้าง output:
    - # หัวข้อบท
    - > **Keyword**: ... (จาก Year1.txt)
    - [Year1.txt summary] 
    - [sub-sections จาก year1addcontent.txt - คงเดิมทั้งหมด]
    """
    lines = lesson_content.split('\n')
    
    # ดึง heading
    heading = ""
    body_start = 0
    for i, line in enumerate(lines):
        if line.strip().startswith('# '):
            heading = line.strip()
            body_start = i + 1
            break
    
    # ข้าม blank lines หลัง heading
    while body_start < len(lines) and lines[body_start].strip() == '':
        body_start += 1
    
    # ข้าม keyword line
    keyword_end = body_start
    if body_start < len(lines) and lines[body_start].strip().startswith('> **Keyword**'):
        keyword_end = body_start + 1
    
    # ข้าม blank lines หลัง keyword
    while keyword_end < len(lines) and lines[keyword_end].strip() == '':
        keyword_end += 1
    
    # ตอนนี้ keyword_end ชี้ไปที่เนื้อหาหลัก
    # หา sub-section start ในเนื้อหาที่เหลือ
    remaining_lines = lines[keyword_end:]
    sub_section_idx = FindSubSectionStart(remaining_lines)
    
    # สร้าง keyword ใหม่จาก Year1.txt
    new_keyword = f"> **Keyword**: {year1_keywords}"
    
    if sub_section_idx == -1:
        # ไม่มีหัวข้อย่อย - เนื้อหาเป็น "ย่อหน้าเดียว" ทั้งหมด
        # แทนที่ทั้งหมดด้วย Year1.txt summary
        parts = [
            heading,
            '',
            new_keyword,
            '',
            year1_summary
        ]
        return '\n'.join(parts)
    else:
        # มีหัวข้อย่อย - ลบย่อหน้านำเข้า คงหัวข้อย่อยไว้
        # ย้อนกลับจาก sub_section_idx เพื่อรวม blank lines ก่อน sub-section
        sub_lines = remaining_lines[sub_section_idx:]
        sub_section_text = '\n'.join(sub_lines).strip()
        
        parts = [
            heading,
            '',
            new_keyword,
            '',
            year1_summary,
            '',
            sub_section_text
        ]
        return '\n'.join(parts)


def Main():
    """ฟังก์ชันหลัก"""
    print("=" * 60)
    print("v2: แทนที่ย่อหน้านำเข้าด้วย Year1.txt (คงหัวข้อย่อยไว้)")
    print("=" * 60)
    
    # Parse Year1.txt
    year1_data = ParseYear1Txt(YEAR1_TXT)
    
    # อ่าน lessons.json
    with open(LESSONS_FILE, 'r', encoding='utf-8') as f:
        lessons_json = json.load(f)
    
    year1_lessons = lessons_json.get('year1', {})
    update_count = 0
    skip_count = 0
    
    for course_slug, course_name in COURSE_NAME_MAP.items():
        json_lessons = year1_lessons.get(course_slug, [])
        txt_lessons = year1_data.get(course_name, {})
        
        if not json_lessons or not txt_lessons:
            print(f"  [ข้าม] {course_slug}")
            continue
        
        print(f"\n  === {course_slug} ===")
        
        for i, lesson in enumerate(json_lessons):
            lesson_title = lesson.get('title', '')
            old_content = lesson.get('content', '')
            
            # จับคู่ title
            matched_data = None
            for txt_title, txt_data in txt_lessons.items():
                if txt_title == lesson_title or txt_title in lesson_title or lesson_title in txt_title:
                    matched_data = txt_data
                    break
            
            if not matched_data:
                # ลอง match ด้วยหมายเลขบท
                ch_match = re.search(r'บทที่\s*(\d+)', lesson_title)
                if ch_match:
                    ch_key = ch_match.group(0)
                    for txt_title, txt_data in txt_lessons.items():
                        if ch_key in txt_title:
                            matched_data = txt_data
                            break
            
            if not matched_data:
                print(f"    [ข้าม] {lesson_title[:40]} - ไม่พบใน Year1.txt")
                skip_count += 1
                continue
            
            year1_summary = matched_data.get('content', '')
            year1_keywords = matched_data.get('keywords', '')
            
            # แทนที่ย่อหน้านำเข้า
            new_content = ReplaceIntroWithYear1(old_content, year1_summary, year1_keywords)
            
            # ตรวจสอบผลลัพธ์
            old_len = len(old_content)
            new_len = len(new_content)
            has_subsections = FindSubSectionStart(old_content.split('\n')) != -1
            
            lesson['content'] = new_content
            update_count += 1
            
            status = "มีหัวข้อย่อย" if has_subsections else "ย่อหน้าเดียว"
            print(f"    [อัปเดต] บทที่ {i+1}: {lesson_title[:35]}... ({old_len}->{new_len} | {status})")
    
    # บันทึก
    with open(LESSONS_FILE, 'w', encoding='utf-8') as f:
        json.dump(lessons_json, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*60}")
    print(f"อัปเดต: {update_count} | ข้าม: {skip_count}")
    print(f"{'='*60}")


if __name__ == "__main__":
    Main()
