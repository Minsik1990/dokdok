-- 접속 정책 변경: access_code UNIQUE 제거, name UNIQUE 추가
-- access_code는 "비밀번호" 역할 (중복 허용)
-- name은 "아이디" 역할 (고유해야 함)
ALTER TABLE clubs DROP CONSTRAINT clubs_access_code_key;
ALTER TABLE clubs ADD CONSTRAINT clubs_name_key UNIQUE (name);
