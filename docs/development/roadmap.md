# 개발 로드맵

> 최종 업데이트: 2026-02-07 (v2.0)
> v2 전면 개편: 개인 기록 중심 MVP
> 이 문서는 항상 최신 상태를 유지합니다. 완료된 항목은 `[x]`로 표시합니다.

---

## Phase 0 -- 리서치 & 설계

- [x] 시장 분석 & 경쟁 서비스 리서치
- [x] 비용 분석 (무료 운영 전략)
- [x] 성공 사례 분석
- [x] 기술 스택 확정
- [x] 아키텍처 설계
- [x] DB 스키마 초안
- [x] API 연동 설계
- [x] UI/UX 방향 설정
- [x] docs/ 문서 체계 구축
- [x] Git 초기화 + 첫 커밋
- [x] v2 전면 개편 설계 (PRD-v2, 문서 업데이트)

---

## Phase 1 -- MVP (Step 0~8)

### Step 0: 프로젝트 셋업

- [x] Next.js 16 + TypeScript + Tailwind CSS v4 + pnpm 초기화
- [x] shadcn/ui 초기화 (코랄 테마 커스텀)
- [x] Pretendard 폰트 설정
- [x] Supabase 프로젝트 생성 + 로컬 개발 환경
- [x] 환경 변수 설정 (.env.local)
- [x] ESLint + Prettier 설정
- [x] 프로젝트 폴더 구조 생성

### Step 1: 인증 + 온보딩

- [x] Supabase Auth Magic Link 설정
- [x] invite_codes 테이블 + RLS
- [x] profiles 테이블 + 자동 생성 트리거
- [x] /login 페이지 (초대 코드 -> 이메일)
- [x] /api/auth/callback (Magic Link 콜백)
- [x] /api/invite/verify (초대 코드 검증)
- [x] /onboarding 페이지 (닉네임 설정)
- [x] middleware.ts (미인증 리다이렉트)

### Step 2: 도서 검색

- [x] books 테이블 + RLS
- [x] /api/books/search (네이버 API 프록시 + 캐싱)
- [x] BookSearch 컴포넌트 (검색 입력 + 결과 리스트)
- [x] 검색 결과 -> books 테이블 캐싱

### Step 3: 개인 기록

- [x] records 테이블 + RLS
- [x] RecordCard 컴포넌트
- [x] RecordForm 컴포넌트
- [x] StarRating 컴포넌트
- [x] StatusBadge 컴포넌트
- [x] 기록 CRUD Server Actions
- [x] /(main)/record/new 페이지
- [x] /(main)/record/[id] 페이지 (상세)
- [x] /(main)/record/[id]/edit 페이지 (수정)

### Step 4: 하단 탭 + 레이아웃

- [x] BottomNav 컴포넌트 (5개 탭 + safe-area)
- [x] (main) 레이아웃 (max-width: 480px + BottomNav)
- [x] /(main)/home 페이지 (최근 기록 + 통계)
- [x] /(main)/search 페이지 (도서 검색)
- [x] /(main)/profile 페이지 (내 기록 전체)

### Step 5: AI 에이전트

- [x] agent_conversations 테이블 + RLS
- [x] ai_contents 테이블 + RLS
- [x] src/lib/agent/ 모듈 (client, prompts, stream, cache, types)
- [x] /api/agent/interview (대화형 기록)
- [x] /api/agent/summarize (요약)
- [x] /api/agent/topics (토론 주제)
- [x] /api/agent/draft (발제문 초안)
- [x] /api/agent/analysis (도서 분석 + 캐시 저장)
- [x] InterviewChat 컴포넌트
- [x] AgentPanel 컴포넌트

### Step 6: 독서 모임

- [x] reading_groups 테이블 + RLS
- [x] group_members 테이블 + RLS
- [x] sessions 테이블 + RLS
- [x] session_reviews 테이블 + RLS
- [x] /(main)/groups 페이지 (모임 목록)
- [x] /(main)/groups/new 페이지 (모임 생성)
- [x] /(main)/groups/[id] 페이지 (모임 상세)
- [x] /(main)/groups/[id]/sessions/[sessionId] 페이지 (세션 상세)
- [x] 모임 가입 (초대 코드)
- [x] 세션 후기 작성

### Step 7: 배포 + CI/CD

- [ ] Vercel 배포 설정 (환경 변수 포함)
- [x] GitHub Actions CI (lint, typecheck, build)
- [x] Supabase Keep-Alive cron (3일마다)
- [ ] 기본 E2E 테스트 (Playwright)

### Step 8: 마무리 + QA

- [ ] 반응형 검증 (480px 기준)
- [ ] 빈 상태(empty state) UI 전체 점검
- [x] 로딩 상태(skeleton) UI 전체 점검
- [x] 에러 핸들링 전체 점검 (에러 바운더리 + 404)
- [ ] 성능 최적화 (이미지, 번들, 폰트)
- [x] 접근성 기본 (StarRating aria-label, BottomNav aria-current)

---

## Phase 2 -- 확장

- [ ] 컬렉션 기능 (collections, collection_records 활성화)
- [ ] AI 고도화
  - [ ] /api/agent/suggest-questions (토론 질문 추천)
  - [ ] /api/agent/recommend (도서 추천)
  - [ ] /api/agent/insight (독서 인사이트)
- [ ] 이미지 업로드 (Supabase Storage)
- [ ] 독서 통계 대시보드
- [ ] 모임 초대 링크 개선 (딥링크)

---

## Phase 3 -- 고도화

- [ ] 소셜 기능 (팔로우, 공개 기록 피드)
- [ ] PWA 지원
- [ ] 알림 (이메일 / 푸시)
- [ ] OAuth 추가 (카카오, 구글)
- [ ] Supabase Realtime 실시간 토론
- [ ] 독서 챌린지 / 게이미피케이션

---

## 마일스톤 요약

| 버전           | 목표                   | 상태    |
| -------------- | ---------------------- | ------- |
| **v1.0**       | 리서치 & 문서화        | 완료    |
| **v2.0-alpha** | v2 설계 & 문서 개편    | 완료    |
| **v2.0-beta**  | Phase 1 MVP (Step 0~8) | 진행 중 |
| **v2.0**       | Phase 1 MVP 출시       | 예정    |
| **v2.1**       | Phase 2 확장           | 예정    |
| **v3.0**       | Phase 3 고도화         | 예정    |
