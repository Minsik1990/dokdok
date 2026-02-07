-- ========================================
-- 독독 v3 전면 개편 마이그레이션
-- 기존 테이블 전부 DROP → 새 스키마
-- ========================================

-- 기존 테이블 삭제
DROP TABLE IF EXISTS collection_records CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS session_reviews CASCADE;
DROP TABLE IF EXISTS agent_conversations CASCADE;
DROP TABLE IF EXISTS ai_contents CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS reading_groups CASCADE;
DROP TABLE IF EXISTS records CASCADE;
DROP TABLE IF EXISTS invite_codes CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS books CASCADE;

-- ========================================
-- 새 스키마
-- ========================================

-- 독서 모임
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  access_code TEXT UNIQUE NOT NULL,
  admin_password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_access_code_length CHECK (length(access_code) >= 2)
);

-- 도서 캐시
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isbn TEXT UNIQUE,
  title TEXT NOT NULL,
  author TEXT,
  publisher TEXT,
  cover_image_url TEXT,
  description TEXT,
  api_source TEXT DEFAULT 'kakao',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 모임 기록 (핵심 테이블)
CREATE TABLE club_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id),
  session_number INTEGER,
  session_date DATE NOT NULL,
  presenter TEXT[] DEFAULT '{}',
  participants TEXT[] DEFAULT '{}',
  presentation_text TEXT CHECK (length(presentation_text) <= 10000),
  content TEXT CHECK (length(content) <= 5000),
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 멤버 이름 사전 (자동완성용)
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) <= 20),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(club_id, name)
);

-- 인덱스
CREATE INDEX idx_club_sessions_club_id ON club_sessions(club_id);
CREATE INDEX idx_club_sessions_book_id ON club_sessions(book_id);
CREATE INDEX idx_members_club_id ON members(club_id);

-- RLS 비활성화 (서버 사이드 전용 접근)
ALTER TABLE clubs DISABLE ROW LEVEL SECURITY;
ALTER TABLE books DISABLE ROW LEVEL SECURITY;
ALTER TABLE club_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE members DISABLE ROW LEVEL SECURITY;

-- 시드 데이터: 기본 모임
-- 비밀번호: admin1234 (bcrypt hash)
INSERT INTO clubs (name, description, access_code, admin_password_hash) VALUES (
  '독독모임',
  '함께 읽고, 함께 기록하는 독서 모임',
  '독독모임',
  '$2b$10$KLtD2yfJ81kva85gVOqxvuQ0ijvCjlCPPHtejS/V0o6r2rNkl.Lxy'
);
