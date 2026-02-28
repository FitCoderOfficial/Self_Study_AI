"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { Trophy, TrendingUp, Clock, Edit3, Save, X, Loader2, BookOpen } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface Stats {
  total: number;
  bySubject: Record<string, number>;
  recent: Array<{ subject: string; date: string }>;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [name, setName] = useState('');
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState<Stats>({ total: 0, bySubject: {}, recent: [] });

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push('/login?next=/profile');
        return;
      }
      setUser(user);
      const displayName = user.user_metadata?.name || user.email?.split('@')[0] || '사용자';
      setName(displayName);

      // 통계 로드
      try {
        const { data } = await supabase
          .from('questions')
          .select('subject, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (data) {
          const bySubject: Record<string, number> = {};
          data.forEach(q => {
            bySubject[q.subject] = (bySubject[q.subject] || 0) + 1;
          });
          setStats({
            total: data.length,
            bySubject,
            recent: data.slice(0, 5).map(q => ({ subject: q.subject, date: q.created_at.split('T')[0] })),
          });
        }
      } catch {
        // Supabase 미설정 시 localStorage 사용
        const local = JSON.parse(localStorage.getItem('archivedQuestions') || '[]');
        const bySubject: Record<string, number> = {};
        local.forEach((q: { subject: string }) => {
          bySubject[q.subject] = (bySubject[q.subject] || 0) + 1;
        });
        setStats({
          total: local.length,
          bySubject,
          recent: local.slice(0, 5).map((q: { subject: string; date: string }) => ({ subject: q.subject, date: q.date })),
        });
      }

      setIsLoading(false);
    });
  }, [router]);

  const handleSaveName = async () => {
    if (!user || !editName.trim()) return;
    setIsSaving(true);
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({ data: { name: editName.trim() } });
      await supabase.from('profiles').update({ name: editName.trim() }).eq('id', user.id);
      setName(editName.trim());
      setIsEditOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  const totalProblems = stats.total;
  const subjectList = Object.entries(stats.bySubject).sort((a, b) => b[1] - a[1]);
  const maxCount = subjectList.length > 0 ? subjectList[0][1] : 1;
  const subjectColors: Record<string, string> = {
    수학: 'bg-blue-500', 영어: 'bg-green-500', 국어: 'bg-orange-500',
    사회: 'bg-yellow-500', 과학: 'bg-purple-500', 기타: 'bg-gray-400',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">마이페이지</h1>
          <p className="text-gray-600 dark:text-gray-300">학습 현황과 통계를 확인하세요</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 프로필 카드 */}
          <div className="space-y-4">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="pt-6 pb-6 text-center">
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarFallback className="bg-blue-600 text-white text-2xl font-bold">
                    {name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{name}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{user?.email}</p>
                <p className="text-xs text-gray-400 mb-4">
                  가입일: {user?.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'}
                </p>

                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full dark:border-gray-600 dark:text-gray-300"
                      onClick={() => setEditName(name)}>
                      <Edit3 className="w-4 h-4 mr-2" />
                      이름 수정
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="dark:text-gray-100">프로필 수정</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label className="dark:text-gray-300">이름</Label>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveName} disabled={isSaving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" />저장</>}
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)} className="flex-1 dark:border-gray-600 dark:text-gray-300">
                          <X className="w-4 h-4 mr-2" />취소
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* 학습 요약 */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base dark:text-gray-100">
                  <Trophy className="mr-2 h-4 w-4 text-yellow-500" />
                  학습 요약
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalProblems}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">총 문제</div>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{subjectList.length}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">학습 과목</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽 통계 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 과목별 통계 */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center dark:text-gray-100">
                  <TrendingUp className="mr-2 h-5 w-5 text-green-500" />
                  과목별 문제 풀이
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subjectList.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">아직 풀었던 문제가 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {subjectList.map(([subject, count]) => (
                      <div key={subject} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{subject}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{count}문제</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${subjectColors[subject] || 'bg-blue-500'}`}
                            style={{ width: `${(count / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 최근 활동 */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center dark:text-gray-100">
                  <Clock className="mr-2 h-5 w-5 text-blue-500" />
                  최근 활동
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.recent.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">최근 활동이 없습니다</p>
                ) : (
                  <div className="space-y-2">
                    {stats.recent.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.subject} 문제</span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{item.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
