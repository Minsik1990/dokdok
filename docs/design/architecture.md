# 아키텍처 & 프로젝트 구조

> 최종 업데이트: 2026-02-07 (v2.0)
> v2 전면 개편: 개인 기록 중심, Magic Link 인증, 도구형 AI 에이전트

---

## 1. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                      Client (Browser)                    │
│                  Next.js 15 (App Router)                 │
│         SSR + Client Components + Server Actions         │
└─────────────────┬───────────────────┬───────────────────┘
                  │                   │
                  ▼                   ▼
┌─────────────────────┐   ┌─────────────────────────────┐
│   Vercel (Hosting)   │   │    Supabase (BaaS)          │
│                      │   │                             │
│  - SSR/SSG           │   │  - PostgreSQL (DB)          │
│  - API Routes        │   │  - Auth (Magic Link)        │
│  - Edge Functions    │   │  - Storage (이미지)          │
│  - Image CDN         │   │  - Realtime (Phase 3)      │
│  - Preview Deploy    │   │                             │
└──────────┬───────────┘   └──────────┬──────────────────┘
           │                          │
           ▼                          ▼
┌──────────────────┐    ┌──────────────────────────────┐
│  Claude API      │    │  External APIs               │
│                  │    │                              │
│  - Sonnet 4.5    │    │  - 네이버 도서 검색 API       │
│  - Streaming     │    │                              │
│  - Prompt Cache  │    │                              │
└──────────────────┘    └──────────────────────────────┘
```

---

## 2. 프로젝트 구조

```
chaekdam/
├── docs/                          # 프로젝트 문서
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx             # 루트 레이아웃 (Pretendard 폰트)
│   │   ├── page.tsx               # 루트 리다이렉트 (-> /login 또는 /home)
│   │   ├── globals.css            # 글로벌 스타일 (Tailwind, CSS 변수)
│   │   │
│   │   ├── login/                 # 로그인 (초대 코드 + Magic Link)
│   │   │   └── page.tsx
│   │   ├── invite/                # 초대 코드 전용 랜딩
│   │   │   └── page.tsx
│   │   ├── onboarding/            # 닉네임 설정 (첫 로그인)
│   │   │   └── page.tsx
│   │   │
│   │   ├── (main)/                # 메인 레이아웃 (하단 탭)
│   │   │   ├── layout.tsx         # BottomNav 포함 레이아웃
│   │   │   ├── home/
│   │   │   │   └── page.tsx       # 홈 (최근 기록, 통계)
│   │   │   ├── search/
│   │   │   │   └── page.tsx       # 도서 검색
│   │   │   ├── record/
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx   # 기록 작성
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx   # 기록 상세
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx  # 기록 수정
│   │   │   ├── groups/
│   │   │   │   ├── page.tsx       # 모임 목록
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx   # 모임 생성
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx   # 모임 상세
│   │   │   │       └── sessions/
│   │   │   │           └── [sessionId]/
│   │   │   │               └── page.tsx  # 세션 상세
│   │   │   └── profile/
│   │   │       └── page.tsx       # 프로필 + 내 기록
│   │   │
│   │   └── api/                   # API Routes
│   │       ├── auth/
│   │       │   └── callback/
│   │       │       └── route.ts   # Magic Link 콜백
│   │       ├── invite/
│   │       │   └── verify/
│   │       │       └── route.ts   # 초대 코드 검증
│   │       ├── books/
│   │       │   └── search/
│   │       │       └── route.ts   # 네이버 도서 검색
│   │       └── agent/
│   │           ├── interview/
│   │           │   └── route.ts   # 대화형 기록
│   │           ├── summarize/
│   │           │   └── route.ts   # 요약
│   │           ├── topics/
│   │           │   └── route.ts   # 토론 주제
│   │           ├── draft/
│   │           │   └── route.ts   # 발제문 초안
│   │           └── analysis/
│   │               └── route.ts   # 도서 분석
│   │
│   ├── components/
│   │   ├── ui/                    # shadcn/ui 컴포넌트
│   │   ├── layout/
│   │   │   └── bottom-nav.tsx     # 하단 탭 네비게이션
│   │   └── features/
│   │       ├── records/
│   │       │   ├── record-card.tsx
│   │       │   ├── record-form.tsx
│   │       │   ├── star-rating.tsx
│   │       │   └── status-badge.tsx
│   │       ├── books/
│   │       │   └── book-search.tsx
│   │       ├── groups/
│   │       │   └── group-card.tsx
│   │       ├── sessions/
│   │       │   └── session-card.tsx
│   │       └── agent/
│   │           ├── interview-chat.tsx
│   │           └── agent-panel.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts          # 브라우저 클라이언트
│   │   │   ├── server.ts          # 서버 클라이언트
│   │   │   └── middleware.ts      # Auth 미들웨어
│   │   ├── api/
│   │   │   ├── naver-books.ts     # 네이버 도서 API
│   │   │   └── cache.ts           # API 결과 캐싱
│   │   └── agent/
│   │       ├── client.ts          # Claude API 클라이언트
│   │       ├── prompts.ts         # 시스템 프롬프트 (도구형, 캐릭터 없음)
│   │       ├── stream.ts          # 스트리밍 유틸리티
│   │       ├── cache.ts           # AI 응답 캐싱
│   │       └── types.ts           # AI 관련 타입
│   │
│   ├── hooks/                     # 커스텀 React 훅
│   ├── types/                     # TypeScript 타입 정의
│   └── utils/                     # 유틸리티 함수
│
├── supabase/
│   ├── migrations/                # DB 마이그레이션
│   └── seed.sql                   # 시드 데이터
├── public/                        # 정적 파일
├── database.types.ts              # Supabase 자동 생성 타입
├── .github/
│   └── workflows/
│       ├── ci.yml                 # CI 파이프라인
│       └── keep-alive.yml         # Supabase 일시정지 방지
├── middleware.ts                   # Next.js 미들웨어 (인증 체크)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. 컴포넌트 구조

