-- info_url 컬럼 제거: 카카오 API 실시간 호출로 전환 완료, DB 저장 불필요
ALTER TABLE books DROP COLUMN IF EXISTS info_url;
