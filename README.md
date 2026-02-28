# 수능 AI 도우미

수능 준비생을 위한 AI 기반 학습 도우미 서비스. 문제 이미지를 업로드하면 GPT-4o Vision이 문제를 인식하고 단계별 해설을 생성합니다.

## 주요 기능

- **이미지 → 해설 자동 생성**: 문제 사진 업로드 시 GPT-4o Vision이 OCR + 해설을 한 번에 처리
- **유사 문제 생성**: AI가 수능 스타일의 유사 문제를 자동으로 생성
- **수능 기출 문제**: 수학/영어/국어 수능 기출 문제 열람 및 유사 문제 생성
- **학습 아카이브**: 풀었던 문제와 해설을 과목별로 저장/조회
- **회원 인증**: 이메일 회원가입/로그인, 비밀번호 찾기 (Supabase Auth)
- **다크 모드**: 라이트/다크 테마 지원

## 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | Next.js 15.5 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| AI | OpenAI GPT-4o Vision |
| Icons | Lucide React |

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 아래 내용을 입력합니다:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

### 3. Supabase 데이터베이스 설정

[Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor에서 `supabase-schema.sql` 파일의 내용을 실행합니다.

```bash
# 테이블 구성:
# - profiles       : 사용자 프로필
# - questions      : 업로드한 문제 (OCR 텍스트, AI 해설)
# - similar_questions : AI 생성 유사 문제
# - csat_problems  : 수능 기출 문제
```

### 4. 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3100` 에서 확인합니다.

### 5. 프로덕션 빌드

```bash
npm run build
npm start
```

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx                  # 홈 (랜딩)
│   ├── login/page.tsx            # 로그인
│   ├── signup/page.tsx           # 회원가입
│   ├── forgot-password/page.tsx  # 비밀번호 찾기
│   ├── reset-password/page.tsx   # 비밀번호 재설정
│   ├── solve/page.tsx            # 문제 이미지 업로드
│   ├── new-question/[id]/        # 문제 해설 + 유사문제
│   ├── archive/page.tsx          # 학습 기록
│   ├── csat/page.tsx             # 수능 기출 문제
│   ├── profile/page.tsx          # 마이페이지
│   ├── auth/callback/route.ts    # Supabase OAuth 콜백
│   └── api/
│       ├── process-image/        # GPT-4o Vision OCR + 해설
│       ├── similar-question/     # 유사 문제 생성
│       └── csat/                 # 수능 기출 데이터
├── components/
│   ├── ui/                       # shadcn/ui 컴포넌트
│   └── Navigation.tsx            # 네비게이션 바
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # 브라우저 Supabase 클라이언트
│   │   └── server.ts             # 서버 Supabase 클라이언트
│   └── utils.ts
├── middleware.ts                  # 인증 라우트 가드
supabase-schema.sql               # DB 스키마 (최초 설정 시 실행)
supabase-fix.sql                  # DB 패치 (기존 스키마에 적용)
```

## 인증 플로우

```
회원가입 → 이메일 인증 → 로그인
비밀번호 찾기 → 이메일 링크 클릭 → /reset-password → 새 비밀번호 설정
```

보호된 라우트 (`/archive`, `/profile`)는 로그인 없이 접근 시 `/login`으로 리다이렉트됩니다.

## Supabase 설정 가이드

1. **이메일 인증**: Dashboard → Authentication → Providers → Email
2. **리다이렉트 URL 허용**: Dashboard → Authentication → URL Configuration
   - `http://localhost:3100/auth/callback`
   - `http://localhost:3100/reset-password`
3. **SQL 스키마 실행**: Dashboard → SQL Editor → `supabase-schema.sql` 붙여넣기 후 실행

## 라이선스

MIT
