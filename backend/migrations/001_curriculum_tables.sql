-- ============================================================
-- Migration: สร้าง Tables สำหรับ Curriculum RAG System
-- ใช้สำหรับเก็บเนื้อหาหลักสูตรทั้ง 4 ชั้นปี
-- ============================================================

-- เปิดใช้ pgvector extension (ถ้ายังไม่ได้เปิด)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- Table 1: curriculum_content (ข้อมูลดิบ — dropdown items)
-- ============================================================
CREATE TABLE IF NOT EXISTS curriculum_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    year INT NOT NULL,
    course_slug TEXT NOT NULL,
    course_title TEXT NOT NULL,
    chapter_number INT NOT NULL,
    chapter_title TEXT NOT NULL,
    dropdown_header TEXT NOT NULL,
    dropdown_content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    -- ป้องกันข้อมูลซ้ำ: 1 dropdown header ต่อ 1 บทต่อ 1 วิชา
    UNIQUE(course_slug, chapter_number, dropdown_header)
);

-- Indexes สำหรับ query performance
CREATE INDEX IF NOT EXISTS idx_curriculum_content_year
    ON curriculum_content(year);
CREATE INDEX IF NOT EXISTS idx_curriculum_content_slug
    ON curriculum_content(course_slug);
CREATE INDEX IF NOT EXISTS idx_curriculum_content_chapter
    ON curriculum_content(course_slug, chapter_number);

-- ============================================================
-- Table 2: curriculum_chunks (Vector chunks สำหรับ RAG)
-- ============================================================
CREATE TABLE IF NOT EXISTS curriculum_chunks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    embedding VECTOR(2048),
    year INT NOT NULL,
    course_slug TEXT NOT NULL,
    chapter_number INT NOT NULL,
    chapter_title TEXT NOT NULL,
    dropdown_header TEXT NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes สำหรับ query performance
CREATE INDEX IF NOT EXISTS idx_curriculum_chunks_slug
    ON curriculum_chunks(course_slug);
CREATE INDEX IF NOT EXISTS idx_curriculum_chunks_year
    ON curriculum_chunks(year);
CREATE INDEX IF NOT EXISTS idx_curriculum_chunks_chapter
    ON curriculum_chunks(course_slug, chapter_number);

-- IVFFlat index สำหรับ vector similarity search (ประสิทธิภาพสูง)
-- หมายเหตุ: ต้องมีข้อมูลก่อนจึงสร้าง index ได้ — รัน ALTER หลัง ingest

-- ============================================================
-- RPC Function: match_curriculum_chunks
-- ใช้สำหรับ similarity search ด้วย cosine distance
-- ============================================================
CREATE OR REPLACE FUNCTION match_curriculum_chunks(
    query_embedding VECTOR(2048),
    match_threshold FLOAT DEFAULT 0.5,
    match_count INT DEFAULT 5,
    filter_course_slug TEXT DEFAULT NULL,
    filter_year INT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    course_slug TEXT,
    chapter_number INT,
    chapter_title TEXT,
    dropdown_header TEXT,
    year INT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cc.id,
        cc.content,
        cc.course_slug,
        cc.chapter_number,
        cc.chapter_title,
        cc.dropdown_header,
        cc.year,
        1 - (cc.embedding <=> query_embedding) AS similarity
    FROM curriculum_chunks cc
    WHERE
        -- กรองตาม threshold
        1 - (cc.embedding <=> query_embedding) > match_threshold
        -- กรองตาม course_slug (ถ้าระบุ)
        AND (filter_course_slug IS NULL OR cc.course_slug = filter_course_slug)
        -- กรองตาม year (ถ้าระบุ)
        AND (filter_year IS NULL OR cc.year = filter_year)
    ORDER BY cc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ============================================================
-- RPC Function: get_curriculum_content_by_chapter
-- ดึงเนื้อหาทั้งบทสำหรับ generate flashcards/quiz/exam
-- ============================================================
CREATE OR REPLACE FUNCTION get_curriculum_content_by_chapter(
    p_course_slug TEXT,
    p_chapter_number INT
)
RETURNS TABLE (
    dropdown_header TEXT,
    dropdown_content TEXT,
    chapter_title TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cc.dropdown_header,
        cc.dropdown_content,
        cc.chapter_title
    FROM curriculum_content cc
    WHERE cc.course_slug = p_course_slug
      AND cc.chapter_number = p_chapter_number
    ORDER BY cc.id;
END;
$$;

-- ============================================================
-- RPC Function: get_curriculum_content_by_course
-- ดึงเนื้อหาทั้งวิชาสำหรับ exam generation
-- ============================================================
CREATE OR REPLACE FUNCTION get_curriculum_content_by_course(
    p_course_slug TEXT
)
RETURNS TABLE (
    chapter_number INT,
    chapter_title TEXT,
    dropdown_header TEXT,
    dropdown_content TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cc.chapter_number,
        cc.chapter_title,
        cc.dropdown_header,
        cc.dropdown_content
    FROM curriculum_content cc
    WHERE cc.course_slug = p_course_slug
    ORDER BY cc.chapter_number, cc.id;
END;
$$;
