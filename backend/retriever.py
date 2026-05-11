# -*- coding: utf-8 -*-
import os
import re
import sys
from typing import List, Dict, Any
from supabase_client import supabase  # Import existing client
from langchain_openai import OpenAIEmbeddings

# ตั้งค่า stdout ให้รองรับ UTF-8 สำหรับ Windows console
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Initialize Embeddings (matching ingest_lessons.py)
api_key = os.environ.get("OPENROUTER_API_KEY")
embedding_model = os.environ.get("OPENROUTER_EMBEDDING_MODEL", "nvidia/llama-nemotron-embed-vl-1b-v2:free")

embeddings = OpenAIEmbeddings(
    model=embedding_model,
    openai_api_key=api_key,
    openai_api_base="https://openrouter.ai/api/v1"
)

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

async def search_lessons_vector(query: str, limit: int = 5, course_slug: str = None) -> str:
    """
    Search for relevant lesson content in Supabase using Vector Similarity Search.
    Uses the match_lesson_chunks RPC function.
    """
    try:
        if not query.strip():
            return ""

        # 1. Generate embedding for the query
        query_embedding = await embeddings.aembed_query(query)

        # 2. Call Supabase RPC for similarity search
        rpc_params = {
            "query_embedding": query_embedding,
            "match_threshold": 0.5, # ปรับจูนตามความเหมาะสม
            "match_count": limit,
        }
        
        if course_slug:
            rpc_params["filter_course_slug"] = course_slug

        res = supabase.rpc('match_lesson_chunks', rpc_params).execute()

        if not res.data:
            print(f"No vector matches found for: {query[:30]}...")
            return ""

        # 3. Format results for the LLM
        formatted_context = "=== ข้อมูลเนื้อหาบทเรียนที่เกี่ยวข้อง (Vector Search Results) ===\n"
        for item in res.data:
            similarity = item.get('similarity', 0)
            formatted_context += f"บทเรียน: {item['chapter_title']} (วิชา: {item['course_slug']}) [ความเกี่ยวข้อง: {similarity:.2f}]\n"
            formatted_context += f"เนื้อหา: {item['content']}\n"
            formatted_context += "---\n"
        
        return formatted_context

    except Exception as e:
        print(f"Error in vector database search: {e}")
        # Fallback to legacy keyword search if vector search fails (e.g. RPC not created yet)
        return await search_lessons_database_legacy(query, limit=3)

async def search_lessons_database_legacy(query: str, limit: int = 3) -> str:
    """
    Legacy keyword search (Fallback).
    """
    try:
        query_clean = query.strip()
        if len(query_clean) < 2:
            return ""

        # Search Title
        res_title = supabase.table('lessons').select('title, content, course_slug')\
            .ilike('title', f'%{query_clean}%')\
            .limit(limit).execute()
        
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

        formatted_context = "=== ข้อมูลเนื้อหาบทเรียนที่เกี่ยวข้อง (Legacy Search) ===\n"
        for i, item in enumerate(combined_results):
            formatted_context += f"บทเรียน: {item['title']} (รหัสวิชา: {item['course_slug']})\n"
            content_snippet = item['content'][:1500] + ("..." if len(item['content']) > 1500 else "")
            formatted_context += f"เนื้อหา: {content_snippet}\n"
            formatted_context += "---\n"
        
        return formatted_context
    except Exception as e:
        print(f"Error in legacy database search: {e}")
        return ""

async def get_subject_section(query: str, course_slug: str = None, lesson_focus: str = None) -> str:
    """
    Enhanced retrieval combining Vector Search, Syllabus context, and current lesson focus.
    """
    _load_syllabus()
    
    final_context = ""
    
    # 1. ALWAYS include the current lesson's content if specified (The primary context)
    if lesson_focus:
        # Search in subject_sections (Syllabus)
        focus_lower = lesson_focus.lower()
        focus_content = ""
        for header, content in _subject_sections.items():
            # Check if focus lesson is mentioned in header OR in the detailed content list
            if focus_lower in header.lower() or focus_lower in content.lower():
                focus_content = content
                break
        
        if focus_content:
            final_context += f"=== เนื้อหาของบทเรียนปัจจุบันที่ผู้ใช้กำลังเปิดดู (PRIMARY CONTEXT) ===\n"
            final_context += f"บทเรียน: {lesson_focus}\n"
            final_context += f"{focus_content}\n\n"

    # 2. Get vector context (Rich details from chunks for the specific query)
    db_context = await search_lessons_vector(query, course_slug=course_slug)
    if db_context:
        final_context += db_context + "\n"

    # 3. Get syllabus context (Structural information matching the query)
    query_lower = query.lower()
    matched_sections = []

    for header, content in _subject_sections.items():
        # Avoid duplicating the focus content
        if lesson_focus and lesson_focus.lower() in header.lower():
            continue
        if query_lower in header.lower() or query_lower in content.lower():
            matched_sections.append(content)

    if matched_sections:
        final_context += "=== ข้อมูลโครงสร้างหลักสูตรและบทเรียนอื่นที่เกี่ยวข้อง (Syllabus) ===\n"
        final_context += "\n\n".join(matched_sections)
    
    return final_context or _syllabus_text

def get_retriever():
    """Legacy function. Returns a simple object that mimics retriever behavior."""
    class SimpleSyllabusRetriever:
        async def ainvoke(self, query: str):
            from langchain_core.documents import Document
            section_text = await get_subject_section(query)
            return [Document(page_content=section_text, metadata={"source": "vector_database + syllabus"})]
    return SimpleSyllabusRetriever()

