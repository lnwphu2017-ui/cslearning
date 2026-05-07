import json
import re
import os

def parse_txt_file(file_path):
    print(f"Parsing {file_path}...")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        with open(file_path, 'r', encoding='cp874') as f:
            content = f.read()
    
    # Normalize line endings
    content = content.replace('\r\n', '\n')
    
    # Pattern to match each lesson block
    # It starts with Course:, then Lesson:, then Keywords:, then Content:
    # We use non-greedy matching for Content until the next "Course:" or end of file
    pattern = r"Course:\s*(.*?)\nLesson:\s*(.*?)\nKeywords:\s*(.*?)\nContent:\s*(.*?)(?=\nCourse:|\n\d+\.|\Z)"
    matches = re.finditer(pattern, content, re.DOTALL)
    
    lessons = []
    for match in matches:
        course_name = match.group(1).strip()
        lesson_title = match.group(2).strip()
        keywords = match.group(3).strip()
        lesson_content = match.group(4).strip()
        
        # Format content with keywords blockquote
        # Using Markdown format as expected by the frontend
        formatted_content = f"# {lesson_title}\n\n> **Keyword**: {keywords}\n\n{lesson_content}"
        
        lessons.append({
            "course": course_name,
            "title": lesson_title,
            "content": formatted_content
        })
    
    print(f"Found {len(lessons)} lessons in {file_path}")
    return lessons

def main():
    # Load courses.json to get slug mapping
    courses_path = 'frontend/src/data/courses.json'
    if not os.path.exists(courses_path):
        print(f"Error: {courses_path} not found")
        return

    with open(courses_path, 'r', encoding='utf-8') as f:
        courses_data = json.load(f)

    slug_map = {} # name_en -> slug
    year_map = {} # slug -> year_key
    for year_info in courses_data['years']:
        year_key = f"year{year_info['year']}"
        for course in year_info['courses']:
            name = course['name_en']
            slug = course['slug']
            slug_map[name] = slug
            year_map[slug] = year_key

    # Initialize lessons data structure
    new_lessons = {
        "year1": {},
        "year2": {},
        "year3": {},
        "year4": {}
    }

    # Files to process
    year_files = ["Year1.txt", "Year2.txt", "Year3.txt", "Year4.txt"]
    
    # Manual mapping for abbreviations found in text files
    manual_mapping = {
        "Computer Org/Arch": "Computer Organization and Architecture",
        "Mobile App Dev": "Mobile Application Development",
        "Modern Web App Dev": "Modern Web Application Development",
        "CS Project 1": "Computer Science Project 1",
        "Computer Science Project 2": "Computer Science Project 2"
    }

    total_parsed = 0
    for file_name in year_files:
        if os.path.exists(file_name):
            lessons_list = parse_txt_file(file_name)
            total_parsed += len(lessons_list)
            for lesson in lessons_list:
                course_name = lesson['course']
                
                # Apply manual mapping
                if course_name in manual_mapping:
                    course_name = manual_mapping[course_name]
                
                if course_name in slug_map:
                    slug = slug_map[course_name]
                    y_key = year_map[slug]
                    if slug not in new_lessons[y_key]:
                        new_lessons[y_key][slug] = []
                    new_lessons[y_key][slug].append({
                        "title": lesson['title'],
                        "content": lesson['content']
                    })
                else:
                    # Try fuzzy match if exact match fails
                    found = False
                    for name_en, slug in slug_map.items():
                        if name_en.lower() in course_name.lower() or course_name.lower() in name_en.lower():
                            y_key = year_map[slug]
                            if slug not in new_lessons[y_key]:
                                new_lessons[y_key][slug] = []
                            new_lessons[y_key][slug].append({
                                "title": lesson['title'],
                                "content": lesson['content']
                            })
                            found = True
                            break
                    if not found:
                        print(f"Warning: Course '{course_name}' not found in courses.json")

    # Write to lessons.json
    output_path = 'frontend/src/data/lessons.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(new_lessons, f, ensure_ascii=False, indent=2)

    print(f"Successfully updated {output_path} with {total_parsed} lessons.")

if __name__ == "__main__":
    main()
