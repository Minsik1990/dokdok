# Chaekdam v2 PRD (Product Requirements Document)

> 최종 업데이트: 2026-02-07
> 상태: Draft

---

## 1. 서비스 컨셉

**책담 -- 나의 독서 기록. 읽고, 느끼고, 기록하다.**

개인 독서 기록이 메인이며, 독서 모임은 부가 기능으로 제공한다.
AI 독서 에이전트는 캐릭터 없이 깔끔한 도구형 조력자로 동작한다.

### 핵심 가치

| 순위 | 가치        | 설명                                            |
| ---- | ----------- | ----------------------------------------------- |
| 1    | 개인 기록   | 읽은 책에 대한 감상, 인용, 별점을 자유롭게 기록 |
| 2    | 대화형 기록 | AI 인터뷰를 통해 생각을 끌어내고 정리           |
| 3    | 독서 모임   | 모임원과 세션을 관리하고 후기를 공유            |
| 4    | AI 에이전트 | 요약, 토론 주제, 발제문 초안 등 독서 활동 지원  |

---

## 2. 사용자 및 시나리오

### 타겟 사용자

- 독서를 좋아하는 20~40대
- 읽은 책에 대해 가볍게 기록하고 싶은 사람
- 독서 모임에 참여하고 있거나, 만들고 싶은 사람

### 핵심 시나리오

1. **개인 기록**: 책을 검색하고, 감상/인용/별점을 기록한다
2. **대화형 기록**: AI 인터뷰로 "이 책에서 가장 인상 깊은 부분은?" 같은 질문에 답하며 기록을 완성한다
3. **모임 관리**: 독서 모임을 만들고, 세션(모임 회차)을 등록하고, 후기를 남긴다
4. **AI 활용**: 책 요약, 토론 주제 생성, 발제문 초안 작성 등을 AI에게 요청한다

---

## 3. 인증

### Supabase Auth Magic Link (이메일)

- 이메일 입력 -> Magic Link 수신 -> 링크 클릭 -> 로그인 완료
- 별도 비밀번호 없음 (비밀번호 찾기/변경 불필요)
- 초대 코드: DB 기반 (invite_codes 테이블)으로 가입 제한

### 온보딩 플로우

```
1. /login -> 초대 코드 입력 -> 유효하면 이메일 입력
2. Magic Link 이메일 발송
3. 이메일의 링크 클릭 -> /api/auth/callback
4. 첫 로그인이면 /onboarding -> 닉네임 입력
5. 이후 접속은 자동 로그인 (세션 유지)
```

---

## 4. 디자인 방향

### 따뜻한 토스 스타일