### Server Components (기본)

- 페이지 컴포넌트 (page.tsx)
- 레이아웃 컴포넌트 (layout.tsx)
- 데이터 패칭이 필요한 컴포넌트

### Client Components ('use client')

| 컴포넌트      | 이유                              |
| ------------- | --------------------------------- |
| BottomNav     | 현재 경로 하이라이트, 탭 인터랙션 |
| RecordForm    | 폼 상태 관리, 실시간 입력         |
| RecordCard    | 탭/호버 인터랙션                  |
| InterviewChat | 실시간 대화, 스트리밍             |
| StarRating    | 클릭 인터랙션                     |
| StatusBadge   | 상태 변경 인터랙션                |
| AgentPanel    | AI 응답 스트리밍                  |
| BookSearch    | 검색 입력, 디바운스               |

---

## 4. 데이터 흐름

### 4.1 인증 플로우

```
유저 → /login → 초대 코드 입력 → /api/invite/verify (DB 검증)
→ 이메일 입력 → Supabase Auth signInWithOtp (Magic Link 발송)
→ 이메일 링크 클릭 → /api/auth/callback → 세션 생성
→ 첫 로그인? → /onboarding (닉네임 설정) → /home
→ 기존 유저? → /home
```

### 4.2 도서 검색 플로우

```
유저 검색 → API Route → books 테이블 캐시 확인
  → 캐시 있음: DB에서 반환
  → 캐시 없음: 네이버 API 호출 → DB 캐싱 → 반환
```

### 4.3 기록 작성 플로우

```
유저 → 도서 검색/선택 → 기록 폼 작성 (감상, 인용, 별점, 상태)
→ Server Action → records 테이블 INSERT → 홈 피드 갱신
```

### 4.4 대화형 기록 (AI Interview) 플로우

