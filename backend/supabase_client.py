import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_ANON_KEY", "")

if not url or not key:
    print("Missing Supabase URL or Anon Key in .env file")

supabase: Client = create_client(url, key)
