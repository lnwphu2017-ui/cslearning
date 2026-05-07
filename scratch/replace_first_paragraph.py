#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
สคริปต์สำหรับแทนที่ย่อหน้าแรกของทุกบทเรียนปี 1
ด้วยเนื้อหาจากไฟล์ Year1.txt
- ลบย่อหน้าแรก (ระหว่าง Keyword กับหัวข้อย่อยแรก) ออก
- แทนที่ด้วย Content จาก Year1.txt
"""

import json
import re
import os
import sys

# แก้ปัญหา encoding สำหรับ Windows console
sys.stdout.reconfigure(encoding='utf-8')

# กำหนด path ของไฟล์
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
YEAR1_TXT = os.path.join(BASE_DIR, "Year1.txt")
LESSONS_FILE = os.path.join(BASE_DIR, "frontend", "src", "data", "lessons.json")

# แมป slug -> ชื่อ course ใน Year1.txt
COURSE_NAME_MAP = {
    "intro-to-cs": "Introduction to Computer Science",
    "structured-programming": "Structured Programming",
    "discrete-structures": "Discrete Structures",
    "functional-programming": "Functional Programming",
    "oop": "Object Oriented Programming",
    "digital-boolean-algebra": "Digital and Boolean Algebra",
}


def ParseYear1Txt(file_path):
    """
    Parse ไฟล์ Year1.txt เพื่อดึง Content ของแต่ละบทเรียน
    คืนค่า dict: { course_name: { lesson_title: content_text } }
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    lines = text.split('\n')
    lines = [line.rstrip('\r') for line in lines]
    
    result = {}
    current_course = None
    current_lesson = None
    current_content = None
    current_keywords = None
    
    for line in lines:
        stripped = line.strip()
        
        # จับ Course header
        if stripped.startswith('Course:'):
            current_course = stripped.replace('Course:', '').strip()
            if current_course not in result:
                result[current_course] = {}
        
        # จับ Lesson title
        elif stripped.startswith('Lesson:'):
            current_lesson = stripped.replace('Lesson:', '').strip()
        
        # จับ Keywords
        elif stripped.startswith('Keywords:'):
            current_keywords = stripped.replace('Keywords:', '').strip()
        
        # จับ Content
        elif stripped.startswith('Content:'):
            current_content = stripped.replace('Content:', '').strip()
            # บันทึกเข้า result
            if current_course and current_lesson and current_content:
                result[current_course][current_lesson] = {
                    'content': current_content,
                    'keywords': current_keywords
                }
    
    return result


def ReplaceFirstParagraph(lesson_content, new_paragraph):
    """
    แทนที่ย่อหน้าแรก (ข้อความระหว่าง Keyword block กับหัวข้อย่อยแรก)
    ด้วยข้อความใหม่จาก Year1.txt
    
    โครงสร้างเนื้อหาปัจจุบัน:
    - # หัวข้อบท
    - > **Keyword**: ...
    - ย่อหน้าแรก (จะถูกแทนที่)
    - **หัวข้อย่อย 1** (หรือ 1. หัวข้อย่อย)
    - เนื้อหาส่วนที่เหลือ
    """
    # แยกส่วนประกอบ
    lines = lesson_content.split('\n')
    
    heading = ""
    keyword = ""
    first_para_start = -1
    first_para_end = -1
    rest_start = -1
    
    i = 0
    # หา heading
    while i < len(lines):
        if lines[i].strip().startswith('# '):
            heading = lines[i].strip()
            i += 1
            break
        i += 1
    
    # ข้าม blank lines
    while i < len(lines) and lines[i].strip() == '':
        i += 1
    
    # หา keyword
    if i < len(lines) and lines[i].strip().startswith('> **Keyword**'):
        keyword = lines[i].strip()
        i += 1
    
    # ข้าม blank lines
    while i < len(lines) and lines[i].strip() == '':
        i += 1
    
    # ตอนนี้ i ชี้ไปที่ย่อหน้าแรก
    first_para_start = i
    
    # หาจุดสิ้นสุดของย่อหน้าแรก
    # ย่อหน้าแรกจบเมื่อเจอ:
    # - บรรทัดว่างแล้วตามด้วย **หัวข้อ** (bold heading)
    # - บรรทัดว่างแล้วตามด้วยเลข (เช่น 1. หัวข้อ)
    # - หรือจบไฟล์
    
    # เก็บย่อหน้าแรก (อาจเป็นหลายบรรทัดที่ต่อกัน)
    para_lines = []
    while i < len(lines):
        line = lines[i].strip()
        
        # ถ้าเจอบรรทัดว่าง ตรวจสอบว่าบรรทัดถัดไปเป็นหัวข้อย่อยหรือไม่
        if line == '':
            # ดูบรรทัดถัดไป
            next_i = i + 1
            while next_i < len(lines) and lines[next_i].strip() == '':
                next_i += 1
            
            if next_i < len(lines):
                next_line = lines[next_i].strip()
                # ถ้าบรรทัดถัดไปเป็นหัวข้อย่อย (bold หรือเลข)
                if (next_line.startswith('**') or 
                    re.match(r'^\d+\.', next_line) or
                    next_line.startswith('ตัวบ่งปริมาณ') or  # กรณีพิเศษ
                    next_line.startswith('ตรรกศาสตร์') or
                    next_line.startswith('การทำงาน')):
                    # พบจุดสิ้นสุดย่อหน้าแรก
                    first_para_end = i
                    rest_start = i  # เริ่มส่วนที่เหลือจาก blank line
                    break
            
            # ถ้าไม่ใช่หัวข้อย่อย ให้เป็นส่วนหนึ่งของย่อหน้าแรก
            para_lines.append('')
        else:
            para_lines.append(line)
        
        i += 1
    
    # ถ้าไม่พบหัวข้อย่อย (เนื้อหามีแค่ย่อหน้าเดียว)
    if rest_start == -1:
        # แทนที่ทั้งหมดหลัง keyword ด้วย new_paragraph
        parts = [heading, '', keyword, '', new_paragraph]
        return '\n'.join(parts)
    
    # ประกอบกลับ: heading + keyword + ย่อหน้าใหม่ + เนื้อหาที่เหลือ
    rest_lines = lines[rest_start:]
    rest_text = '\n'.join(rest_lines)
    
    parts = [heading, '', keyword, '', new_paragraph, '', rest_text.strip()]
    return '\n'.join(parts)


