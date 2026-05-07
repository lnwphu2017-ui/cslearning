#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
สคริปต์สำหรับจัดรูปแบบเนื้อหาปี 1 ใน lessons.json
- แยกย่อหน้าที่ติดกัน (ข้อความยาวๆ ที่ไม่มี line break)
- เพิ่ม bold ให้หัวข้อย่อย  
- ให้มี paragraph break ระหว่าง keyword block กับเนื้อหา
"""

import json
import re
import os
import sys

# แก้ปัญหา encoding สำหรับ Windows console
sys.stdout.reconfigure(encoding='utf-8')

LESSONS_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "frontend", "src", "data", "lessons.json"
)


def FormatContent(content):
    """
    จัดรูปแบบเนื้อหาให้มี paragraph breaks ที่เหมาะสม
    - แยก heading (#) และ keyword (>) ออกมาชัดเจน
    - เพิ่ม newline ก่อนหัวข้อย่อยที่ขึ้นต้นด้วยตัวเลข
    - เพิ่ม newline ก่อนหัวข้อที่เป็นภาษาอังกฤษ+ไทย (เช่น "1. ชื่อหัวข้อ")
    """
    # ขั้นตอนที่ 1: แยก heading, keyword, และเนื้อหาหลัก
    lines = content.split('\n')
    
    heading = ""
    keyword = ""
    body_lines = []
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith('# ') and not heading:
            heading = stripped
        elif stripped.startswith('> **Keyword**') and not keyword:
            keyword = stripped
        else:
            body_lines.append(line)
    
    # รวมเนื้อหาหลักเป็นข้อความเดียว
    body = '\n'.join(body_lines).strip()
    
    # ขั้นตอนที่ 2: แยกย่อหน้าจากข้อความที่ติดกัน
    # Pattern ที่ต้องการ line break ก่อนหน้า:
    
    # 2a: หัวข้อย่อยที่ขึ้นต้นด้วยตัวเลข เช่น "1. ชื่อหัวข้อ", "2. ชื่อ"
    body = re.sub(r'([^\n])(\d+\.\s+[ก-๙A-Z])', r'\1\n\n\2', body)
    
    # 2b: หัวข้อย่อยแบบตัวอักษร เช่น "A. Asynchronous", "B. Synchronous"
    body = re.sub(r'([^\n])([A-Z]\.\s+[A-Z][a-z])', r'\1\n\n\2', body)
    
    # 2c: หัวข้อที่มีเครื่องหมาย ** (bold)
    body = re.sub(r'([^\n])\*\*([^*]+)\*\*', r'\1\n\n**\2**', body)
    
    # ขั้นตอนที่ 3: เพิ่ม bold ให้หัวข้อย่อยที่ขึ้นด้วยเลขแล้วตามด้วยคำอธิบาย
    # Pattern: "1. ชื่อหัวข้อ (English):" -> "**1. ชื่อหัวข้อ (English):**"
    # Pattern: "1. ชื่อหัวข้อ" -> "**1. ชื่อหัวข้อ**"
    
    def BoldSubHeading(match):
        """เพิ่ม bold ให้หัวข้อย่อย"""
        prefix = match.group(1)  # newlines before
        number = match.group(2)  # ตัวเลข + จุด
        title = match.group(3)   # ชื่อหัวข้อ
        
        # ถ้ามี colon ใน title ให้ bold ถึง colon
        if ':' in title:
            colon_idx = title.index(':')
            bold_part = title[:colon_idx + 1]
            rest = title[colon_idx + 1:]
            return f"{prefix}**{number}{bold_part}**{rest}"
        # ถ้ามีวงเล็บปิด ให้ bold ถึงวงเล็บ
        elif ')' in title:
            paren_idx = title.index(')')
            # ตรวจสอบว่าหลังวงเล็บมีเนื้อหาต่อหรือไม่
            bold_part = title[:paren_idx + 1]
            rest = title[paren_idx + 1:]
            if rest.strip():
                return f"{prefix}**{number}{bold_part}**\n{rest.strip()}"
            return f"{prefix}**{number}{bold_part}**"
        else:
            # ถ้าสั้นพอ ให้ bold ทั้งหมด
            if len(title) < 100:
                return f"{prefix}**{number}{title}**"
            return f"{prefix}{number}{title}"
    
    # จับ pattern หัวข้อย่อยที่ขึ้นด้วยเลข
    body = re.sub(
        r'(\n\n)(\d+\.\s+)(.+?)(?=\n\n|\Z)',
        BoldSubHeading,
        body,
        flags=re.DOTALL
    )
    
    # ขั้นตอนที่ 4: ลบ newline ซ้ำเกิน 2 ตัว
    body = re.sub(r'\n{3,}', '\n\n', body)
    
    # ขั้นตอนที่ 5: ประกอบกลับ
    parts = []
    if heading:
        parts.append(heading)
    if keyword:
        parts.append(keyword)
    if body:
        parts.append(body)
    
    return '\n\n'.join(parts)


def Main():
    """ฟังก์ชันหลัก"""
    print("จัดรูปแบบเนื้อหาปี 1 ใน lessons.json")
    print("=" * 50)
    
    with open(LESSONS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    year1 = data.get('year1', {})
    update_count = 0
    
    for course_slug in year1:
        lessons = year1[course_slug]
        for i, lesson in enumerate(lessons):
            old_content = lesson.get('content', '')
            new_content = FormatContent(old_content)
            
            if old_content != new_content:
                lesson['content'] = new_content
                update_count += 1
                title = lesson.get('title', f'บทที่ {i+1}')
                print(f"  [จัดรูปแบบ] {course_slug} - {title[:40]}")
    
    with open(LESSONS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\nจัดรูปแบบแล้ว: {update_count} บท")
    print(f"บันทึกที่: {LESSONS_FILE}")


if __name__ == "__main__":
    Main()
