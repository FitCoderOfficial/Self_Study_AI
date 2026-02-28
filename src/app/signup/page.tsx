"use client";

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Loader2, AlertCircle, CheckCircle, Eye, EyeOff, Mail } from 'lucide-react';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('user already registered')) {
        setError('이미 사용 중인 이메일입니다. 로그인을 시도해보세요.');
      } else if (msg.includes('database error')) {
        setError('서버 설정 오류입니다. 관리자에게 문의해주세요.');
      } else if (msg.includes('invalid email')) {
        setError('올바른 이메일 형식이 아닙니다.');
      } else if (msg.includes('password')) {
        setError('비밀번호가 조건을 충족하지 않습니다. (6자 이상)');
      } else {
        setError(`오류: ${error.message}`);
      }
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);
  };

  // 이메일 전송 완료 화면
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <Card className="w-full max-w-md dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-8 pb-8 text-center">
            {/* 아이콘 */}
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-5">
              <Mail className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              인증 이메일을 보냈습니다!
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>
            </p>

            {/* 안내 단계 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-6 text-left space-y-3">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">이메일 인증 후 이용 가능합니다</p>
              {[
                '받은 편지함에서 인증 이메일을 확인하세요',
                '스팸 폴더도 확인해보세요',
                '이메일 내 "이메일 인증하기" 버튼을 클릭하세요',
                '인증 완료 후 로그인하면 서비스를 이용할 수 있습니다',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">{step}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg mb-6">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                인증 전에는 로그인이 제한됩니다. 반드시 이메일 인증을 완료해주세요.
              </p>
            </div>

            <Link href="/login">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11">
                <CheckCircle className="w-4 h-4 mr-2" />
                로그인 페이지로 이동
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <BookOpen className="w-8 h-8" />
            <span className="text-2xl font-bold">수능 AI 도우미</span>
          </Link>
          <p className="text-gray-600 dark:text-gray-400 mt-2">수능 공부를 AI와 함께하세요</p>
        </div>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl text-center dark:text-gray-100">회원가입</CardTitle>
            <CardDescription className="text-center dark:text-gray-400">
              무료로 시작하여 AI 학습 도우미를 활용하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="dark:text-gray-300">이름</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="이름을 입력하세요"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="dark:text-gray-300">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </div>

              {/* 비밀번호 (눈 아이콘) */}
              <div className="space-y-2">
                <Label htmlFor="password" className="dark:text-gray-300">비밀번호</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="6자 이상"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 비밀번호 확인 (눈 아이콘) */}
              <div className="space-y-2">
                <Label htmlFor="passwordConfirm" className="dark:text-gray-300">비밀번호 확인</Label>
                <div className="relative">
                  <Input
                    id="passwordConfirm"
                    type={showPasswordConfirm ? 'text' : 'password'}
                    placeholder="비밀번호를 다시 입력하세요"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    className={`dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 pr-10 ${
                      passwordConfirm && password !== passwordConfirm
                        ? 'border-red-400 focus:border-red-400'
                        : passwordConfirm && password === passwordConfirm
                        ? 'border-green-400 focus:border-green-400'
                        : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* 비밀번호 일치 여부 실시간 표시 */}
                {passwordConfirm && (
                  <p className={`text-xs flex items-center gap-1 ${
                    password === passwordConfirm ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                  }`}>
                    {password === passwordConfirm
                      ? <><CheckCircle className="w-3 h-3" />비밀번호가 일치합니다</>
                      : <><AlertCircle className="w-3 h-3" />비밀번호가 일치하지 않습니다</>
                    }
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    가입 중...
                  </>
                ) : '회원가입'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                로그인
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
