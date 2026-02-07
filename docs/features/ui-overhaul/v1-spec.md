# UI 전면 개편 — 채널톡/토스 스타일

> 작성일: 2026-02-07
> 상태: 기획 (사용자 승인 대기)

---

## 1. 개요

### 배경

현재 독독은 포레스트그린(#2D6A4F) + 크래프트베이지(#C9A96E) 테마로, 자연적/독서 느낌의 디자인을 사용 중.
사용자가 **채널톡 + 토스/카카오 스타일**의 모던한 UI로 전면 개편을 요청.

### 목표

- **채널톡**: 인디고/바이올렛 컬러 시스템, 큰 radius, 넉넉한 여백
- **토스**: 미니멀 레이아웃, 타이포그래피 중심, flat design
- **독독 정체성**: 따뜻한 독서 감성 (앰버 accent, 파스텔 카드)

### 변경 범위

- 컬러 팔레트 전면 교체 (포레스트그린 → 딥 인디고)
- UI 컴포넌트 스타일 업데이트 (radius, 높이, 여백)
- 전체 페이지 디자인 개편 (14개 페이지)
- Empty State, Loading State 추가
- 기능 로직은 변경 없음 (UI only)

---

## 2. 새 디자인 시스템

### 2.1 컬러 팔레트

#### Core Colors

| 토큰                     | 값        | 용도                 |
| ------------------------ | --------- | -------------------- |
| `background`             | `#FFFFFF` | 앱 배경              |
| `surface` / `muted` (bg) | `#F9FAFB` | 섹션 배경, 입력 필드 |
| `foreground`             | `#111827` | 기본 텍스트          |
| `muted-foreground`       | `#6B7280` | 보조 텍스트          |
| `border`                 | `#E5E7EB` | 테두리               |
| `card`                   | `#FFFFFF` | 카드 배경            |
| `input`                  | `#F9FAFB` | 입력 필드 배경       |

#### Brand Colors

| 토큰                   | 값        | 용도                       |
| ---------------------- | --------- | -------------------------- |
| `primary`              | `#4F46E5` | CTA, 활성 탭, 포커스 링    |
| `primary-foreground`   | `#FFFFFF` | Primary 위 텍스트          |
| `secondary`            | `#EEF2FF` | 태그, 선택 배경, 연한 강조 |
| `secondary-foreground` | `#3730A3` | Secondary 위 텍스트        |

#### Semantic Colors

| 토큰                | 값        | 용도             |
| ------------------- | --------- | ---------------- |
| `accent`            | `#F59E0B` | 별점, 하이라이트 |
| `accent-foreground` | `#78350F` | Accent 위 텍스트 |
| `success`           | `#10B981` | 완독, 성공       |
| `destructive`       | `#EF4444` | 삭제, 에러       |
| `ring`              | `#4F46E5` | 포커스 링        |

#### Record Card 배경색 (파스텔)

| 이름       | 값        | 기존 DB 매핑         |
| ---------- | --------- | -------------------- |
| `white`    | `#FFFFFF` | white                |
| `lavender` | `#F0EEFF` | parchment → lavender |
| `mint`     | `#ECFDF5` | sage → mint          |
| `peach`    | `#FFF7ED` | linen → peach        |
| `sky`      | `#EFF6FF` | moss → sky           |
| `lemon`    | `#FEFCE8` | sand → lemon         |
| `rose`     | `#FFF1F2` | mist → rose          |

### 2.2 타이포그래피

| 용도          | 크기 | 굵기           | 자간    | 행간 |
| ------------- | ---- | -------------- | ------- | ---- |
| Page Title    | 24px | Bold (700)     | -0.02em | 1.3  |
| Section Title | 17px | SemiBold (600) | -0.01em | 1.4  |
| Body          | 15px | Regular (400)  | normal  | 1.6  |
| Caption       | 13px | Regular (400)  | normal  | 1.4  |
| Small         | 12px | Medium (500)   | normal  | 1.4  |

### 2.3 모서리 반경

| 요소       | 값           |
| ---------- | ------------ |
| 카드/패널  | 20px         |
| 버튼/입력  | 14px         |
| 뱃지/태그  | 999px (full) |
| 아바타     | 50% (full)   |
| 다이얼로그 | 24px         |

### 2.4 그림자

| 요소       | 값                            |
| ---------- | ----------------------------- |
| 카드       | 없음 (border로 구분)          |
| 호버 카드  | `0 2px 8px rgba(0,0,0,0.04)`  |
| 다이얼로그 | `0 8px 30px rgba(0,0,0,0.12)` |
| 하단 네비  | border-top만                  |

---

## 3. 컴포넌트 스타일

### 3.1 버튼

```
default:  h-12 bg-primary text-white rounded-[14px] font-semibold text-[15px]
secondary: h-12 bg-secondary text-primary rounded-[14px] font-medium
outline:  h-12 border-border text-foreground rounded-[14px]
ghost:    h-12 text-muted-foreground hover:bg-muted rounded-[14px]
sm:       h-10 rounded-[12px] text-[14px]
lg:       h-14 rounded-[16px] text-[16px]
```

### 3.2 입력 필드

```
h-12 bg-[#F9FAFB] border-none rounded-[14px] text-[15px]
focus: bg-white border-2 border-primary
placeholder: text-[#9CA3AF]
```

### 3.3 카드

```
bg-white rounded-[20px] border border-border p-5
hover: shadow-sm transition-shadow
```

### 3.4 하단 네비게이션

```
h-14 bg-white/95 backdrop-blur-lg border-t border-border
활성: text-primary + 2px dot 인디케이터
비활성: text-[#9CA3AF]
+기록: primary 색상, 약간 크게 (28px)
```

### 3.5 별점

```
활성: text-amber-400 fill-amber-400  (#FBBF24)
비활성: text-gray-200 fill-none
```

### 3.6 상태 배지

```
읽는 중: bg-[#EEF2FF] text-[#4F46E5] (인디고)
완독:   bg-[#ECFDF5] text-[#10B981] (에메랄드)
읽고 싶은: bg-[#FFFBEB] text-[#F59E0B] (앰버)
```

---

## 4. 페이지별 디자인

### 4.1 로그인 (/login)

- 전체 화면 중앙 정렬
- "독독" 로고 (24px bold, primary 색상)
- 서브카피: "독서를 두드리다" (15px, muted)
- 이메일 입력 (borderless, surface 배경)
- CTA 버튼: "로그인 링크 받기" (primary, full-width)
- 깔끔한 여백, 카드 없이 직접 배치 (토스 스타일)

### 4.2 온보딩 (/onboarding)

- 로그인과 동일한 레이아웃
- "어떻게 불러드릴까요?" 카피
- 닉네임 입력 필드

### 4.3 홈 (/)

- 인사: "OOO님의 서재" (24px bold)
- 통계 카드: 읽는 중 / 완독 / 읽고 싶은 (3열 그리드, surface 배경)
- 기록 리스트: RecordCard 세로 나열 (space-y-3)
- 빈 상태: 일러스트 + "첫 번째 기록을 남겨보세요" + CTA

### 4.4 검색 (/search)

- 상단 검색 바 (borderless, 돋보기 아이콘 내장)
- 결과 리스트: 책 표지 + 제목/저자/출판사
- 빈 상태: "읽은 책을 검색해보세요"

### 4.5 새 기록 (/record/new)

- 단계적 폼 (토스 스타일: 한 화면에 깔끔하게)
- 책 선택 카드 / 상태 선택 칩 / 별점 / 감상 / 인용

### 4.6 기록 상세 (/record/[id])

- 책 표지 크게 + 제목/저자
- 감상/인용 섹션 (카드형)
- AI 패널 (하단)

### 4.7 모임 (/groups)

- 내 모임 리스트 (카드형)
- 빈 상태: "독서 모임을 시작해보세요"

### 4.8 프로필 (/profile)

- 아바타 + 닉네임 (중앙 정렬)
- 통계 카드 (완독/읽는 중/읽고 싶은)
- 평균 별점
- 로그아웃 버튼

---

## 5. 추가 기능 (서비스 완성)

### 5.1 Empty State 컴포넌트

- 공통 EmptyState 컴포넌트
- 아이콘 + 제목 + 설명 + CTA 버튼

### 5.2 Loading State

- 기존 loading.tsx에 스켈레톤 UI 적용
- 기록 카드 스켈레톤
- 프로필 스켈레톤

### 5.3 에러 상태

- error.tsx 디자인 개선
- not-found.tsx 디자인 개선

---

## 6. 변경하지 않는 것

- 데이터 로직 (Supabase 쿼리, API Routes)
- 인증 플로우 (Magic Link, 초대 코드)
- AI 에이전트 로직 (SSE 스트리밍)
- 라우팅 구조 (App Router 경로)
- DB 스키마 (card_color 필드의 값 매핑만 변경)

---

## 7. 구현 순서

| 단계 | 작업                            | 파일 수 |
| ---- | ------------------------------- | ------- |
| 1    | globals.css 컬러/변수 교체      | 1       |
| 2    | shadcn/ui 컴포넌트 업데이트     | 6~8     |
| 3    | 피처 컴포넌트 업데이트          | 7       |
| 4    | 페이지 UI 개편                  | 14+     |
| 5    | Empty/Loading/Error State       | 4~5     |
| 6    | 검증 (typecheck + lint + build) | -       |

---

## 8. 기술적 고려사항

- **Record card_color 매핑**: DB의 기존 값(parchment, sage 등)을 새 컬러로 매핑. DB 변경 불필요.
- **shadcn/ui CSS 변수**: globals.css의 변수만 바꾸면 컴포넌트가 자동 반영됨
- **Tailwind v4**: CSS 변수 기반이므로 @theme 블록에서 커스텀 컬러 정의
- **하위 호환**: 기존 `text-primary`, `bg-secondary` 등 Tailwind 클래스가 새 값을 자동 참조
