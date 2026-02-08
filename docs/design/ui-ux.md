# UI/UX 디자인 시스템

> 최종 업데이트: 2026-02-08 (v3.0)
> v3 전면 개편: 독서 모임 기록 전용 + 스타벅스 그린 테마

---

## 1. 디자인 철학

### 핵심 키워드

- **깔끔한 (Clean)**: 화이트 도미넌트, 여백 충분, 미니멀
- **자연적 (Natural)**: 스타벅스 그린 포인트, 앰버 액센트, 부드러운 모서리
- **직관적 (Intuitive)**: 상단 4탭 + FAB, 한 손 조작 최적화
- **모바일 퍼스트 (Mobile-First)**: 480px 기준, 라이트 모드 전용

### 60-30-10 컬러 법칙 (스타벅스 앱 참고)

- **60% White** — 배경 캔버스 (카드, 바디, 팝오버)
- **30% Green** — 브랜드 터치포인트 (CTA 버튼, 아이콘, 뱃지, 링크)
- **10% Amber + Black** — 강조, 별점, 텍스트

---

## 2. 색상 팔레트

### Core Colors

```
background:          #FFFFFF    (앱 배경)
card:                #FFFFFF    (카드/서피스)
foreground:          #111827    (기본 텍스트)
muted:               #F9FAFB    (배경 서브)
muted-foreground:    #6B7280    (보조 텍스트)
border:              #E5E7EB    (테두리)
input:               #F9FAFB    (입력 필드 배경)
```

### Brand Colors

```
primary:             #00704A    (스타벅스 그린 — CTA, 아이콘, 링크)
primary-foreground:  #FFFFFF
secondary:           #ecfdf5    (연한 민트그린 — 호버, 선택 배경)
secondary-foreground:#14532d    (다크 그린 — secondary 위 텍스트)
accent:              #F59E0B    (앰버 — FAB, 하이라이트)
accent-foreground:   #78350F
```

### Semantic Colors

```
destructive:         #EF4444    (삭제, 에러)
success:             #10B981    (성공 상태)
ring:                #00704A    (포커스 링 = primary)
```

### Chart Colors

```
chart-1:             #00704A    (primary 그린)
chart-2:             #F59E0B    (앰버)
chart-3:             #3B82F6    (블루)
chart-4:             #8B5CF6    (퍼플)
chart-5:             #EC4899    (핑크)
```

---

## 3. 타이포그래피

### 폰트

- **기본**: Pretendard Variable (한글 + 영문 + 숫자)
- **대체**: system-ui, -apple-system

### 사이즈 체계

| 용도          | 크기    | 굵기           | Tailwind                    |
| ------------- | ------- | -------------- | --------------------------- |
| Page Title    | 18-22px | Bold (700)     | text-lg ~ text-xl font-bold |
| Section Title | 14px    | SemiBold (600) | text-sm font-semibold       |
| Body          | 14px    | Regular (400)  | text-sm                     |
| Caption       | 12px    | Regular (400)  | text-xs                     |

---

## 4. 레이아웃

### 모바일 퍼스트 컨테이너

```
max-width:     480px
padding:       16px (좌우)
margin:        0 auto (데스크톱 중앙 정렬)
```

### 모서리 반경 (radius)

```
카드/패널:     20px (rounded-[20px])
버튼/입력:     14px (rounded-[14px])
뱃지/태그:     full (rounded-full)
아바타:        full (rounded-full)
```

### 상단 탭 네비게이션

```
탭 개수:       4개 (책장 / 타임라인 / 읽고싶은책 / 프로필)
위치:          상단 (sticky)
배경:          bg-white/80 backdrop-blur-xl
활성 탭:       border-b-2 border-primary text-primary
비활성 탭:     text-muted-foreground
```

### FAB (Floating Action Button)

```
위치:          우측 하단 fixed (bottom-6 right-6)
크기:          h-14 w-14
배경:          bg-accent (#F59E0B 앰버)
아이콘:        Plus (white)
모서리:        rounded-full
그림자:        shadow-lg
```

### 헤더

```
구성:          [독독로고] | [모임명]  [설정]
배경:          bg-white/80 backdrop-blur-xl
위치:          sticky top-0 z-50
```

### 페이지 구조

```
┌─────────────────────────┐
│       Status Bar        │
├─────────────────────────┤
│  [로고] | [모임명] [⚙️]  │  ← 헤더 (sticky)
├─────────────────────────┤
│ 책장  타임라인  읽고싶은책  프로필 │  ← 탭 (sticky)
├─────────────────────────┤
│                         │
│      Main Content       │
│    (스크롤 가능 영역)     │
│                         │
│                    [+]  │  ← FAB
└─────────────────────────┘
```

