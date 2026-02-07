-- Chaekdam MVP 초기 스키마
-- 초대 코드 + 닉네임 기반 (로그인 없음)

-- 독서 모임
create table reading_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  cover_image_url text,
  created_by text not null, -- 닉네임 (MVP: 쿠키 기반)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 도서 (네이버 API 캐싱용)
create table books (
  id uuid primary key default gen_random_uuid(),
  isbn text unique,
  title text not null,
  author text not null,
  publisher text default '',
  cover_image_url text,
  description text default '',
  api_source text default 'naver',
  created_at timestamptz default now()
);

-- 독서 세션 (모임별 독서 기록)
create table sessions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references reading_groups(id) on delete cascade,
  book_id uuid references books(id),
  session_date date not null,
  presenter text default '', -- 발제자 닉네임
  presentation_text text default '', -- 발제문 (마크다운)
  status text default 'upcoming' check (status in ('upcoming', 'completed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 후기/리뷰
create table reviews (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  nickname text not null, -- 작성자 닉네임
  content text not null,
  rating smallint check (rating between 1 and 5),
  created_at timestamptz default now()
);

-- AI 에이전트 대화 이력
create table agent_conversations (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  book_id uuid references books(id),
  session_id uuid references sessions(id),
  messages jsonb not null default '[]', -- [{role, content, timestamp}]
  conversation_type text default 'free_chat' check (
    conversation_type in ('free_chat', 'preparation', 'review')
  ),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- AI 응답 캐시
create table ai_contents (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id),
  content_type text not null, -- 'summary', 'questions', 'analysis'
  content jsonb not null,
  model_used text default 'claude-sonnet-4-5',
  created_at timestamptz default now()
);

-- 인덱스
create index idx_sessions_group_id on sessions(group_id);
create index idx_sessions_session_date on sessions(session_date);
create index idx_reviews_session_id on reviews(session_id);
create index idx_books_isbn on books(isbn);
create index idx_ai_contents_book_id on ai_contents(book_id);

-- RLS 활성화
alter table reading_groups enable row level security;
alter table books enable row level security;
alter table sessions enable row level security;
alter table reviews enable row level security;
alter table agent_conversations enable row level security;
alter table ai_contents enable row level security;

-- MVP: 모든 인증된 요청 허용 (초대 코드로 접근 제어)
-- Supabase anon key로 접근하므로 anon role에 정책 설정
create policy "모든 읽기 허용" on reading_groups for select using (true);
create policy "모든 쓰기 허용" on reading_groups for insert with check (true);
create policy "모든 수정 허용" on reading_groups for update using (true);

create policy "모든 읽기 허용" on books for select using (true);
create policy "모든 쓰기 허용" on books for insert with check (true);

create policy "모든 읽기 허용" on sessions for select using (true);
create policy "모든 쓰기 허용" on sessions for insert with check (true);
create policy "모든 수정 허용" on sessions for update using (true);

create policy "모든 읽기 허용" on reviews for select using (true);
create policy "모든 쓰기 허용" on reviews for insert with check (true);

create policy "모든 읽기 허용" on agent_conversations for select using (true);
create policy "모든 쓰기 허용" on agent_conversations for insert with check (true);
create policy "모든 수정 허용" on agent_conversations for update using (true);

create policy "모든 읽기 허용" on ai_contents for select using (true);
create policy "모든 쓰기 허용" on ai_contents for insert with check (true);
