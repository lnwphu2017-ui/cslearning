# -*- coding: utf-8 -*-
import os
import re
import sys
from typing import List, Dict, Any
from supabase_client import supabase  # Import existing client

# ตั้งค่า stdout ให้รองรับ UTF-8 สำหรับ Windows console
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

_syllabus_text = None
_subject_sections = None

def _load_syllabus():
    """Load and parse the syllabus file once."""
    global _syllabus_text, _subject_sections

    if _syllabus_text is not None:
        return

    base_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(base_dir, "data", "syllabus.txt")

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            _syllabus_text = f.read()
    except Exception as e:
        print(f"Error loading syllabus file: {e}")
        _syllabus_text = "Syllabus file not found."
        _subject_sections = {}
        return

    # Parse into individual subject sections by splitting on "### "
    raw_sections = _syllabus_text.split("### ")
    _subject_sections = {}

    for section in raw_sections[1:]:
        lines = section.split("\n")
        header = lines[0].strip()
        full_content = "### " + section.strip()
        _subject_sections[header] = full_content

    print(f"Syllabus loaded: {len(_subject_sections)} subjects found.")

def get_full_syllabus() -> str:
    """Return the entire syllabus text. Used as context for chat."""
    _load_syllabus()
    return _syllabus_text

async def search_lessons_database(query: str, limit: int = 3) -> str:
    """
    Search for relevant lesson content in Supabase.
    This provides rich details from the actual teaching materials.
    """
    try:
        # Step 1: Clean query for better matching
        query_clean = query.strip()
        if len(query_clean) < 2:
            return ""

        # Step 2: Search in database (Title match first, then Content)
        # Using .ilike() for simple keyword search since we don't have embeddings yet
        # We search for lessons where title OR content contains the query
        
        # Search Title
        res_title = supabase.table('lessons').select('title, content, course_slug')\
            .ilike('title', f'%{query_clean}%')\
            .limit(limit).execute()
        
        # Search Content if not enough title matches
        res_content = []
        if len(res_title.data) < limit:
            res_content = supabase.table('lessons').select('title, content, course_slug')\
                .ilike('content', f'%{query_clean}%')\
                .limit(limit - len(res_title.data)).execute()
            res_content = res_content.data
        else:
            res_content = []

        combined_results = res_title.data + res_content
        
        if not combined_results:
            return ""

        # Format results for the LLM
        formatted_context = "=== ข้อมูลเนื้อหาบทเรียนที่เกี่ยวข้อง (Lesson Content) ===\n"
        for i, item in enumerate(combined_results):
            formatted_context += f"บทเรียน: {item['title']} (รหัสวิชา: {item['course_slug']})\n"
            # Limit content size per lesson to save tokens
            content_snippet = item['content'][:1500] + ("..." if len(item['content']) > 1500 else "")
            formatted_context += f"เนื้อหา: {content_snippet}\n"
            formatted_context += "---\n"
        
        return formatted_context
    except Exception as e:
        print(f"Error in database search: {e}")
        return ""

async def get_subject_section(query: str) -> str:
    """
    Enhanced retrieval combining Syllabus context and Database content.
    """
    _load_syllabus()

    # 1. Get database context (Rich details)
    db_context = await search_lessons_database(query)

    # 2. Get syllabus context (Structural information)
    query_lower = query.lower()
    matched_sections = []

    for header, content in _subject_sections.items():
        if query_lower in header.lower() or query_lower in content.lower():
            matched_sections.append(content)

    # Partial matching for syllabus if needed
    if not matched_sections:
        query_words = [w for w in query_lower.split() if len(w) > 2]
        for header, content in _subject_sections.items():
            header_lower = header.lower()
            content_lower = content.lower()
            match_count = sum(1 for word in query_words if word in header_lower or word in content_lower)
            if match_count >= max(1, len(query_words) // 2):
                matched_sections.append(content)

    syllabus_context = "\n\n".join(matched_sections) if matched_sections else ""
    
    # Final combined context
    final_context = ""
    if db_context:
        final_context += db_context + "\n"
    if syllabus_context:
        final_context += "=== ข้อมูลโครงสร้างหลักสูตร (Syllabus) ===\n" + syllabus_context

    return final_context or _syllabus_text

def get_retriever():
    """Legacy function. Returns a simple object that mimics retriever behavior."""
    class SimpleSyllabusRetriever:
        async def ainvoke(self, query: str):
            from langchain_core.documents import Document
            section_text = await get_subject_section(query)
            return [Document(page_content=section_text, metadata={"source": "database + syllabus"})]
    return SimpleSyllabusRetriever()
