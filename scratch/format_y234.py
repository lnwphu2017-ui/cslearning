import json
import re

def parse_year(file_path, course_map):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by something like "1. Database Systems" or "13 .Mobile App Dev"
    courses = re.split(r'(?m)^\d+\s*\.\s*[^\n]+', content)
    
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
            print(f"Skipping unknown course: {course_display_name}")
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

course_map_y2 = {
    "Database Systems": "database-systems",
    "Numerical Methods": "numerical-methods",
    "Data Structures": "data-structures",
    "Computer Org/Arch": "computer-org-arch",
    "Operating Systems": "operating-systems",
    "Human-Computer Interaction": "hci",
    "Artificial Intelligence": "artificial-intelligence",
    "Systems Analysis and Design": "systems-analysis-design",
    "Analysis of Algorithms": "analysis-of-algorithms",
    "Data Communications": "data-communications",
    "Web Application Development": "web-app-dev",
    "SQL Technologies": "sql-technologies",
    "Mobile App Dev": "mobile-app-dev"
}

course_map_y3 = {
    "Software Engineering": "software-engineering",
    "UX/UI Design": "ux-ui-design",
    "Concepts of Programming Languages": "programming-languages",
    "Modern Web App Dev": "modern-web-app-dev",
    "Cloud Computing": "cloud-computing",
    "Computer Science Project 1": "cs-project-1"
}

course_map_y4 = {
    "Computer Science Project 2": "cs-project-2",
    "Cybersecurity": "cybersecurity"
}

json_path = r'c:\Users\kil\Desktop\New folder (2)\Product\frontend\src\data\lessons.json'

with open(json_path, 'r', encoding='utf-8') as f:
    full_data = json.load(f)

full_data['year2'] = parse_year(r'c:\Users\kil\Desktop\New folder (2)\Product\Year2.txt', course_map_y2)
full_data['year3'] = parse_year(r'c:\Users\kil\Desktop\New folder (2)\Product\Year3.txt', course_map_y3)
full_data['year4'] = parse_year(r'c:\Users\kil\Desktop\New folder (2)\Product\Year4.txt', course_map_y4)

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(full_data, f, ensure_ascii=False, indent=2)

print("Successfully updated year2, year3, year4 in lessons.json")
