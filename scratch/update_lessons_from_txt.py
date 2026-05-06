
import json
import re

def ParseYear1(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    courses = re.split(r'\d+\.\s*(?=[A-Z])', content)
    
    course_map = {
        "Introduction to Computer Science": "intro-to-cs",
        "Structured Programming": "structured-programming",
        "Discrete Structures": "discrete-structures",
        "Functional Programming": "functional-programming",
        "Object Oriented Programming": "object-oriented-programming",
        "Digital and Boolean Algebra": "digital-and-boolean-algebra"
    }

    result = {}

    for section in courses:
        if not section.strip():
            continue
            
        course_name_match = re.search(r'Course:\s*(.*)', section)
        if not course_name_match:
            continue
            
        course_display_name = course_name_match.group(1).strip()
        course_key = course_map.get(course_display_name)
        
        if not course_key:
            continue

        lesson_blocks = re.split(r'Lesson:', section)
        lessons_list = []
        
        for block in lesson_blocks[1:]:
            block = block.strip()
            block_lines = block.split('\n')
            full_title = block_lines[0].strip()
            
            clean_title = re.sub(r'^บทที่\s*\d+\s*:\s*', '', full_title).strip()
            
            keywords = ""
            keywords_match = re.search(r'Keywords:\s*(.*)', block)
            if keywords_match:
                keywords = keywords_match.group(1).strip()
                
            content_text = ""
            content_match = re.search(r'Content:\s*(.*)', block, re.DOTALL)
            if content_match:
                content_text = content_match.group(1).strip()
            
            content_text = re.split(r'\n\s*Course:', content_text)[0].strip()
            content_text = re.split(r'\n\s*Lesson:', content_text)[0].strip()

            formatted_content = f"# {full_title}\n\n"
            
            if keywords:
                # Removed [!NOTE] and just keeping the blockquote with Keyword
                formatted_content += f"> **Keyword**: {keywords}\n\n"
            
            words_to_bold = sorted([k.strip() for k in keywords.split(',')], key=len, reverse=True)
            for word in words_to_bold:
                if word and len(word) > 2:
                    pattern = re.compile(re.escape(word), re.IGNORECASE)
                    content_text = pattern.sub(lambda m: f"**{m.group(0)}**", content_text)
            
            formatted_content += content_text
            
            lessons_list.append({
                "title": clean_title,
                "content": formatted_content
            })
            
        result[course_key] = lessons_list
        
    return result

txt_path = r'c:\Users\kil\Desktop\New folder (2)\Product\Year1.txt'
json_path = r'c:\Users\kil\Desktop\New folder (2)\Product\frontend\src\data\lessons.json'

new_year1_data = ParseYear1(txt_path)

with open(json_path, 'r', encoding='utf-8') as f:
    full_data = json.load(f)

full_data['year1'] = new_year1_data

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(full_data, f, ensure_ascii=False, indent=2)

print("Successfully removed [!NOTE] and updated lessons.json")
