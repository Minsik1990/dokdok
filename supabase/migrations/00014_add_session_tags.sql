-- 세션 태그 기능: 자유 텍스트 태그를 배열로 저장
ALTER TABLE club_sessions ADD COLUMN tags TEXT[] DEFAULT '{}';
