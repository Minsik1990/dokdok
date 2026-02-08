# CLAUDE.md

## 프로젝트

**독독 (DokDok)** — 독서를 두드리다. 읽고, 느끼고, 기록하다.
개인 독서 기록이 메인, 독서 모임은 부가 기능. AI는 도구형 에이전트 (캐릭터 없음).

- Stack: Next.js 16 (App Router) + TypeScript strict + Tailwind CSS v4 + shadcn/ui
- Backend: Supabase (PostgreSQL + RLS + Auth Magic Link) | 배포: Vercel
- AI: Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`, 분석/요약) + Haiku 4.5 (`claude-haiku-4-5-20251001`, 대화/질문)
- 인증: 초대 코드 (베타 게이트) → Supabase Auth (이메일 Magic Link)
- 도서 API: 네이버 도서 | 이미지: Supabase Storage

## 명령어

```bash
pnpm dev                    # 개발 서버 (포트 9000)
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

- **Supabase 프로젝트**: project_id `nxofxjputwsgbujbjlus` (독독) 전용
- **careguardian 조직/프로젝트 접근 절대 금지** — 다른 조직의 DB 조회/수정 불가
- **RLS 필수**: 새 테이블에 반드시 RLS 활성화 + 사용자 기반 정책
- **타입 재생성**: DB 변경 후 `supabase gen types` 실행
- **무료 한도**: Supabase 500MB DB, Vercel 100GB 대역폭, 7일 비활성 일시정지 방지
- **AI 비용**: Prompt Caching 필수, 책별 분석 ai_contents 캐싱
- 상세: `docs/research/cost-analysis.md`

## 에러 방지 체크리스트 (CRITICAL)

| #   | 패턴                  | 증상                            | 해결                                              |
| --- | --------------------- | ------------------------------- | ------------------------------------------------- |
| 1   | Supabase RLS 누락     | 데이터 접근 불가 또는 전체 공개 | 새 테이블에 RLS 활성화 + `auth.uid()` 정책        |
| 2   | 타입 미갱신           | TypeScript 컴파일 에러          | DB 변경 후 `supabase gen types` 실행              |
| 3   | 네이버 API Rate Limit | 도서 검색 429 에러              | books 테이블 캐싱 우선, 쓰로틀링 적용             |
| 4   | SSE 스트림 미종료     | AI 응답 무한 로딩               | `stream.ts`에서 try-finally로 반드시 종료         |
| 5   | Magic Link 만료       | 로그인 실패 (10분 초과)         | 사용자에게 재발송 안내, 만료 시간 명시            |
| 6   | Server/Client 혼용    | hydration 에러                  | Server Component 기본, `'use client'` 명시적 분리 |

## 코딩 컨벤션

