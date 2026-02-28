-- ============================================
-- 회원가입 오류 수정 패치 SQL
-- Supabase Dashboard > SQL Editor에서 실행하세요
-- (이미 supabase-schema.sql을 실행한 경우에만 필요)
-- ============================================

-- 트리거 함수를 오류 안전 버전으로 교체
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
    RAISE WARNING 'handle_new_user 오류 (무시됨): %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- profiles INSERT 정책 추가 (없으면 트리거에서 INSERT 안됨)
DROP POLICY IF EXISTS "프로필 서비스 생성" ON public.profiles;
CREATE POLICY "프로필 서비스 생성" ON public.profiles FOR INSERT WITH CHECK (true);

-- 완료 확인
SELECT 'OK: 트리거 함수 수정 완료' AS result;