- 깔끔하고 미니멀한 UI, 따뜻한 색감
- 모바일 퍼스트 (max-width: 480px)
- 라이트 모드 전용 (다크 모드 없음)
- 포인트 컬러: 코랄 (#F4845F)

> 상세: [docs/design/ui-ux.md](design/ui-ux.md)

---

## 5. 핵심 기능

### 5.1 개인 기록 CRUD

| 필드      | 타입    | 제약                                               |
| --------- | ------- | -------------------------------------------------- |
| content   | TEXT    | max 1,000자                                        |
| quote     | TEXT    | max 500자, nullable                                |
| rating    | INTEGER | 1~5, nullable                                      |
| status    | TEXT    | NOT NULL, 'reading' / 'completed' / 'want_to_read' |
| is_public | BOOLEAN | 기본 false                                         |

- 기록 카드: 파스텔 배경색 (peach, lavender, mint, lemon, rose, sky) 랜덤/선택
- 별점: 앰버(#FFB74D) 별 아이콘으로 입력
- 상태 배지: 읽는 중 / 완독 / 읽고 싶은

### 5.2 대화형 기록 (AI Interview)

- AI가 3~5개 질문을 던져 사용자의 생각을 끌어냄
- 예: "이 책에서 가장 공감한 문장은?", "저자의 핵심 메시지는 무엇이라 생각하나요?"
- 대화 결과를 요약하여 기록(record)으로 저장

### 5.3 독서 모임 (Reading Groups)

- 모임 생성/가입 (초대 코드 기반)
- 세션(모임 회차) 관리: 날짜, 책, 발제자
- 세션별 후기(session_reviews) 작성

### 5.4 AI 에이전트 (도구형)

| 기능               | API Route                      | Phase |
| ------------------ | ------------------------------ | ----- |
| 대화형 기록 인터뷰 | `/api/agent/interview`         | 1     |
| 기록 요약          | `/api/agent/summarize`         | 1     |
| 토론 주제 생성     | `/api/agent/topics`            | 1     |
| 발제문 초안        | `/api/agent/draft`             | 1     |
| 도서 분석          | `/api/agent/analysis`          | 1     |
| 토론 질문 추천     | `/api/agent/suggest-questions` | 2     |
| 도서 추천          | `/api/agent/recommend`         | 2     |
| 독서 인사이트      | `/api/agent/insight`           | 2     |

- 캐릭터 없음: 깔끔한 조력자 톤 ("~입니다", "~드립니다")
- Claude Sonnet 4.5 단일 모델, Prompt Caching 필수

---

## 6. 데이터베이스

### 테이블 목록

| 테이블              | 설명                            | Phase |
| ------------------- | ------------------------------- | ----- |
| profiles            | 사용자 프로필 (auth.users 확장) | 1     |
| books               | 도서 정보 (API 캐시)            | 1     |
| records             | 개인 독서 기록                  | 1     |
| collections         | 기록 모음 (컬렉션)              | 2     |
| collection_records  | 컬렉션-기록 매핑                | 2     |
| reading_groups      | 독서 모임                       | 1     |
| group_members       | 모임 멤버                       | 1     |
| sessions            | 모임 세션 (회차)                | 1     |
| session_reviews     | 세션 후기                       | 1     |
| agent_conversations | AI 대화 이력                    | 1     |
| ai_contents         | AI 생성 콘텐츠 캐시             | 1     |
| invite_codes        | 초대 코드                       | 1     |

> 상세: [docs/design/database-schema.md](design/database-schema.md)

---

## 7. 라우팅 구조

```
/login                  # 초대 코드 + 이메일 입력
/invite                 # 초대 코드 전용 랜딩
/onboarding             # 닉네임 설정 (첫 로그인)
/api/auth/callback      # Magic Link 콜백

/(main)/                # 하단 탭 레이아웃
  ├── home              # 홈 (최근 기록, 통계)
  ├── search            # 도서 검색
  ├── record/new        # 기록 작성
  ├── groups            # 독서 모임 목록
  │   ├── [id]          # 모임 상세
  │   └── [id]/sessions/[sessionId]  # 세션 상세
  └── profile           # 프로필, 내 기록 목록
```

---

## 8. Phase 분리

### Phase 1 -- MVP (핵심)

- 인증 (Magic Link + 초대 코드)
- 온보딩 (닉네임 설정)
- 개인 기록 CRUD
- 도서 검색 (네이버 API)
- 대화형 기록 (AI Interview)
- AI 에이전트 (요약, 토론 주제, 발제문, 분석)
- 독서 모임 기본 (생성, 가입, 세션, 후기)
- 하단 탭 네비게이션
- Vercel 배포 + CI/CD

### Phase 2 -- 확장

- 컬렉션 (기록 모음 관리)
- AI 고도화 (질문 추천, 도서 추천, 인사이트)
- 모임 초대 링크 개선
- 이미지 업로드 (Supabase Storage)
- 독서 통계 대시보드

### Phase 3 -- 고도화

- 소셜 기능 (팔로우, 공개 기록 피드)
- PWA 지원
- 알림 (이메일/푸시)
- OAuth 추가 (카카오, 구글)
- Realtime 토론

---

## 9. MVP 구현 순서 (Step 0~8)

### Step 0: 프로젝트 셋업

- [ ] Next.js 15 + TypeScript + Tailwind CSS v4 + pnpm
- [ ] shadcn/ui 초기화
- [ ] Supabase 프로젝트 생성 + 로컬 개발 환경
- [ ] 환경 변수 설정
- [ ] ESLint + Prettier + 기본 구조

### Step 1: 인증 + 온보딩

- [ ] Supabase Auth Magic Link 설정
- [ ] invite_codes 테이블 + RLS
- [ ] /login 페이지 (초대 코드 -> 이메일)
- [ ] /api/auth/callback
- [ ] /api/invite/verify
- [ ] /onboarding 페이지 (닉네임)
- [ ] profiles 테이블 + 자동 생성 트리거
- [ ] 미들웨어: 미인증 리다이렉트

### Step 2: 도서 검색

- [ ] books 테이블 + RLS
- [ ] /api/books/search (네이버 API)
- [ ] 검색 UI 컴포넌트
- [ ] 검색 결과 -> books 테이블 캐싱

### Step 3: 개인 기록

- [ ] records 테이블 + RLS
- [ ] RecordForm 컴포넌트 (작성/수정)
- [ ] RecordCard 컴포넌트
- [ ] StarRating 컴포넌트
- [ ] StatusBadge 컴포넌트
- [ ] 기록 CRUD Server Actions
- [ ] 홈 피드 (내 기록 목록)
- [ ] 프로필 페이지 (내 기록 전체)

### Step 4: 하단 탭 + 레이아웃

- [ ] BottomNav 컴포넌트 (홈/검색/+기록/모임/프로필)
- [ ] (main) 레이아웃 (max-width: 480px)
- [ ] 페이지 전환 애니메이션

### Step 5: AI 에이전트

- [ ] agent_conversations 테이블 + RLS
- [ ] ai_contents 테이블 + RLS
- [ ] src/lib/agent/ 모듈 (client, prompts, stream, cache, types)
- [ ] /api/agent/interview (대화형 기록)
- [ ] /api/agent/summarize
- [ ] /api/agent/topics
- [ ] /api/agent/draft
- [ ] /api/agent/analysis
- [ ] InterviewChat 컴포넌트
- [ ] AgentPanel 컴포넌트

### Step 6: 독서 모임

- [ ] reading_groups, group_members 테이블 + RLS
- [ ] sessions, session_reviews 테이블 + RLS
- [ ] 모임 생성/가입 UI
- [ ] 세션 관리 UI
- [ ] 세션 후기 작성 UI

### Step 7: 배포 + CI/CD

- [ ] Vercel 배포 설정
- [ ] GitHub Actions CI (lint, typecheck, build)
- [ ] Supabase Keep-Alive cron
- [ ] 기본 E2E 테스트

### Step 8: 마무리 + QA

- [ ] 반응형 검증 (모바일 480px 기준)
- [ ] 에러 핸들링 전체 점검
- [ ] 빈 상태(empty state) UI
- [ ] 로딩 상태 UI
- [ ] 성능 최적화 (이미지, 번들)

---

## 10. 인수 기준 (Acceptance Criteria)

### AC-1: 인증

- 초대 코드로 접근 제한이 동작한다
- Magic Link 이메일로 로그인할 수 있다
- 첫 로그인 시 닉네임을 설정할 수 있다
- 로그인하지 않은 사용자는 /login으로 리다이렉트된다

### AC-2: 도서 검색

- 제목/저자로 책을 검색할 수 있다
- 검색 결과에서 책을 선택하여 기록을 작성할 수 있다
- 동일 ISBN의 책은 중복 저장되지 않는다

### AC-3: 개인 기록 CRUD

- 기록을 생성/조회/수정/삭제할 수 있다
- content는 1,000자를 초과할 수 없다
- quote는 500자를 초과할 수 없다
- rating은 1~5 범위이거나 null이다
- status는 반드시 지정해야 한다

### AC-4: 기록 카드 UI

- 기록 카드에 파스텔 배경색이 적용된다
- 별점이 시각적으로 표시된다
- 상태 배지가 표시된다

### AC-5: 대화형 기록

- AI가 책에 대한 질문을 3~5개 제시한다
- 사용자 답변을 바탕으로 기록 초안이 생성된다
- 생성된 초안을 수정하여 기록으로 저장할 수 있다

### AC-6: AI 에이전트

- 책 요약을 생성할 수 있다
- 토론 주제를 생성할 수 있다
- 발제문 초안을 생성할 수 있다
- AI 응답이 스트리밍으로 표시된다
- 동일 요청에 대해 캐싱된 결과가 반환된다

### AC-7: 독서 모임

- 모임을 생성할 수 있다
- 초대 코드로 모임에 가입할 수 있다
- 세션을 생성하고 책을 연결할 수 있다

### AC-8: 세션 후기

- 세션에 후기를 작성할 수 있다
- 세션당 1인 1개 후기만 작성 가능하다

### AC-9: 하단 탭 네비게이션

- 5개 탭(홈/검색/+기록/모임/프로필)이 표시된다
- 현재 탭이 하이라이트된다
- safe-area가 반영된다

### AC-10: RLS

- 본인의 기록만 조회/수정/삭제할 수 있다
- 모임 멤버만 모임 데이터에 접근할 수 있다
- 다른 사용자의 비공개 기록은 접근할 수 없다

### AC-11: 반응형

- 모바일(480px 이하)에서 모든 기능이 정상 동작한다
- 데스크톱에서는 중앙 정렬 (max-width: 480px)

### AC-12: 성능

- 첫 로드 LCP 3초 이내
- AI 스트리밍 응답 시작까지 2초 이내

### AC-13: 배포

- Vercel에 자동 배포된다
- CI에서 lint, typecheck, build가 통과한다

---

## 11. 테스트 전략

### 단위 테스트 (Vitest)

- 유틸리티 함수
- Server Actions (Supabase mock)
- AI 프롬프트 생성 로직

### 통합 테스트

- API Route 요청/응답
- 인증 플로우

### E2E 테스트 (Playwright)

- 로그인 -> 기록 작성 -> 확인 플로우
- 도서 검색 -> 기록 연결
- 모임 생성 -> 세션 생성 -> 후기 작성

### 테스트 우선순위

1. 인증 플로우 (가장 중요)
2. 기록 CRUD
3. AI 에이전트 응답
4. 모임 관리

---

## 12. 기술 스택

```
Frontend:   Next.js 15 (App Router) + TypeScript strict + Tailwind CSS v4
UI:         shadcn/ui + Radix UI + Lucide Icons
Backend:    Supabase (PostgreSQL + Auth + Storage)
AI:         Claude Sonnet 4.5 (Anthropic API)
도서 API:   네이버 도서 검색 API
배포:       Vercel (Hobby)
CI/CD:      GitHub Actions
Font:       Pretendard
```

---

## 13. 비기능 요구사항

- **보안**: 모든 테이블 RLS 필수, API Key는 환경 변수만
- **비용**: 무료 티어 내 운영 (Supabase Free + Vercel Hobby)
- **접근성**: WCAG AA 색상 대비, 키보드 네비게이션, 시맨틱 HTML
- **국제화**: 한국어 전용 (v2 범위)