- 한국어 주석/커밋 (기술 용어는 영어)
- Tailwind 클래스 사용, inline styles 지양
- shadcn/ui 컴포넌트 우선
- 디자인: 스타벅스 그린 테마 — 그린(#00704A) + 앰버(#F59E0B) + 화이트(60-30-10 법칙)
- AI 톤: 따뜻하지만 깔끔한 조력자 (캐릭터/이모지 남발 금지)

## 협업 방식

1인 바이브코딩 기반. 사용자가 요구사항을 전달하면 Claude가 기획/설계/구현/검증을 수행한다.

**큰 작업** (새 기능, 전면 개편, 복잡한 변경):

```
1. 사용자: 요구사항 전달
2. Claude: docs/features/{기능명}/v1-spec.md에 기획서 작성
3. 사용자: 기획서 검토 → 승인/수정 요청
4. Claude: Plan Mode로 구현 계획 수립 → 사용자 승인
5. Claude: 구현 → 검증 (typecheck + lint + build)
6. 사용자: Preview 확인 → 배포 승인
7. 기능 변경 시 → v2-update.md 새 파일 추가 (v1은 수정하지 않음)
```

**작은 작업** (버그 수정, UI 미세 조정): docs/features/ 문서 불필요 → 바로 구현 → 검증

## 개발 프로세스 (5단계)

```
┌─ 0단계: 기획/리서치 (큰 작업 시) ─────────────────────────────────┐
│ ① 사용자 요구사항 수신                                             │
│ ② docs/features/{기능명}/v1-spec.md 기획서 작성                    │
│ ③ 외부 리서치: WebSearch + context7                                 │
│ ④ sequential-thinking으로 다각도 분석 → 사용자에게 선택지 제시     │
│ ⑤ 사용자 승인 대기 (기획서 확정)                                   │
├─ 1단계: 계획 ─────────────────────────────────────────────────────┤
│ ⑥ EnterPlanMode → 코드 탐색 + DB 확인 → 구현 계획 작성            │
│ ⑦ 사용자 승인 대기 (계획 확정)                                     │
├─ 2단계: 구현 ─────────────────────────────────────────────────────┤
│ ⑧ 기존 패턴 따르기 (새 패턴 도입 금지)                             │
│ ⑨ 에러 방지 체크리스트 확인                                        │
├─ 3단계: 검증 (필수, 생략 불가) ───────────────────────────────────┤
│ ⑩ typecheck + lint (병렬)                                           │
│ ⑪ build (백그라운드)                                                │
│ ⑫ Task(code-reviewer) (백그라운드)                                  │
│ ⑬ 빌드 성공 확인 후 완료 보고                                      │
├─ 4단계: 배포 (사용자 요청 시만) ──────────────────────────────────┤
│ ⑭ Preview에서 사용자 확인 → 배포 승인 → push                       │
└────────────────────────────────────────────────────────────────────┘
```

**작은 작업**: 0단계, 1단계 생략 → 바로 구현 → 검증

## AI 도구 자동 적용 규칙

### Sequential Thinking 자동 트리거

| 트리거 조건          | 예시                               |
| -------------------- | ---------------------------------- |
| 새 기능 설계         | 컬렉션, 이미지 업로드 등           |
| 비즈니스 의사결정    | 수익화 모델, 우선순위 판단         |
| 아키텍처 결정        | DB 스키마, API 구조, 상태관리 방식 |
| 트레이드오프 비교    | 2개 이상 접근법 비교가 필요할 때   |
| DB 마이그레이션 설계 | 테이블 추가/변경, RLS 정책         |
| 리서치 결과 종합     | 여러 소스 조사 후 최적안 도출      |

### 에이전트 자동 호출 규칙

| 상황                 | 자동 호출                | 실행 방식      |
| -------------------- | ------------------------ | -------------- |
| 코드베이스 파악 필요 | `Task(Explore)`          | 포그라운드     |
| 구현 계획 수립       | `Task(Plan)`             | 포그라운드     |
| 코드 작성 완료 후    | `Task(code-reviewer)`    | **백그라운드** |
| API/인증 관련        | `Task(security-auditor)` | **백그라운드** |
| 에러/버그 분석       | `Task(debugger)`         | 포그라운드     |

### 리서치/탐색 자동 진행

코드베이스 탐색, 문서 조회, 웹 검색 등 **읽기 전용 작업은 사용자 승인 없이 자동 진행**.
코드 수정, DB 변경, 배포 등 **쓰기 작업만 확인 필요**.

## 의사결정 프레임워크

모든 비자명한 결정에 sequential-thinking 내에서 적용:

```
1. 선택지 나열 (최소 2개)
2. 각 선택지의 장단점 (기술 + 비즈니스 + UX)
3. 프로젝트 맥락에서의 적합성 (기존 패턴, 규모, 일정)
4. 권장안 + 근거
5. 리스크 및 되돌림 가능성
```

## 병렬/백그라운드 실행

**독립적 작업은 항상 병렬로:**

| 작업 조합             | 실행 방법                                     |
| --------------------- | --------------------------------------------- |
| typecheck + lint      | Bash 2개 동시 호출                            |
| 코드 탐색 + DB 확인   | `Task(Explore)` + DB 조회 동시                |
| 코드 리뷰 + 다음 작업 | `Task(code-reviewer, background)` + 코딩 계속 |

**백그라운드 실행 (3분+ 소요 작업):**

| 작업                  | 방법                            |
| --------------------- | ------------------------------- |
| 빌드                  | `Bash(run_in_background: true)` |
| 테스트                | `Bash(run_in_background: true)` |
| `Task(code-reviewer)` | `Task(run_in_background: true)` |

## MCP 도구 티어

### Tier 1 - 핵심 (매 작업마다 사용)

| MCP                 | 용도                  | 자동 사용 조건            |
| ------------------- | --------------------- | ------------------------- |
| serena              | 코드 분석/심볼릭 편집 | 코드 탐색 시 항상         |
| sequential-thinking | 의사결정/분석         | 6가지 트리거 조건 해당 시 |
| context7            | 라이브러리 문서       | 새 라이브러리/API 사용 시 |

### Tier 2 - 활용 (해당 작업 시 적극 사용)

| MCP             | 용도                      | 사용 시점                                            |
| --------------- | ------------------------- | ---------------------------------------------------- |
| supabase        | DB 조회/마이그레이션      | DB 관련 작업 시 (project_id: `nxofxjputwsgbujbjlus`) |
| chrome-devtools | 브라우저 디버깅, 스크린샷 | UI 확인 시                                           |
| playwright      | E2E 자동화                | 브라우저 도구 불가 시                                |

### Tier 3 - 필요 시

| MCP              | 용도            | 사용 시점           |
| ---------------- | --------------- | ------------------- |
| claude-in-chrome | 브라우저 자동화 | 복잡한 UI 테스트 시 |

## 문서

| 문서                                    | 내용                           |
| --------------------------------------- | ------------------------------ |
| `docs/PRD-v2.md`                        | v2 전체 PRD                    |
| `docs/planning/project-status.md`       | 진행 현황 종합 대시보드        |
| `docs/planning/user-scenarios.md`       | 상세 유저 시나리오             |
| `docs/planning/user-flows.md`           | 유저 플로우 (Mermaid)          |
| `docs/planning/business-model.md`       | 비즈니스 모델, 수익화, KPI     |
| `docs/design/TRD.md`                    | 기술 요구사항                  |
| `docs/design/ui-ux.md`                  | 독독 디자인 시스템             |
| `docs/design/database-schema.md`        | DB 스키마 + RLS 정책           |
| `docs/design/architecture.md`           | 라우팅, 컴포넌트, 데이터 흐름  |
| `docs/design/api-design.md`             | API Routes, AI 에이전트 API    |
| `docs/development/roadmap.md`           | Phase별 체크리스트             |
| `docs/features/{기능명}/v1-spec.md`     | 기능별 스펙 (큰 작업 시 작성)  |
| `docs/research/dev-methodology-2026.md` | PRD 템플릿, CI/CD, 테스트 전략 |
