-- Chaekdam v2 전면 개편 마이그레이션
-- 개인 독서 기록 중심 + Supabase Auth Magic Link

-- 프로필 (Supabase Auth 연동)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text unique not null check (char_length(nickname) between 2 and 12),
  avatar_url text,
  created_at timestamptz default now()
);

-- 독서 기록 (핵심 테이블)
create table records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  book_id uuid not null references books(id),
  status text not null check (status in ('reading', 'completed', 'wishlist')),
  rating smallint check (rating between 1 and 5),
  content text,
  quote text,
  card_color text default 'white' check (card_color in ('white', 'peach', 'lavender', 'mint', 'lemon', 'rose', 'sky')),
  summary text,
  started_at date,
  finished_at date,
  visibility text default 'public' check (visibility in ('public', 'private', 'friends')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 컬렉션 (Phase 2)
create table collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  description text,
  visibility text default 'public' check (visibility in ('public', 'private')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table collection_records (
  collection_id uuid not null references collections(id) on delete cascade,
  record_id uuid not null references records(id) on delete cascade,
  sort_order int default 0,
  primary key (collection_id, record_id)
);

-- 모임 멤버 (기존 reading_groups에 invite_code 추가)
alter table reading_groups add column if not exists invite_code text unique;

-- group_members 테이블
create table group_members (
  group_id uuid not null references reading_groups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

-- 세션에 presenter_id 추가 (기존 presenter text는 유지하되 점진 마이그레이션)
alter table sessions add column if not exists presenter_id uuid references profiles(id);

-- 세션 감상 (기존 reviews 리뉴얼)
create table session_reviews (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  rating smallint check (rating between 1 and 5),
  created_at timestamptz default now()
);

-- 초대 코드 (환경변수 → DB 이동)
create table invite_codes (
  code text primary key,
  used_by uuid references profiles(id),
  used_at timestamptz,
  expires_at timestamptz
);

-- agent_conversations에 user_id 추가 (기존 nickname 대신)
alter table agent_conversations add column if not exists user_id uuid references profiles(id);
-- conversation_type 확장
alter table agent_conversations drop constraint if exists agent_conversations_conversation_type_check;
alter table agent_conversations add constraint agent_conversations_conversation_type_check
  check (conversation_type in ('free_chat', 'preparation', 'review', 'record_interview', 'group_discussion', 'analysis'));

-- 인덱스
create index idx_records_user_id on records(user_id);
create index idx_records_book_id on records(book_id);
create index idx_records_status on records(status);
create index idx_records_created_at on records(created_at desc);
create index idx_group_members_user_id on group_members(user_id);
create index idx_session_reviews_session_id on session_reviews(session_id);
create index idx_profiles_nickname on profiles(nickname);

-- RLS
alter table profiles enable row level security;
alter table records enable row level security;
alter table collections enable row level security;
alter table collection_records enable row level security;
alter table group_members enable row level security;
alter table session_reviews enable row level security;
alter table invite_codes enable row level security;

-- profiles: 본인만 수정, 공개 프로필은 모두 읽기
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- records: 본인 것만 수정/삭제, 공개 기록은 모두 읽기
create policy "records_select" on records for select using (
  visibility = 'public' or user_id = auth.uid()
);
create policy "records_insert" on records for insert with check (auth.uid() = user_id);
create policy "records_update" on records for update using (auth.uid() = user_id);
create policy "records_delete" on records for delete using (auth.uid() = user_id);

-- collections
create policy "collections_select" on collections for select using (
  visibility = 'public' or user_id = auth.uid()
);
create policy "collections_insert" on collections for insert with check (auth.uid() = user_id);
create policy "collections_update" on collections for update using (auth.uid() = user_id);
create policy "collections_delete" on collections for delete using (auth.uid() = user_id);

-- collection_records
create policy "collection_records_select" on collection_records for select using (true);
create policy "collection_records_insert" on collection_records for insert with check (
  exists (select 1 from collections where id = collection_id and user_id = auth.uid())
);
create policy "collection_records_delete" on collection_records for delete using (
  exists (select 1 from collections where id = collection_id and user_id = auth.uid())
);

-- group_members
create policy "group_members_select" on group_members for select using (true);
create policy "group_members_insert" on group_members for insert with check (auth.uid() = user_id);
create policy "group_members_delete" on group_members for delete using (auth.uid() = user_id);

-- session_reviews
create policy "session_reviews_select" on session_reviews for select using (true);
create policy "session_reviews_insert" on session_reviews for insert with check (auth.uid() = user_id);
create policy "session_reviews_update" on session_reviews for update using (auth.uid() = user_id);
create policy "session_reviews_delete" on session_reviews for delete using (auth.uid() = user_id);

-- invite_codes: 인증된 사용자만 읽기/쓰기
create policy "invite_codes_select" on invite_codes for select using (true);
create policy "invite_codes_update" on invite_codes for update using (auth.uid() is not null);

-- 기본 베타 초대 코드 삽입
insert into invite_codes (code) values ('chaekdam2026') on conflict do nothing;
