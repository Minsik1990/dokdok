# 프로젝트 셋업 가이드

> 최종 업데이트: 2026-02-07 (v2.0)

---

## 1. 사전 요구사항

### 필수 설치

- **Node.js** 20+ (LTS)
- **pnpm** (추천) 또는 npm
- **Git**
- **Docker** (Supabase 로컬 개발 시)

### 계정 필요

- [GitHub](https://github.com) -- 코드 저장소
- [Vercel](https://vercel.com) -- 배포 (GitHub 연동)
- [Supabase](https://supabase.com) -- 데이터베이스, 인증 (Magic Link)
- [네이버 개발자센터](https://developers.naver.com) -- 도서 검색 API
- [Anthropic Console](https://console.anthropic.com) -- Claude API

---

## 2. 프로젝트 초기화

### 방법 1: Vercel 템플릿 (추천)

```bash
# Vercel 공식 Next.js + Supabase 템플릿
npx create-next-app -e with-supabase chaekdam
cd chaekdam
```

### 방법 2: 수동 설정

```bash
npx create-next-app@latest chaekdam --typescript --tailwind --eslint --app --use-pnpm
cd chaekdam
pnpm add @supabase/supabase-js @supabase/ssr
```

---

## 3. shadcn/ui 설치

```bash
# shadcn/ui 초기화
npx shadcn@latest init

# 필수 컴포넌트 추가
npx shadcn@latest add button card input textarea dialog dropdown-menu
npx shadcn@latest add avatar badge separator tabs toast
```

---

## 4. 환경 변수 설정

`.env.local` 파일 생성:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Claude API
ANTHROPIC_API_KEY=sk-ant-your-api-key

# 네이버 도서 API
NAVER_CLIENT_ID=your-naver-client-id
NAVER_CLIENT_SECRET=your-naver-client-secret
```

---

## 5. Supabase 설정

### 프로젝트 생성

1. [Supabase](https://supabase.com) 가입
2. "New Project" 생성 (Free Plan)
3. Region: Northeast Asia (Tokyo) 선택
4. DB 비밀번호 안전하게 보관

### Magic Link 인증 설정

1. Supabase Dashboard -> Authentication -> Providers
2. **Email** 활성화 (기본 활성)
3. Email Templates -> Magic Link 메일 템플릿 커스텀 (선택)
4. URL Configuration에서 Site URL 설정:
   - 로컬: `http://localhost:3000`
   - 프로덕션: `https://your-domain.vercel.app`
5. Redirect URLs 추가:
   - `http://localhost:3000/api/auth/callback`
   - `https://your-domain.vercel.app/api/auth/callback`

### 로컬 개발 (Docker)

```bash
# Supabase CLI 설치
pnpm add -D supabase

# 로컬 Supabase 시작
npx supabase init
npx supabase start
```

### 마이그레이션 적용

```bash
# 마이그레이션 생성
npx supabase migration new initial_schema
# supabase/migrations/ 에 SQL 작성 (database-schema.md 참조)

# 마이그레이션 적용
npx supabase db push

# TypeScript 타입 생성
npx supabase gen types typescript --local > database.types.ts
```

### 초대 코드 시드 데이터

```sql
-- 초기 초대 코드 생성 (Supabase SQL Editor에서 실행)
INSERT INTO invite_codes (code, max_uses, is_active)
VALUES
  ('CHAEKDAM2026', 50, true),
  ('READING2026', 50, true);
```

---

## 6. 개발 서버 실행

```bash
# 의존성 설치
pnpm install

# 개발 서버 시작
pnpm dev
```

`http://localhost:3000` 에서 확인

---

## 7. 네이버 도서 API 설정

1. [네이버 개발자센터](https://developers.naver.com) 방문
2. "애플리케이션 등록" -> "검색" API 선택
3. Client ID, Client Secret을 `.env.local`에 설정
4. 일일 25,000회 호출 가능

---

## 8. Claude API 설정

1. [Anthropic Console](https://console.anthropic.com) 가입/로그인
2. API Key 생성
3. `.env.local`의 `ANTHROPIC_API_KEY`에 설정
4. 패키지 설치:

```bash
pnpm add @anthropic-ai/sdk
```

---

## 9. Pretendard 폰트 설정

```bash
# next/font로 Pretendard 설정 (layout.tsx에서)
# CDN 방식 또는 로컬 폰트 파일 사용
```

```typescript
// src/app/layout.tsx 예시
import localFont from "next/font/local";

const pretendard = localFont({
  src: "../fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "100 900",
  variable: "--font-pretendard",
});
```

---

## 10. 유용한 명령어

```bash
# 개발
pnpm dev          # 개발 서버 (http://localhost:3000)
pnpm build        # 프로덕션 빌드
pnpm start        # 프로덕션 서버
pnpm lint         # ESLint 검사
pnpm typecheck    # TypeScript 타입 체크

# Supabase
npx supabase start     # 로컬 Supabase 시작
npx supabase stop      # 로컬 Supabase 중지
npx supabase db push   # 마이그레이션 적용
npx supabase gen types typescript --local > database.types.ts  # 타입 생성

# 테스트
pnpm test         # Vitest 단위 테스트
pnpm test:e2e     # Playwright E2E 테스트

# shadcn/ui
npx shadcn@latest add [component]  # 컴포넌트 추가
```

---

## 11. 트러블슈팅

### Supabase 연결 오류

- `.env.local`의 URL과 Key가 올바른지 확인
- 로컬 개발 시 `npx supabase start`가 실행 중인지 확인

### Magic Link 이메일이 오지 않음

- Supabase Dashboard -> Authentication -> Email Templates 확인
- 로컬 개발 시: Supabase Studio (http://localhost:54323) -> Authentication -> Users에서 확인 링크 직접 사용 가능
- 프로덕션: Supabase의 Rate Limit 확인 (무료: 시간당 30회)

### 네이버 API 401 오류

- Client ID와 Secret이 올바른지 확인
- 헤더에 `X-Naver-Client-Id`, `X-Naver-Client-Secret` 포함 확인

### 빌드 실패

- TypeScript 타입 오류: `npx supabase gen types`로 타입 재생성
- 환경 변수 누락: Vercel 대시보드에서 환경 변수 확인