```
유저 → 책 선택 → "대화로 기록하기" 선택
→ /api/agent/interview → Claude API (책 컨텍스트 + 질문 생성)
→ 질문 스트리밍 → 유저 답변 → 다음 질문 (3~5회 반복)
→ 대화 완료 → /api/agent/summarize → 기록 초안 생성
→ 유저 수정 → records 테이블 INSERT
```

### 4.5 AI 에이전트 플로우 (요약/토론/발제/분석)

```
유저 → 기능 선택 → /api/agent/{type}
→ ai_contents 캐시 확인 → 캐시 히트 시 반환
→ 캐시 미스 → Claude API (Prompt Caching + 스트리밍)
→ 응답 스트리밍 → ai_contents 저장 → 대화 이력 저장
```

---

## 5. AI 에이전트 모듈 (src/lib/agent/)

### client.ts

```typescript
// Claude API 클라이언트 초기화 및 공통 설정
// - Anthropic SDK 인스턴스
// - 모델 상수 (claude-sonnet-4-5)
// - max_tokens, temperature 기본값
```

### prompts.ts

```typescript
// 기능별 시스템 프롬프트 (도구형, 캐릭터 없음)
// - INTERVIEW_SYSTEM: 대화형 기록 인터뷰 프롬프트
// - SUMMARIZE_SYSTEM: 요약 프롬프트
// - TOPICS_SYSTEM: 토론 주제 생성 프롬프트
// - DRAFT_SYSTEM: 발제문 초안 프롬프트
// - ANALYSIS_SYSTEM: 도서 분석 프롬프트
// 톤: 깔끔한 조력자 ("~입니다", "~드립니다")
```

### stream.ts

```typescript
// 스트리밍 응답 처리 유틸리티
// - ReadableStream 생성
// - SSE (Server-Sent Events) 포맷
// - 에러 핸들링
```

### cache.ts

```typescript
// AI 응답 캐싱 로직
// - prompt_hash 생성 (SHA-256)
// - ai_contents 테이블 조회/저장
// - 캐시 히트 판별
```

### types.ts

```typescript
// AI 관련 타입 정의
// - AgentType: 'interview' | 'summarize' | 'topics' | 'draft' | 'analysis'
// - AgentRequest, AgentResponse
// - StreamEvent
```

---

## 6. 보안 설계

### Row Level Security (RLS)

- 모든 테이블에 RLS 정책 적용
- 본인 기록만 조회/수정/삭제 가능
- 모임 멤버만 모임 데이터 접근 가능
- 초대 코드는 Service Role로만 접근

### API 키 관리

```
NEXT_PUBLIC_SUPABASE_URL          # 클라이언트 접근 가능 (anon)
NEXT_PUBLIC_SUPABASE_ANON_KEY     # 클라이언트 접근 가능 (anon)
SUPABASE_SERVICE_ROLE_KEY         # 서버 전용 (초대 코드 검증 등)
ANTHROPIC_API_KEY                 # 서버 전용
NAVER_CLIENT_ID                   # 서버 전용
NAVER_CLIENT_SECRET               # 서버 전용
```

### 인증

- Supabase Auth + Magic Link (이메일)
- 서버 컴포넌트에서 세션 검증
- API Routes에서 인증 미들웨어 적용
- middleware.ts에서 미인증 사용자 /login 리다이렉트

---

## 7. 성능 최적화

| 영역   | 전략                                                       |
| ------ | ---------------------------------------------------------- |
| 이미지 | Next.js Image 컴포넌트 (자동 최적화 + lazy loading)        |
| API    | 도서 검색 결과 DB 캐싱, AI 응답 캐싱 (ai_contents)         |
| AI     | Prompt Caching으로 토큰 비용 절감, 캐시 히트 시 LLM 호출 0 |
| 렌더링 | Server Components (기본) + Client Components (인터랙션)    |
| 번들   | Tree shaking, 코드 스플리팅 (Next.js 자동)                 |
| 폰트   | Pretendard 서브셋, next/font 최적화                        |
| DB     | 인덱스 최적화, created_at DESC 인덱스로 최신순 조회        |
