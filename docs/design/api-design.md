# API 설계

> 최종 업데이트: 2026-02-07 (v2.0)
> v2 개편: Magic Link 인증, 도구형 AI 에이전트, /api/agent/chat 삭제

---

## 1. API 개요

```
┌──────────────┐
│  네이버 도서  │
│  (메인 검색)  │
└──────┬───────┘
       │
┌──────▼────────┐     ┌──────────────────┐
│   API Route   │     │   Claude API     │
│ /api/books/*  │     │   (Sonnet 4.5)   │
└──────┬────────┘     └──────┬───────────┘
       │                     │
┌──────▼────────┐     ┌──────▼───────────┐
│  books 테이블  │     │  /api/agent/*    │
│  (캐시 레이어) │     │  (5개 엔드포인트) │
└───────────────┘     └──────────────────┘
```

---

## 2. 인증 API

### POST /api/invite/verify

초대 코드를 DB에서 검증합니다.

**요청**

```json
{
  "code": "CHAEKDAM2026"
}
```

**응답 (200)**

```json
{
  "valid": true
}
```

**응답 (400)**

```json
{
  "valid": false,
  "error": "유효하지 않은 초대 코드입니다"
}
```

**구현 참고**

- Service Role 클라이언트로 invite_codes 테이블 조회
- is_active, expires_at, use_count < max_uses 조건 검증
- 검증 성공 시 use_count 증가

### GET /api/auth/callback

Magic Link 콜백을 처리합니다.

**처리 흐름**

```
1. URL의 code 파라미터 추출
2. Supabase Auth exchangeCodeForSession
3. profiles 테이블에서 닉네임 존재 여부 확인
4. 닉네임 없음 → /onboarding 리다이렉트
5. 닉네임 있음 → /home 리다이렉트
```

---

## 3. 도서 검색 API

### GET /api/books/search

네이버 도서 검색 API를 프록시하고 결과를 캐싱합니다.

**요청**

- Query: `?q=데미안&limit=10`

**응답 (200)**

```json
{
  "books": [
    {
      "id": "uuid",
      "isbn": "9788937460...",
      "title": "데미안",
      "author": "헤르만 헤세",
      "publisher": "민음사",
      "cover_image_url": "https://...",
      "description": "...",
      "published_date": "2000-01-01"
    }
  ],
  "total": 50
}
```

**캐싱 전략**

```
검색 요청 → books 테이블 ISBN 조회
  → 캐시 히트: DB에서 반환 (API 호출 0)
  → 캐시 미스: 네이버 API 호출 → books 테이블 저장 → 반환
  → 캐시 만료: 30일 후 API 재호출하여 갱신
```

---

## 4. AI 에이전트 API

### 공통 사항

- 모델: Claude Sonnet 4.5 단일
- 응답: SSE (Server-Sent Events) 스트리밍
- 인증: Supabase 세션 필수
- 캐싱: ai_contents 테이블 (prompt_hash 기반)
- 톤: 도구형 조력자 (캐릭터 없음)

### Phase 1 엔드포인트

#### POST /api/agent/interview

대화형 기록 인터뷰. AI가 책에 대한 질문을 던져 사용자의 생각을 끌어냅니다.

**요청**

```json
{
  "book_id": "uuid",
  "messages": [{ "role": "user", "content": "..." }],
  "step": 1
}
```

**응답**: SSE 스트림 (AI 질문 또는 요약)

**동작**

- step 1~5: 책 컨텍스트 기반 질문 생성
- step 완료: 대화 내용을 요약하여 기록 초안 생성
- agent_conversations에 대화 이력 저장

#### POST /api/agent/summarize

책 요약을 생성합니다.

**요청**

```json
{
  "book_id": "uuid"
}
```

**응답**: SSE 스트림 (요약 텍스트)

#### POST /api/agent/topics

토론 주제를 생성합니다.

**요청**

```json
{
  "book_id": "uuid",
  "count": 5
}
```

**응답**: SSE 스트림 (토론 주제 목록)

#### POST /api/agent/draft

발제문 초안을 생성합니다.

**요청**

```json
{
  "book_id": "uuid",
  "focus": "핵심 메시지와 현대적 의미"
}
```

**응답**: SSE 스트림 (발제문 마크다운)

#### POST /api/agent/analysis

도서 분석을 생성합니다.

**요청**

```json
{
  "book_id": "uuid"
}
```

**응답**: SSE 스트림 (분석 텍스트: 주제, 문체, 역사적 맥락 등)

### Phase 2 엔드포인트

#### POST /api/agent/suggest-questions

토론 질문을 추천합니다.

**요청**

```json
{
  "book_id": "uuid",
  "session_id": "uuid"
}
```

#### POST /api/agent/recommend

관련 도서를 추천합니다.

