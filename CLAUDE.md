# CLAUDE.md

## 프로젝트

**책담 (Chaekdam)** — 나의 독서 기록. 읽고, 느끼고, 기록하다.
책을 담다. 개인 독서 기록이 메인, 독서 모임은 부가 기능. AI는 도구형 에이전트 (캐릭터 없음).

- Stack: Next.js 16 (App Router) + TypeScript strict + Tailwind CSS v4 + shadcn/ui
- Backend: Supabase (PostgreSQL + RLS + Auth Magic Link) | 배포: Vercel
- AI: Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`, 분석/요약) + Haiku 4.5 (`claude-haiku-4-5-20251001`, 대화/질문)
- 인증: 초대 코드 (베타 게이트) → Supabase Auth (이메일 Magic Link)
- 도서 API: 네이버 도서 | 이미지: Supabase Storage

## 명령어

```bash
pnpm dev                    # 개발 서버
pnpm build                  # 프로덕션 빌드
pnpm lint && pnpm typecheck # 커밋 전 필수 검증
pnpm test                   # Vitest
pnpm test:e2e               # Playwright E2E
npx supabase gen types typescript --local > src/lib/supabase/database.types.ts  # DB 변경 후 필수
```

## 아키텍처 핵심

- Server Components 기본, 'use client'는 필요 시만
- Supabase 클라이언트: `@/lib/supabase/client` (브라우저) / `server` (서버)
- 인증: Supabase Auth → 미들웨어에서 세션 체크 → profiles 테이블
- 도서 검색: API → books 테이블 캐싱 (Rate Limit 방지)
- AI 에이전트: `src/lib/agent/` 공통 모듈 → API Routes → SSE 스트리밍
- 하단 탭: 홈(내 기록) | 검색 | + 기록 | 모임 | 프로필
- 상세: `docs/design/architecture.md`, `docs/design/database-schema.md`

## CRITICAL 제약

- **Supabase 프로젝트**: project_id `nxofxjputwsgbujbjlus` (책담) 전용
- **careguardian 조직/프로젝트 접근 절대 금지** — 다른 조직의 DB 조회/수정 불가
- **RLS 필수**: 새 테이블에 반드시 RLS 활성화 + 사용자 기반 정책
- **타입 재생성**: DB 변경 후 `supabase gen types` 실행
- **무료 한도**: Supabase 500MB DB, Vercel 100GB 대역폭, 7일 비활성 일시정지 방지
- **AI 비용**: Prompt Caching 필수, 책별 분석 ai_contents 캐싱
- 상세: `docs/research/cost-analysis.md`

## 코딩 컨벤션

- 한국어 주석/커밋 (기술 용어는 영어)
- Tailwind 클래스 사용, inline styles 지양
- shadcn/ui 컴포넌트 우선
- 디자인: 따뜻한 토스 스타일 — 코랄(#F4845F) + 앰버(#FFB74D) + 화이트(#FAFAFA)
- AI 톤: 따뜻하지만 깔끔한 조력자 (캐릭터/이모지 남발 금지)

## 개발 프로세스 (Spec-Driven)

```
Explore → Plan → Implement → Verify → Commit
```

1. **Explore**: Plan Mode에서 코드 읽기, 기존 패턴 파악
2. **Plan**: PRD 작성/확인 → 구현 계획 → 복잡한 결정은 sequential-thinking
3. **Implement**: 한 번에 하나의 함수/기능, 기존 패턴 따르기
4. **Verify**: `pnpm typecheck && pnpm lint && pnpm build`
5. **Commit**: 설명적 메시지, /clear 후 다음 기능

## MCP 활용

| 작업        | 우선 도구                                                                        |
| ----------- | -------------------------------------------------------------------------------- |
| DB 작업     | `mcp__supabase__execute_sql`, `list_tables` (project_id: `nxofxjputwsgbujbjlus`) |
| 문서 조회   | `mcp__context7__query-docs`                                                      |
| 복잡한 결정 | `mcp__sequential-thinking__sequentialthinking`                                   |
| 코드 분석   | `mcp__serena__find_symbol`, `get_symbols_overview`                               |
| UI 검증     | `mcp__chrome-devtools__*` 또는 `mcp__playwright__*`                              |

## 문서

| 문서                                    | 내용                           |
| --------------------------------------- | ------------------------------ |
| `docs/PRD-v2.md`                        | v2 전체 PRD                    |
| `docs/design/ui-ux.md`                  | 따뜻한 토스 디자인 시스템      |
| `docs/design/database-schema.md`        | DB 스키마 + RLS 정책           |
| `docs/design/architecture.md`           | 라우팅, 컴포넌트, 데이터 흐름  |
| `docs/design/api-design.md`             | API Routes, AI 에이전트 API    |
| `docs/development/roadmap.md`           | Phase별 체크리스트             |
| `docs/research/dev-methodology-2026.md` | PRD 템플릿, CI/CD, 테스트 전략 |
