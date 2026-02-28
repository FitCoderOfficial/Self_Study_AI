-- ===================================
-- Self_Study_AI 수능 공부 도우미 스키마
-- Supabase SQL Editor에서 실행하세요
-- ===================================

-- 1. 사용자 프로필 테이블
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 프로필 자동 생성 트리거 (회원가입 시) - 오류 안전 버전
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 오류가 있어도 유저 생성은 계속 진행
    RAISE WARNING 'handle_new_user() 오류: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. 사용자 문제 테이블 (이미지 업로드한 문제들)
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT,
  ocr_text TEXT,
  ai_explanation TEXT,
  subject TEXT DEFAULT '기타',
  difficulty TEXT DEFAULT 'medium',
  problem_number INTEGER,
  score INTEGER,
  tags TEXT[] DEFAULT '{}',
  is_correct BOOLEAN,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AI 생성 유사 문제 테이블
CREATE TABLE IF NOT EXISTS public.similar_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  original_question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL,
  csat_problem_id UUID,
  generated_content TEXT NOT NULL,
  subject TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 수능 과거 문제 테이블
CREATE TABLE IF NOT EXISTS public.csat_problems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL DEFAULT 11,
  subject TEXT NOT NULL,
  sub_subject TEXT,
  number INTEGER NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  choices TEXT[],
  answer INTEGER,
  explanation TEXT,
  difficulty TEXT DEFAULT 'medium',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(year, month, subject, number)
);

-- 5. RLS (Row Level Security) 정책
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.similar_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csat_problems ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성 (중복 방지)
DROP POLICY IF EXISTS "수능 문제 공개 조회" ON public.csat_problems;
DROP POLICY IF EXISTS "프로필 본인 조회" ON public.profiles;
DROP POLICY IF EXISTS "프로필 본인 수정" ON public.profiles;
DROP POLICY IF EXISTS "프로필 서비스 생성" ON public.profiles;
DROP POLICY IF EXISTS "문제 본인 조회" ON public.questions;
DROP POLICY IF EXISTS "문제 본인 생성" ON public.questions;
DROP POLICY IF EXISTS "문제 본인 수정" ON public.questions;
DROP POLICY IF EXISTS "문제 본인 삭제" ON public.questions;
DROP POLICY IF EXISTS "유사문제 본인 조회" ON public.similar_questions;
DROP POLICY IF EXISTS "유사문제 본인 생성" ON public.similar_questions;
DROP POLICY IF EXISTS "유사문제 본인 삭제" ON public.similar_questions;

-- 수능 문제: 모든 사람 읽기 가능
CREATE POLICY "수능 문제 공개 조회" ON public.csat_problems FOR SELECT USING (true);

-- 프로필: 본인만 + 트리거(서비스 역할)에서 생성 가능
CREATE POLICY "프로필 본인 조회" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "프로필 본인 수정" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "프로필 서비스 생성" ON public.profiles FOR INSERT WITH CHECK (true);

-- 문제: 본인만
CREATE POLICY "문제 본인 조회" ON public.questions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "문제 본인 생성" ON public.questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "문제 본인 수정" ON public.questions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "문제 본인 삭제" ON public.questions FOR DELETE USING (auth.uid() = user_id);

-- 유사 문제: 본인만
CREATE POLICY "유사문제 본인 조회" ON public.similar_questions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "유사문제 본인 생성" ON public.similar_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "유사문제 본인 삭제" ON public.similar_questions FOR DELETE USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON public.questions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON public.questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_csat_problems_year ON public.csat_problems(year, month, subject);
CREATE INDEX IF NOT EXISTS idx_similar_questions_user ON public.similar_questions(user_id);

-- ===================================
-- 5. 수능 시험지 PDF 링크 테이블 (크롤링 데이터)
-- ===================================
CREATE TABLE IF NOT EXISTS public.csat_pdfs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,         -- 학년도 (e.g. 2026)
  month INTEGER NOT NULL,        -- 11=수능, 9=9월모평, 6=6월모평
  subject TEXT NOT NULL,         -- 영역 (국어, 수학, 영어, ...)
  pdf_url TEXT,                  -- 문제지 PDF 다운로드 URL
  answer_url TEXT,               -- 정답표 PDF 다운로드 URL
  board_seq TEXT,                -- suneung.re.kr boardSeq
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(year, month, subject)
);

ALTER TABLE public.csat_pdfs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read csat_pdfs"  ON public.csat_pdfs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert csat_pdfs" ON public.csat_pdfs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update csat_pdfs" ON public.csat_pdfs FOR UPDATE USING (true);

CREATE INDEX IF NOT EXISTS idx_csat_pdfs_year ON public.csat_pdfs(year, month, subject);

-- ZIP 파일 내부 PDF 목록 컬럼 추가 (선택과목 지원)
ALTER TABLE public.csat_pdfs ADD COLUMN IF NOT EXISTS zip_files JSONB;
ALTER TABLE public.csat_pdfs ADD COLUMN IF NOT EXISTS answer_zip_files JSONB;
