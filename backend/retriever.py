# -*- coding: utf-8 -*-
import os
import re
import sys

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

    with open(file_path, "r", encoding="utf-8") as f:
        _syllabus_text = f.read()

    # Parse into individual subject sections by splitting on "### "
    raw_sections = _syllabus_text.split("### ")
    _subject_sections = {}

    for section in raw_sections[1:]:
        # First line is the subject header, e.g. "1. 09-131-101 Introduction to Computer Science (10 บท)"
        lines = section.split("\n")
        header = lines[0].strip()
        full_content = "### " + section.strip()
        _subject_sections[header] = full_content

    print(f"Syllabus loaded: {len(_subject_sections)} subjects found.")
    for key in _subject_sections:
        print(f"  - {key}")


def get_full_syllabus() -> str:
    """Return the entire syllabus text. Used as context for chat."""
    _load_syllabus()
    return _syllabus_text


def get_subject_section(query: str) -> str:
    """Find the most relevant subject section(s) by keyword matching.
    Used for quiz/flashcard/exam generation where we need specific subject context.
    """
    _load_syllabus()

    query_lower = query.lower()
    matched_sections = []

    for header, content in _subject_sections.items():
        header_lower = header.lower()
        # Check if query keywords appear in the header or content
        if query_lower in header_lower or query_lower in content.lower():
            matched_sections.append(content)

    # If exact match failed, try partial keyword matching
    if not matched_sections:
        query_words = [w for w in query_lower.split() if len(w) > 2]
        for header, content in _subject_sections.items():
            header_lower = header.lower()
            content_lower = content.lower()
            match_count = sum(1 for word in query_words if word in header_lower or word in content_lower)
            if match_count >= max(1, len(query_words) // 2):
                matched_sections.append(content)

    if matched_sections:
        return "\n\n".join(matched_sections)

    # Fallback: return full syllabus
    return _syllabus_text


# Keep backward compatibility - old code may call get_retriever()
# but we also provide the new functions above.
def get_retriever():
    """Legacy function. Returns a simple object that mimics retriever behavior."""
    _load_syllabus()

    class SimpleSyllabusRetriever:
        async def ainvoke(self, query: str):
            """Return matching subject sections as fake Document objects."""
            from langchain_core.documents import Document

            section_text = get_subject_section(query)
            return [Document(page_content=section_text, metadata={"source": "syllabus.txt"})]

    return SimpleSyllabusRetriever()
