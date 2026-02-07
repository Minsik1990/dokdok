-- ========================================
-- 1000명 동시 접속 대비 성능 최적화
-- ========================================

-- 미사용 단일 인덱스 제거 (쓰기 성능 개선)
DROP INDEX IF EXISTS idx_club_sessions_presenter;
DROP INDEX IF EXISTS idx_club_sessions_date;
DROP INDEX IF EXISTS idx_session_comments_created_at;

-- 복합 인덱스 추가 (읽기 성능 최적화)
-- 모임별 세션 최신순 (갤러리/타임라인/프로필)
CREATE INDEX IF NOT EXISTS idx_club_sessions_club_date
  ON club_sessions(club_id, session_date DESC);

-- 모임별 멤버 이름순
CREATE INDEX IF NOT EXISTS idx_members_club_name
  ON members(club_id, name);

-- 세션별 댓글 시간순
CREATE INDEX IF NOT EXISTS idx_session_comments_session_created
  ON session_comments(session_id, created_at);

-- 모임 로그인 (name + access_code 동시 조회)
CREATE INDEX IF NOT EXISTS idx_clubs_name_access_code
  ON clubs(name, access_code);
