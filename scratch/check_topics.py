import sys, json, codecs

sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

with open(r'c:\Users\kil\Desktop\New folder (2)\Product\frontend\src\data\courses.json', 'r', encoding='utf-8') as f:
    courses = json.load(f)

for y in courses.get('years', []):
    for c in y.get('courses', []):
        if c.get('slug') in ['object-oriented-programming', 'digital-and-boolean-algebra']:
            print(f"{c.get('slug')}: {len(c.get('topics'))}")
            for t in c.get('topics'):
                print(f" - {t}")