---

## 5. 컴포넌트 스타일

### 카드

```
배경:          #FFFFFF (bg-card)
모서리:        20px (rounded-[20px])
패딩:          16px (p-4)
그림자:        shadow-sm
주의:          CardContent에 pt-6 추가 금지 (Card py-6과 이중 패딩)
```

### 버튼

```
Primary:     배경 #00704A, 텍스트 #FFFFFF, rounded-[14px], h-12
Secondary:   배경 #ecfdf5, 텍스트 #14532d, rounded-[14px], h-12
Ghost:       배경 transparent, 호버 muted, rounded-[14px]
Destructive: 배경 #EF4444, 텍스트 #FFFFFF, rounded-[14px]
터치 타겟:   최소 h-9 w-9 (36px), 삭제/설정 h-10 (40px)
```

### 입력 필드

```
배경:          #F9FAFB (bg-input)
테두리:        없음 (border-0, borderless)
모서리:        14px (rounded-[14px])
높이:          h-12
플레이스홀더:  text-muted-foreground
정렬:          좌측 정렬 (text-center 지양 — 모바일 커서 위치 혼란)
```

### 뱃지 (Badge)

```
모서리:        rounded-full
variant:
  default   — bg-primary text-primary-foreground
  secondary — bg-secondary text-secondary-foreground
```

### 삭제 확인 (AlertDialog)

```
모든 삭제 작업:  AlertDialog 통일 (세션/위시리스트/멤버/댓글)
제목:            "정말 삭제하시겠습니까?"
취소:            Secondary 버튼
확인:            Destructive 버튼
```

---

## 6. UI 라이브러리

| 용도     | 선택         | 비고                             |
| -------- | ------------ | -------------------------------- |
| 컴포넌트 | shadcn/ui    | 커스터마이징 자유, Radix UI 기반 |
| 아이콘   | Lucide Icons | 부드러운 라인 아이콘             |
| 차트     | Recharts     | 발제자 통계, 연간 모임 차트      |

---

## 7. 핵심 뷰 (V3)

### 7.1 접속 페이지 (/)

- 서비스 로고 + "독서를 두드리다" 카피
- 모임 이름 입력
- 접속 코드 입력
- 접속 버튼 (primary 그린)

### 7.2 책장 (/club/[id])

- 세션 카드 그리드 (책 표지 + 제목 + 날짜)
- 빈 상태: "아직 모임 기록이 없어요"
- FAB: 새 모임 기록 작성

### 7.3 타임라인 (/club/[id]/timeline)

- 세로 타임라인 (날짜 + 책 + 발제자)
- 모임 회차 자동 계산

### 7.4 읽고 싶은 책 (/club/[id]/wishlist)

- 위시리스트 카드 (책 표지 + 제목 + 저자)
- 카카오 도서 검색 → 추가
- 댓글 기능

### 7.5 프로필 (/club/[id]/profile)

- 모임 통계 (총 모임, 발제 횟수, 참여율)
- 발제자 통계 차트 (수평 막대)
- 연간 모임 차트
- 멤버 관리

### 7.6 세션 상세 (/club/[id]/session/[sid])

- 책 정보 (표지 + 제목 + 저자)
- 모임 정보 (회차, 날짜, 발제자, 참여자)
- 발제문, 모임 내용
- 사진 갤러리 (Lightbox + 스와이프)
- 댓글

---

## 8. 빈 상태 (Empty State)

| 상황            | 메시지                        | 서브 텍스트                      |
| --------------- | ----------------------------- | -------------------------------- |
| 세션 없음       | "아직 모임 기록이 없어요"     | "첫 모임 기록을 남겨보세요"      |
| 위시리스트 없음 | "읽고 싶은 책을 추가해보세요" | "책을 검색해서 추가할 수 있어요" |
| 댓글 없음       | "아직 댓글이 없어요"          | "첫 댓글을 남겨보세요"           |

---

## 9. 접근성

- shadcn/ui + Radix UI 기본 접근성 지원
- 키보드 네비게이션 (Tab, Enter, Escape)
- WCAG AA 색상 대비 (스타벅스 그린 #00704A on white: 5.92:1)
- 스크린 리더 지원 (시맨틱 HTML, aria-label)
- 포커스 링: ring-primary (#00704A)
- 가로 스크롤 방지: html/body overflow-x-hidden, 텍스트 break-words
- 터치 타겟: 최소 36px (h-9 w-9)
- 다크 모드: 지원하지 않음
