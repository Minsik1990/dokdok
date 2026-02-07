# Chaekdam 프로젝트 문서

> **책담 (Chaekdam)** -- 나의 독서 기록. 읽고, 느끼고, 기록하다.
>
> 개인 독서 기록이 메인이며, 독서 모임은 부가 기능으로 제공하는 웹앱.
> AI 에이전트가 요약, 토론 주제, 발제문 초안 등을 도구 형태로 지원.

---

## 문서 인덱스

### PRD

| 문서                   | 설명                                                   |
| ---------------------- | ------------------------------------------------------ |
| [PRD-v2.md](PRD-v2.md) | v2 전체 PRD (기능, 인수 기준, 테스트 전략, Phase 분리) |

### research/ -- 리서치

| 문서                                                        | 설명                             |
| ----------------------------------------------------------- | -------------------------------- |
| [market-analysis.md](research/market-analysis.md)           | 시장 분석 & 경쟁 서비스          |
| [cost-analysis.md](research/cost-analysis.md)               | 비용 분석 (무료 운영 전략)       |
| [success-cases.md](research/success-cases.md)               | 성공 사례 분석                   |
| [tech-stack.md](research/tech-stack.md)                     | 기술 스택 & 도구                 |
| [dev-methodology-2026.md](research/dev-methodology-2026.md) | AI-First 개발 방법론, PRD 템플릿 |

### design/ -- 설계

| 문서                                            | 설명                                                |
| ----------------------------------------------- | --------------------------------------------------- |
| [architecture.md](design/architecture.md)       | 아키텍처, 프로젝트 구조, 데이터 흐름                |
| [database-schema.md](design/database-schema.md) | DB 스키마 (12개 테이블, RLS 정책)                   |
| [api-design.md](design/api-design.md)           | API 설계 (네이버 도서, AI 에이전트, 장애 대응)      |
| [ui-ux.md](design/ui-ux.md)                     | UI/UX 디자인 시스템 (따뜻한 토스 스타일, 코랄 테마) |

### development/ -- 개발

| 문서                                     | 설명                                 |
| ---------------------------------------- | ------------------------------------ |
| [roadmap.md](development/roadmap.md)     | Phase별 로드맵 & Step 0~8 체크리스트 |
| [changelog.md](development/changelog.md) | 버전별 변경 기록                     |
| [decisions.md](development/decisions.md) | 기술 결정 기록 (ADR-001 ~ ADR-013)   |

### guides/ -- 가이드

| 문서                                  | 설명                                         |
| ------------------------------------- | -------------------------------------------- |
| [setup.md](guides/setup.md)           | 프로젝트 셋업 가이드 (Magic Link, 환경 변수) |
| [deployment.md](guides/deployment.md) | 배포 가이드 (Vercel + Supabase)              |

---

## 핵심 기술 스택

```
Frontend:   Next.js 15 (App Router) + TypeScript strict + Tailwind CSS v4
UI:         shadcn/ui + Radix UI + Lucide Icons
Backend:    Supabase (PostgreSQL + Auth Magic Link + Storage)
AI:         Claude Sonnet 4.5 (Anthropic API)
도서 API:   네이버 도서 검색 API
배포:       Vercel (Hobby) + GitHub Actions
Font:       Pretendard
```

---

## v2 핵심 변경 (v1 대비)

| 항목        | v1                             | v2                                |
| ----------- | ------------------------------ | --------------------------------- |
| 서비스 핵심 | 독서 모임                      | 개인 독서 기록                    |
| 인증        | 초대 코드 + 쿠키               | Magic Link (이메일)               |
| 디자인      | 밍들레씨 테마 (그린/노랑/핑크) | 따뜻한 토스 스타일 (코랄 #F4845F) |
| AI 에이전트 | 캐릭터 페르소나 "밍들레"       | 도구형 조력자 (캐릭터 없음)       |
| 이미지 저장 | Cloudflare R2                  | Supabase Storage                  |
| 도서 API    | 네이버 + 알라딘 + 정보나루     | 네이버 (1개만)                    |

---

## 버전 관리

| 버전           | 설명                     | 날짜       |
| -------------- | ------------------------ | ---------- |
| **v2.0-alpha** | v2 설계 & 문서 전면 개편 | 2026-02-07 |
| **v1.0.2**     | 개발 환경 & 방법론 확립  | 2026-02-07 |
| **v1.0.1**     | 밍들레씨 캐릭터 통합     | 2026-02-07 |
| **v1.0**       | 초기 리서치 & 문서화     | 2026-02-07 |
| v2.0-beta      | Phase 1 MVP 개발         | 예정       |
| v2.0           | Phase 1 MVP 출시         | 예정       |
| v2.1           | Phase 2 확장             | 예정       |
| v3.0           | Phase 3 고도화           | 예정       |

자세한 변경 내역은 [changelog.md](development/changelog.md)를 참고하세요.

---

## 문서 관리 원칙

1. **roadmap.md**: 항상 최신 상태 유지 (완료 항목 `[x]` 표시)
2. **changelog.md**: 버전별 주요 변경사항 기록
3. **decisions.md**: 기술 결정과 근거 기록
4. **나머지 문서**: 필요할 때 직접 수정 (Git이 이력 보관)
5. **Git tag**: 버전 마일스톤에 `git tag v2.0-alpha` 등으로 태그
