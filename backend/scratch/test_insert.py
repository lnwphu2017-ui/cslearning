import sys
import os
sys.path.append(os.getcwd())
from supabase_client import supabase

try:
    # Try to insert a dummy row with a title to see if it works or gives a column error
    res = supabase.table('lesson_scores').insert({
        "user_id": "test_user",
        "lesson_title": "test_topic",
        "type": "quiz",
        "score": 0,
        "total_questions": 0
    }).execute()
    print("Success:", res.data)
except Exception as e:
    print("Error:", e)