def Main():
    """ฟังก์ชันหลัก"""
    print("=" * 60)
    print("แทนที่ย่อหน้าแรกด้วยเนื้อหาจาก Year1.txt")
    print("=" * 60)
    
    # ขั้นตอนที่ 1: Parse Year1.txt
    print("\n[ขั้นตอนที่ 1] Parse Year1.txt...")
    year1_data = ParseYear1Txt(YEAR1_TXT)
    
    for course_name, lessons in year1_data.items():
        print(f"  {course_name}: {len(lessons)} บท")
    
    # ขั้นตอนที่ 2: อ่าน lessons.json
    print("\n[ขั้นตอนที่ 2] อ่าน lessons.json...")
    with open(LESSONS_FILE, 'r', encoding='utf-8') as f:
        lessons_json = json.load(f)
    
    year1_lessons = lessons_json.get('year1', {})
    
    # ขั้นตอนที่ 3: แทนที่ย่อหน้าแรก
    print("\n[ขั้นตอนที่ 3] แทนที่ย่อหน้าแรก...")
    update_count = 0
    skip_count = 0
    
    for course_slug, course_name in COURSE_NAME_MAP.items():
        json_lessons = year1_lessons.get(course_slug, [])
        txt_lessons = year1_data.get(course_name, {})
        
        if not json_lessons or not txt_lessons:
            print(f"  [ข้าม] {course_slug}: ไม่พบข้อมูล")
            continue
        
        print(f"\n  === {course_slug} ({len(json_lessons)} บท) ===")
        
        for i, lesson in enumerate(json_lessons):
            lesson_title = lesson.get('title', '')
            old_content = lesson.get('content', '')
            
            # หา content จาก Year1.txt โดยจับคู่ title
            new_paragraph = None
            for txt_title, txt_data in txt_lessons.items():
                # เปรียบเทียบ title - ลอง exact match หรือ partial match
                if txt_title == lesson_title or txt_title in lesson_title or lesson_title in txt_title:
                    new_paragraph = txt_data['content']
                    # อัปเดต keywords ด้วยถ้ามี
                    if txt_data.get('keywords'):
                        new_keywords = txt_data['keywords']
                    break
            
            if not new_paragraph:
                # ลอง match ด้วยหมายเลขบท
                ch_match = re.search(r'บทที่\s*(\d+)', lesson_title)
                if ch_match:
                    ch_num = ch_match.group(0)
                    for txt_title, txt_data in txt_lessons.items():
                        if ch_num in txt_title:
                            new_paragraph = txt_data['content']
                            break
            
            if not new_paragraph:
                print(f"    [ข้าม] บทที่ {i+1}: {lesson_title[:40]} - ไม่พบใน Year1.txt")
                skip_count += 1
                continue
            
            # แทนที่ย่อหน้าแรก
            new_content = ReplaceFirstParagraph(old_content, new_paragraph)
            
            if new_content != old_content:
                lesson['content'] = new_content
                update_count += 1
                print(f"    [อัปเดต] บทที่ {i+1}: {lesson_title[:40]}...")
            else:
                skip_count += 1
                print(f"    [ไม่เปลี่ยน] บทที่ {i+1}: {lesson_title[:40]}...")
    
    # ขั้นตอนที่ 4: บันทึก
    print(f"\n[ขั้นตอนที่ 4] บันทึก lessons.json...")
    with open(LESSONS_FILE, 'w', encoding='utf-8') as f:
        json.dump(lessons_json, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*60}")
    print(f"[สรุปผล]")
    print(f"  อัปเดตแล้ว: {update_count} บท")
    print(f"  ข้าม: {skip_count} บท")
    print(f"{'='*60}")


if __name__ == "__main__":
    Main()
