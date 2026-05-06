import sys, json, codecs
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

with open(r'c:\Users\kil\Desktop\New folder (2)\Product\frontend\src\data\courses.json', 'r', encoding='utf-8') as f:
    courses = json.load(f)

for y in courses.get('years', []):
    for c in y.get('courses', []):
        if c.get('slug') in ['sql-technologies', 'mobile-app-dev', 'computer-org-arch']:
            print(f"--- {c.get('slug')} in courses.json ---")
            for i, t in enumerate(c.get('topics')):
                print(f"{i}: {t}")

with open(r'c:\Users\kil\Desktop\New folder (2)\Product\frontend\src\data\lessons.json', 'r', encoding='utf-8') as f:
    lessons = json.load(f)

for k, v in lessons.get('year2', {}).items():
    if k in ['sql-technologies', 'mobile-app-dev', 'computer-org-arch']:
        print(f"--- {k} in lessons.json ---")
        for i, l in enumerate(v):
            print(f"{i}: {l.get('title')}")
