"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { TrendingUp, Edit3, Save, X, Loader2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface QuestionRow {
  subject: string;
  created_at: string;
  score: number | null;
  is_correct: boolean | null;
  tags: string[] | null;
}

// 지난 30일 날짜 배열 (오늘 포함, 과거 → 오늘)
function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

// 이번 주 월~일 날짜 배열
function getThisWeekDays(): { label: string; date: string }[] {
  const today = new Date();
  const dow = today.getDay(); // 0=일,1=월,...,6=토
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  const labels = ['월', '화', '수', '목', '금', '토', '일'];
  return labels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { label, date: d.toISOString().split('T')[0] };
  });
}

// 연속 학습일 계산
function calcStreak(activityDates: Set<string>): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    if (activityDates.has(ds)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

const SUBJECT_COLORS: Record<string, string> = {
  수학: 'bg-blue-500', 영어: 'bg-green-500', 국어: 'bg-orange-500',
  사회: 'bg-yellow-500', 과학: 'bg-purple-500', 기타: 'bg-gray-400',
  한국사: 'bg-red-400',
};

function getSubjectColor(subject: string): string {
  for (const [key, color] of Object.entries(SUBJECT_COLORS)) {
    if (subject.includes(key)) return color;
  }
  return 'bg-blue-400';
}

// 히트맵 색상 (파란색 계열)
function heatColor(count: number): string {
  if (count === 0) return 'bg-blue-50';
  if (count <= 2)  return 'bg-blue-200';
  if (count <= 5)  return 'bg-blue-400';
  return 'bg-blue-700';
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [name, setName] = useState('');
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [rows, setRows] = useState<QuestionRow[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login?next=/profile'); return; }
      setUser(user);
      setName(user.user_metadata?.name || user.email?.split('@')[0] || '사용자');

      try {
        const { data } = await supabase
          .from('questions')
          .select('subject, created_at, score, is_correct, tags')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(300);
        setRows((data as QuestionRow[]) || []);
      } catch {
        const local: QuestionRow[] = JSON.parse(localStorage.getItem('archivedQuestions') || '[]');
        setRows(local);
      }
      setIsLoading(false);
    });
  }, [router]);

  // ── 파생 통계 ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = rows.length;
    const judged = rows.filter(r => r.is_correct !== null);
    const correct = judged.filter(r => r.is_correct).length;
    const accuracy = judged.length > 0 ? Math.round((correct / judged.length) * 100) : 0;

    // 과목별 집계
    const bySubject: Record<string, { count: number; correct: number }> = {};
    rows.forEach(r => {
      const s = r.subject || '기타';
      if (!bySubject[s]) bySubject[s] = { count: 0, correct: 0 };
      bySubject[s].count++;
      if (r.is_correct) bySubject[s].correct++;
    });

    // 날짜별 집계
    const byDate: Record<string, number> = {};
    rows.forEach(r => {
      const d = r.created_at?.split('T')[0];
      if (d) byDate[d] = (byDate[d] || 0) + 1;
    });
    const activityDates = new Set(Object.keys(byDate));
    const streak = calcStreak(activityDates);

    // 이번 주
    const thisWeekDays = getThisWeekDays();
    const thisWeek = thisWeekDays.reduce((sum, { date }) => sum + (byDate[date] || 0), 0);
    const weeklyData = thisWeekDays.map(({ label, date }) => ({ label, count: byDate[date] || 0 }));

    // 30일 히트맵
    const heatmap = getLast30Days().map(date => ({ date, count: byDate[date] || 0 }));

    return {
      total, correct, judgedCount: judged.length, accuracy,
      bySubject, streak, thisWeek, weeklyData, heatmap,
      recent: rows.slice(0, 10),
    };
  }, [rows]);

  const handleSaveName = async () => {
    if (!user || !editName.trim()) return;
    setIsSaving(true);
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({ data: { name: editName.trim() } });
      await supabase.from('profiles').update({ name: editName.trim() }).eq('id', user.id);
      setName(editName.trim());
      setIsEditOpen(false);
    } catch (err) { console.error(err); }
    finally { setIsSaving(false); }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#F3F5F9]">
      <Navigation />
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    </div>
  );

  const subjectList = Object.entries(stats.bySubject).sort((a, b) => b[1].count - a[1].count);
  const maxSubjectCount = subjectList.length > 0 ? subjectList[0][1].count : 1;
  const maxWeekly = Math.max(...stats.weeklyData.map(d => d.count), 1);

  return (
    <div className="min-h-screen bg-[#F3F5F9]">
      <Navigation />
      <main className="max-w-[1400px] mx-auto p-6 md:p-8 lg:p-10">

        {/* 2컬럼 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* 왼쪽 컬럼 (5/12) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">

            {/* 프로필 카드 */}
            <article className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-5">
                <Avatar className="w-20 h-20 shrink-0">
                  <AvatarFallback className="bg-blue-500 text-white text-2xl font-bold">
                    {name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900">{name}</h2>
                  <p className="text-slate-500 text-sm mb-3">{user?.email}</p>
                  {/* 진행바 - 풀이 수 기반 */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5">
                      <div
                        className="bg-blue-500 h-2.5 rounded-full transition-all"
                        style={{ width: `${Math.min((stats.total / 100) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                      {stats.total}문제 달성
                    </span>
                  </div>
                </div>
              </div>
              {/* 이름 수정 버튼 */}
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full mt-4 text-xs border-slate-200"
                    onClick={() => setEditName(name)}>
                    <Edit3 className="w-3.5 h-3.5 mr-1.5" />이름 수정
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>프로필 수정</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label>이름</Label>
                      <Input value={editName} onChange={e => setEditName(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveName} disabled={isSaving} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" />저장</>}
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditOpen(false)} className="flex-1">
                        <X className="w-4 h-4 mr-1" />취소
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </article>

            {/* KPI 통계 3칸 */}
            <div className="grid grid-cols-3 gap-3">
              {/* 총 해결 문제 */}
              <div className="rounded-2xl p-4 bg-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs text-slate-500 font-semibold mb-1">총 해결 문제</p>
                <p className="text-2xl font-bold text-slate-800 mb-1">{stats.total.toLocaleString()}</p>
                <div className="text-xs font-medium text-green-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />이번 주 {stats.thisWeek}
                </div>
              </div>
              {/* 정답률 - 파란 배경으로 강조 */}
              <div className="rounded-2xl p-4 bg-blue-100 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs text-slate-600 font-semibold mb-1">정답률</p>
                <p className="text-2xl font-bold text-slate-900 mb-1">
                  {stats.judgedCount > 0 ? `${stats.accuracy}%` : '-'}
                </p>
                <div className="text-xs font-medium text-green-600">
                  {stats.judgedCount > 0 ? `${stats.correct}/${stats.judgedCount}` : '채점 없음'}
                </div>
              </div>
              {/* 연속 학습일 */}
              <div className="rounded-2xl p-4 bg-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs text-slate-500 font-semibold mb-1">연속 학습일</p>
                <p className="text-2xl font-bold text-slate-800 mb-1">{stats.streak}일</p>
                <div className="text-lg">🔥</div>
              </div>
            </div>

            {/* 과목별 성취도 */}
            <article className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex-grow">
              <h3 className="text-lg font-bold text-slate-900 mb-6">과목별 학습 성취도</h3>
              {subjectList.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">아직 풀은 문제가 없습니다</p>
              ) : (
                <div className="space-y-5">
                  {subjectList.slice(0, 5).map(([subject, { count, correct }]) => {
                    const subAcc = count > 0 ? Math.round((correct / count) * 100) : 0;
                    return (
                      <div key={subject} className="flex items-center gap-3">
                        <div className="w-8 flex justify-center shrink-0">
                          {/* 과목별 아이콘 - 색상 원 */}
                          <div className={`w-4 h-4 rounded-full ${getSubjectColor(subject)}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-bold text-slate-700">{subject}</span>
                            <span className="text-sm font-bold text-slate-900">{subAcc > 0 ? `${subAcc}%` : `${count}문제`}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-700"
                              style={{ width: `${(count / maxSubjectCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          </div>

          {/* 오른쪽 컬럼 (7/12) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">

            {/* 주간 학습 현황 바 차트 */}
            <article className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col" style={{ height: '380px' }}>
              <h3 className="text-lg font-bold text-slate-900 mb-6">주간 학습 현황</h3>
              <div className="flex-1 flex items-end justify-between px-4 sm:px-8 pb-2 relative">
                {/* 격자선 */}
                <div className="absolute inset-x-0 bottom-0 border-b border-slate-200 pointer-events-none" />
                <div className="absolute inset-x-0 border-b border-slate-100 pointer-events-none" style={{ bottom: '25%' }} />
                <div className="absolute inset-x-0 border-b border-slate-100 pointer-events-none" style={{ bottom: '50%' }} />
                <div className="absolute inset-x-0 border-b border-slate-100 pointer-events-none" style={{ bottom: '75%' }} />

                {stats.weeklyData.map(({ label, count }) => (
                  <div key={label} className="flex flex-col items-center z-10 w-full">
                    <span className="text-xs text-slate-500 font-medium mb-2 h-4">
                      {count > 0 ? `${count}문제` : ''}
                    </span>
                    <div
                      className="w-10 bg-blue-500 rounded-t-md hover:bg-blue-600 transition-all duration-300"
                      style={{ height: `${maxWeekly > 0 ? Math.max((count / maxWeekly) * 200, count > 0 ? 8 : 0) : 0}px` }}
                    />
                    <span className="mt-3 text-sm font-semibold text-slate-600">{label}</span>
                  </div>
                ))}
              </div>
            </article>

            {/* 30일 학습 기록 (파란 히트맵) */}
            <article className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex-grow">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900">30일 학습 기록</h3>
                <div className="text-xs text-slate-500 flex items-center mt-2 sm:mt-0 gap-1">
                  <span className="mr-1">적음</span>
                  <div className="w-3 h-3 bg-blue-50 rounded-sm" />
                  <div className="w-3 h-3 bg-blue-200 rounded-sm" />
                  <div className="w-3 h-3 bg-blue-400 rounded-sm" />
                  <div className="w-3 h-3 bg-blue-700 rounded-sm" />
                  <span className="ml-1">많음 (진한 파랑)</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {stats.heatmap.map(({ date, count }) => (
                  <div
                    key={date}
                    title={`${date}: ${count}문제`}
                    className={`w-6 h-6 rounded ${heatColor(count)} cursor-default`}
                  />
                ))}
              </div>
            </article>
          </div>
        </div>
      </main>
    </div>
  );
}
