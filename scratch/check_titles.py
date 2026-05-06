import sys, json, codecs

sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

with open(r'c:\Users\kil\Desktop\New folder (2)\Product\frontend\src\data\courses.json', 'r', encoding='utf-8') as f:
    courses = json.load(f)

course_dict = {}
for y in courses.get('years', []):
    for c in y.get('courses', []):
        course_dict[c.get('slug')] = c.get('topics')

with open(r'c:\Users\kil\Desktop\New folder (2)\Product\frontend\src\data\lessons.json', 'r', encoding='utf-8') as f:
    lessons = json.load(f)

for y in ['year2', 'year3', 'year4']:
    year_lessons = lessons.get(y, {})
    for slug, l_list in year_lessons.items():
        if slug in course_dict:
            expected_topics = course_dict[slug]
            actual_titles = [l.get('title') for l in l_list]
            
            for i in range(min(len(expected_topics), len(actual_titles))):
                exp = expected_topics[i].replace(' ', '')
                act = actual_titles[i].replace(' ', '')
                if exp != act:
                    print(f'{slug} mismatch at idx {i}: courses=\"{expected_topics[i]}\" vs lessons=\"{actual_titles[i]}\"')
            if len(expected_topics) != len(actual_titles):
                print(f'{slug} length mismatch: {len(expected_topics)} vs {len(actual_titles)}')
