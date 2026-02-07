# 배포 가이드

> 최종 업데이트: 2026-02-07 (v2.0)

---

## 1. 배포 아키텍처

```
GitHub (Public 레포)
    |
    +-- Push -> Vercel (자동 배포)
    |           +-- Production (main 브랜치)
    |           +-- Preview (PR별 자동 생성)
    |
    +-- GitHub Actions
            +-- CI (린트, 타입체크, 빌드)
            +-- Supabase Keep-Alive (3일마다)
```

---

## 2. Vercel 배포

### 초기 설정

1. [Vercel](https://vercel.com) 가입 (GitHub 연동)
2. "New Project" -> GitHub 레포 연결
3. Framework: Next.js (자동 감지)
4. 환경 변수 설정 (Settings -> Environment Variables):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=...
NAVER_CLIENT_ID=...
NAVER_CLIENT_SECRET=...
```

### 자동 배포

- `main` 브랜치 push -> **프로덕션 배포**
- PR 생성 -> **프리뷰 배포** (고유 URL 생성)
- 빌드 실패 시 이전 버전 유지

### 도메인

- **무료**: `your-project.vercel.app`
- **커스텀**: 연 ~14,000원 (선택사항)

---

## 3. Supabase 배포

### 프로젝트 생성

1. [Supabase](https://supabase.com) 가입
2. "New Project" 생성 (Free Plan)
3. Region: Northeast Asia (Tokyo) 선택
4. DB 비밀번호 안전하게 보관

### 마이그레이션 적용

```bash
# Supabase CLI로 원격 DB에 마이그레이션 적용
npx supabase db push --project-ref your-project-ref
```

### 또는 Supabase 대시보드에서

1. SQL Editor 열기
2. `supabase/migrations/` 파일 내용 실행

### Magic Link 인증 설정 (프로덕션)

1. Supabase Dashboard -> Authentication -> URL Configuration
2. **Site URL**: `https://your-domain.vercel.app`
3. **Redirect URLs** 추가:
   - `https://your-domain.vercel.app/api/auth/callback`
4. Authentication -> Email Templates
   - Magic Link 이메일 제목/본문 커스텀 (선택)
   - 발신자 이름: "책담" (선택)

### 초대 코드 생성

```sql
-- SQL Editor에서 초기 초대 코드 생성
INSERT INTO invite_codes (code, max_uses, is_active)
VALUES ('CHAEKDAM2026', 50, true);
```

---

## 4. GitHub Actions CI/CD

### CI 파이프라인 (`.github/workflows/ci.yml`)

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm build
```

### Supabase 일시정지 방지 (`.github/workflows/keep-alive.yml`)

```yaml
name: Supabase Keep Alive

on:
  schedule:
    - cron: "0 0 */3 * *" # 3일마다

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Supabase
        run: |
          curl -s "${{ secrets.SUPABASE_URL }}/rest/v1/" \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

### GitHub Secrets 설정

1. GitHub 레포 -> Settings -> Secrets and variables -> Actions
2. 추가:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

---

## 5. 환경별 설정

| 환경           | Supabase                  | Vercel         | 용도      |
| -------------- | ------------------------- | -------------- | --------- |
| **Local**      | `supabase start` (Docker) | `pnpm dev`     | 개발      |
| **Preview**    | Production DB (읽기만)    | PR별 자동 생성 | 코드 리뷰 |
| **Production** | Supabase Cloud            | `main` 브랜치  | 실서비스  |

---

## 6. 배포 체크리스트

### 첫 배포 전

- [ ] 환경 변수 모두 Vercel에 설정
- [ ] Supabase 마이그레이션 적용 완료
- [ ] RLS 정책 활성화 확인
- [ ] Magic Link Redirect URL 설정 (Supabase Dashboard)
- [ ] 초대 코드 시드 데이터 생성
- [ ] `.gitignore`에 `.env.local` 포함 확인
- [ ] 빌드 성공 확인 (`pnpm build`)

### 매 배포 시

- [ ] TypeScript 에러 없음
- [ ] ESLint 에러 없음
- [ ] 빌드 성공
- [ ] Preview 배포에서 기본 기능 확인

---

## 7. 모니터링

### Vercel

- Dashboard -> Analytics (트래픽, 성능)
- Dashboard -> Logs (에러 로그)
- Usage (대역폭, Serverless 호출)

### Supabase

- Dashboard -> Database (용량, 쿼리 수)
- Dashboard -> Auth (가입자 수, 세션)
- Dashboard -> Storage (사용량)

### 비용 알림 설정

- Vercel: 사용량 80% 도달 시 이메일 알림
- Supabase: 무료 한도 경고 대시보드 확인
- Claude API: Anthropic Console에서 사용량 모니터링

---

## 8. 트러블슈팅

### Vercel 빌드 실패

```bash
# 로컬에서 빌드 테스트
pnpm build

# 환경 변수 누락 확인
# Vercel Dashboard -> Settings -> Environment Variables
```

### Supabase 연결 오류

```bash
# URL과 Key 확인
curl "$SUPABASE_URL/rest/v1/" \
  -H "apikey: $SUPABASE_ANON_KEY"
```

### Magic Link 로그인 실패

- Supabase Dashboard -> Authentication -> URL Configuration에서 Redirect URL 확인
- Site URL이 프로덕션 도메인과 정확히 일치하는지 확인
- 이메일 발송 Rate Limit (무료: 시간당 30회) 초과 여부 확인
- 브라우저 쿠키/캐시 초기화 후 재시도

---

## 9. 버전 태깅

```bash
# 마일스톤 달성 시
git tag v2.0-alpha
git push origin v2.0-alpha

# 태그 목록 확인
git tag -l
```
