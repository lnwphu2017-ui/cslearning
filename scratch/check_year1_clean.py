import sys, json, codecs
import re

sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

def clean_string(s):
    if not s: return ''
    s = re.sub(r'\s*\(.*?\)\s*', '', s)
    s = s.strip().replace(' ', '')
    return s

with open(r'c:\Users\kil\Desktop\New folder (2)\Product\frontend\src\data\courses.json', 'r', encoding='utf-8') as f:
    courses = json.load(f)

course_dict = {}
for y in courses.get('years', []):
    for c in y.get('courses', []):
        course_dict[c.get('slug')] = c.get('topics')

with open(r'c:\Users\kil\Desktop\New folder (2)\Product\frontend\src\data\lessons.json', 'r', encoding='utf-8') as f:
    lessons = json.load(f)

year1_lessons = lessons.get('year1', {})
for slug in ['object-oriented-programming', 'digital-and-boolean-algebra']:
    l_list = year1_lessons.get(slug, [])
    if slug in course_dict:
        expected_topics = course_dict[slug]
        actual_titles = [l.get('title') for l in l_list]
        
        print(f'--- {slug} ---')
        for i in range(min(len(expected_topics), len(actual_titles))):
            exp = expected_topics[i]
            act = actual_titles[i]
            c_exp = clean_string(exp)
            c_act = clean_string(act)
            if c_exp != c_act:
                print(f'{i}: MISMATCH! courses=\"{exp}\" ({c_exp}) vs lessons=\"{act}\" ({c_act})')
            else:
                print(f'{i}: MATCH. {c_exp}')
