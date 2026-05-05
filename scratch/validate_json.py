import json
try:
    with open(r'c:\Users\Admin\Desktop\Project7\project1.3\propro1\frontend\src\data\lessons.json', 'r', encoding='utf-8') as f:
        json.load(f)
    print("Valid JSON")
except Exception as e:
    print(f"Invalid JSON: {e}")
