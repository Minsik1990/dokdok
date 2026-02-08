-- books 테이블에 도서 상세 페이지 URL 추가
ALTER TABLE books ADD COLUMN IF NOT EXISTS info_url text;
