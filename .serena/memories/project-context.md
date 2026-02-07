# 독독(DokDok) 프로젝트 컨텍스트

## 개요

- **프로젝트**: 독독 — 개인 독서 기록 웹앱
- **Stack**: Next.js 16 + TypeScript strict + Tailwind CSS v4 + shadcn/ui
- **Backend**: Supabase (project_id: nxofxjputwsgbujbjlus)
- **AI**: Claude Sonnet 4.5 (분석) + Haiku 4.5 (대화)
- **배포**: Vercel
- **디자인**: 채널톡/토스 스타일 — 딥인디고(#4F46E5) + 앰버(#F59E0B)

## 현재 상태 (2026-02-07)

- Phase 0 (리서치 & 설계): 완료
- Phase 1 MVP (Step 0~8): **95%+ 완성**
- Phase 2 (AI V2 + 모임 강화): 구현 완료 (마이그레이션 미적용)
- **UI 전면 개편 완료** (채널톡/토스 스타일)
- 문서 체계 전면 정비 완료
- **P0~P2 작업 전부 완료** (아래 세션 기록 참조)

## UI 디자인 시스템 (2026-02-07 개편)

### 컬러 팔레트

- primary: #4F46E5 (딥 인디고)
- secondary: #EEF2FF (인디고 라이트)
- accent: #F59E0B (앰버 — 별점 전용)
- background: #FFFFFF
- foreground: #111827
- muted: #F9FAFB
- border: #E5E7EB

### 스타일

- 카드 radius: 20px, 버튼/입력: 14px, 뱃지: full
- 버튼 높이: h-12 (default), h-10 (sm), h-14 (lg)
- 입력: borderless, bg-input (#F9FAFB)
- 하단 네비: backdrop-blur-xl, dot 인디케이터
- 주의: accent=앰버이므로 hover에는 muted 사용

## Phase 1 완료된 작업 (2026-02-07 세션)

- **P0 Vercel 배포**: vercel.json 생성 (icn1 서울 리전, 보안 헤더), 빌드 통과
- **P0 빈 상태 UI**: EmptyState 공통 컴포넌트 개선 + 홈/검색/프로필에 적용
- **P1 반응형 검증**: safe-area-inset, 44px 터치 타겟, 5개 파일 수정
- **P1 E2E 테스트**: Playwright 설정 + auth/record/group 3개 시나리오 19개 테스트
- **P2 성능 최적화**: Image sizes/priority/lazy, React.memo, optimizePackageImports, AVIF
- **P2 단위 테스트**: Vitest 설정 + utils 테스트 작성
- **추가**: 하단 네비 AI 아이콘 Bot→Sparkles 변경, typecheck 에러 수정

## 미해결 사항

- **네이버 도서 검색 API 401**: 인증 키 만료 → 카카오 API 전환 권장
- **Phase 2 마이그레이션**: `00004_phase2_enhancement.sql` → Supabase Dashboard 실행 필요
- **타입 재생성**: 마이그레이션 후 `supabase gen types` 필수

## 주요 디렉토리

- `src/app/` — App Router 페이지/API
- `src/components/ui/` — shadcn/ui 컴포넌트 (인디고 테마)
- `src/components/features/` — 비즈니스 컴포넌트
- `src/lib/agent/` — AI 에이전트 모듈
- `src/lib/supabase/` — Supabase 클라이언트
- `docs/` — 설계 문서, PRD, 로드맵

## CRITICAL

- Supabase project_id: nxofxjputwsgbujbjlus 전용
- careguardian 조직 접근 금지
- RLS 필수, 타입 재생성 필수