**요청**

```json
{
  "book_id": "uuid",
  "reason": "similar_theme"
}
```

#### POST /api/agent/insight

사용자의 독서 기록을 분석하여 인사이트를 제공합니다.

**요청**

```json
{
  "user_id": "uuid"
}
```

### 삭제된 엔드포인트

| 엔드포인트        | 삭제 이유                                     |
| ----------------- | --------------------------------------------- |
| `/api/agent/chat` | 자유 대화 제거, 기능별 전용 엔드포인트로 분리 |

---

## 5. 네이버 도서 검색 API (외부)

### 기본 정보

- **Endpoint**: `https://openapi.naver.com/v1/search/book.json`
- **일일 한도**: 25,000회
- **인증**: Client ID + Client Secret (Header)

### 요청 예시

```typescript
// lib/api/naver-books.ts
const NAVER_API_URL = "https://openapi.naver.com/v1/search/book.json";

interface NaverBookSearchParams {
  query: string;
  display?: number; // 결과 수 (기본 10, 최대 100)
  start?: number; // 시작 위치
  sort?: "sim" | "date";
}

interface NaverBookItem {
  title: string;
  link: string;
  image: string;
  author: string;
  discount: string;
  publisher: string;
  pubdate: string;
  isbn: string;
  description: string;
}
```

### 응답 처리

```typescript
async function searchNaverBooks(params: NaverBookSearchParams) {
  const res = await fetch(
    `${NAVER_API_URL}?${new URLSearchParams({
      query: params.query,
      display: String(params.display ?? 10),
      start: String(params.start ?? 1),
      sort: params.sort ?? "sim",
    })}`,
    {
      headers: {
        "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID!,
        "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET!,
      },
    }
  );

  return res.json();
}
```

---

## 6. Claude API (AI 에이전트)

### 기본 정보

- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **모델**: Claude Sonnet 4.5 단일
- **인증**: API Key (Header)

### 스트리밍 구현

```typescript
// lib/agent/client.ts
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

async function* streamAgent(systemPrompt: string, messages: Message[], bookContext?: BookContext) {
  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" },
      },
      ...(bookContext
        ? [
            {
              type: "text" as const,
              text: `도서 정보: ${bookContext.title} / ${bookContext.author}\n${bookContext.description}`,
              cache_control: { type: "ephemeral" as const },
            },
          ]
        : []),
    ],
    messages,
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta") {
      yield event.delta.text;
    }
  }
}
```

---

## 7. AI 응답 캐싱 전략

```
AI 요청 → prompt_hash 생성 (SHA-256) → ai_contents 테이블 조회
  → 캐시 히트: DB에서 반환 (LLM 호출 0)
  → 캐시 미스: Claude API 호출 → ai_contents 저장 → 반환
```

- 캐시 키: `book_id + content_type + prompt_hash`
- interview 타입은 캐싱하지 않음 (매번 다른 대화)

---

## 8. Rate Limit 및 장애 대응

### Rate Limit 관리

| API    | 한도        | 대응                              |
| ------ | ----------- | --------------------------------- |
| 네이버 | 25,000/일   | DB 캐싱으로 실제 호출 최소화      |
| Claude | 사용량 기반 | Prompt Caching + ai_contents 캐싱 |

### 장애 대응 테이블

| 장애 상황            | 감지 방법          | 대응                  | 사용자 메시지                                               |
| -------------------- | ------------------ | --------------------- | ----------------------------------------------------------- |
| 네이버 API 다운      | HTTP 5xx / timeout | DB 캐시만 제공        | "일시적으로 검색이 제한됩니다. 잠시 후 다시 시도해 주세요." |
| 네이버 API 한도 초과 | HTTP 429           | DB 캐시만 제공        | "검색 서비스가 일시적으로 제한됩니다."                      |
| Claude API 다운      | HTTP 5xx / timeout | 캐시된 AI 콘텐츠 제공 | "AI 기능이 일시적으로 사용 불가합니다."                     |
| Claude API 한도 초과 | HTTP 429           | 요청 대기 또는 거절   | "AI 요청이 많아 잠시 후 다시 시도해 주세요."                |
| Supabase 다운        | 연결 실패          | 에러 페이지           | "서비스에 일시적인 문제가 발생했습니다."                    |
| Magic Link 발송 실패 | Supabase Auth 에러 | 재시도 안내           | "이메일 발송에 실패했습니다. 이메일 주소를 확인해 주세요."  |

---

## 9. 환경 변수 목록

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Claude API
ANTHROPIC_API_KEY=

# 네이버 도서 API
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
```

Phase 2 이후 추가 예정:

```env
# Supabase Storage는 기본 제공 (별도 환경 변수 불필요)
# 이미지 업로드 시 Supabase Storage 사용
```
