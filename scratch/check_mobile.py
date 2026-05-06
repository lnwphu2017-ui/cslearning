import sys, json, codecs
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

with open(r'c:\Users\kil\Desktop\New folder (2)\Product\Year2.txt', 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('Course: Mobile App Dev')
if idx != -1:
    print('Found near:', content[max(0, idx-150):idx+150])
