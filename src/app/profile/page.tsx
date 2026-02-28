"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import {
  Trophy, TrendingUp, Clock, Edit3, Save, X, Loader2, BookOpen,
  Target, Flame, Calendar, CheckCircle2, XCircle,
} from "lucide-react";
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

// SVG 도넛 차트
function DonutChart({ percent }: { percent: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = percent >= 70 ? '#22c55e' : percent >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <svg width="130" height="130" viewBox="0 0 130 130">
      <circle cx="65" cy="65" r={r} fill="none" stroke="#e5e7eb" strokeWidth="13" className="dark:stroke-gray-700" />
      <circle
        cx="65" cy="65" r={r} fill="none"
        stroke={color} strokeWidth="13"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 65 65)"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <text x="65" y="60" textAnchor="middle" fontSize="22" fontWeight="bold" fill="currentColor">
        {percent}%
      </text>
      <text x="65" y="78" textAnchor="middle" fontSize="11" fill="#9ca3af">
        정답률
      </text>
    </svg>
  );
}

// 히트맵 색상 (하루 풀이 수 기준)
function heatColor(count: number): string {
  if (count === 0) return 'bg-gray-100 dark:bg-gray-700';
  if (count <= 2)  return 'bg-green-200 dark:bg-green-800';
  if (count <= 5)  return 'bg-green-400 dark:bg-green-600';
  return 'bg-green-600 dark:bg-green-400';
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">학습 대시보드</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">나의 수능 학습 현황을 한눈에 확인하세요</p>
        </div>

        {/* ── 상단: 프로필 + KPI ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* 프로필 카드 */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-6 pb-5 flex flex-col items-center text-center gap-3">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-blue-600 text-white text-2xl font-bold">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{name}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                <p className="text-xs text-gray-400 mt-1">
                  가입일 {user?.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'}
                </p>
              </div>
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full text-xs dark:border-gray-600 dark:text-gray-300"
                    onClick={() => setEditName(name)}>
                    <Edit3 className="w-3.5 h-3.5 mr-1.5" />이름 수정
                  </Button>
                </DialogTrigger>
                <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
                  <DialogHeader><DialogTitle className="dark:text-gray-100">프로필 수정</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label className="dark:text-gray-300">이름</Label>
                      <Input value={editName} onChange={e => setEditName(e.target.value)}
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
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

          {/* KPI 카드 4개 */}
          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                    <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">총 풀이</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                <div className="text-xs text-gray-400 mt-0.5">문제</div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-green-100 dark:bg-green-900/40 rounded-lg">
                    <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">정답률</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.judgedCount > 0 ? `${stats.accuracy}%` : '-'}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {stats.judgedCount > 0 ? `${stats.correct}/${stats.judgedCount} 채점` : '채점 없음'}
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-orange-100 dark:bg-orange-900/40 rounded-lg">
                    <Flame className="w-4 h-4 text-orange-500" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">연속 학습</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.streak}</div>
                <div className="text-xs text-gray-400 mt-0.5">일째</div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                    <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">이번 주</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.thisWeek}</div>
                <div className="text-xs text-gray-400 mt-0.5">문제 풀이</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── 정확도 도넛 + 주간 바 차트 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 정답률 도넛 */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 dark:text-gray-100">
                <Trophy className="w-4 h-4 text-yellow-500" />
                정답률 분석
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.judgedCount === 0 ? (
                <div className="flex items-center justify-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                  채점된 문제가 없습니다
                </div>
              ) : (
                <div className="flex items-center gap-6">
                  <DonutChart percent={stats.accuracy} />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">정답</span>
                          <span className="font-semibold text-green-600">{stats.correct}문제</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                          <div className="h-1.5 bg-green-500 rounded-full transition-all duration-700"
                            style={{ width: `${(stats.correct / stats.judgedCount) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">오답</span>
                          <span className="font-semibold text-red-500">{stats.judgedCount - stats.correct}문제</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                          <div className="h-1.5 bg-red-400 rounded-full transition-all duration-700"
                            style={{ width: `${((stats.judgedCount - stats.correct) / stats.judgedCount) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 이번 주 바 차트 */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 dark:text-gray-100">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                이번 주 학습
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2" style={{ height: '110px' }}>
                {stats.weeklyData.map(({ label, count }) => (
                  <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium h-4">
                      {count > 0 ? count : ''}
                    </span>
                    <div className="w-full rounded-t-sm bg-blue-100 dark:bg-blue-900/30 flex items-end" style={{ height: '72px' }}>
                      <div
                        className="w-full rounded-t-sm bg-blue-500 transition-all duration-500"
                        style={{ height: `${maxWeekly > 0 ? Math.max((count / maxWeekly) * 100, count > 0 ? 8 : 0) : 0}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">{label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── 30일 히트맵 ── */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 dark:text-gray-100">
              <Calendar className="w-4 h-4 text-green-500" />
              30일 학습 기록
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {stats.heatmap.map(({ date, count }) => (
                <div
                  key={date}
                  title={`${date}: ${count}문제`}
                  className={`w-7 h-7 rounded-md ${heatColor(count)} cursor-default transition-colors`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-gray-400 dark:text-gray-500">
              <span>적음</span>
              <div className="flex gap-1">
                {[
                  'bg-gray-100 dark:bg-gray-700',
                  'bg-green-200 dark:bg-green-800',
                  'bg-green-400 dark:bg-green-600',
                  'bg-green-600 dark:bg-green-400',
                ].map((c, i) => (
                  <div key={i} className={`w-4 h-4 rounded-sm ${c}`} />
                ))}
              </div>
              <span>많음</span>
            </div>
          </CardContent>
        </Card>

        {/* ── 과목별 분포 + 최근 활동 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 과목별 분포 */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 dark:text-gray-100">
                <BookOpen className="w-4 h-4 text-purple-500" />
                과목별 풀이
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subjectList.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                  아직 풀은 문제가 없습니다
                </div>
              ) : (
                <div className="space-y-3">
                  {subjectList.map(([subject, { count, correct }]) => {
                    const subAcc = count > 0 ? Math.round((correct / count) * 100) : 0;
                    return (
                      <div key={subject}>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${getSubjectColor(subject)}`} />
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{subject}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{count}문제</span>
                            {correct > 0 && (
                              <span className="text-xs text-green-500 ml-2">{subAcc}% 정답</span>
                            )}
                          </div>
                        </div>
                        <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                          <div
                            className={`h-2 rounded-full ${getSubjectColor(subject)} transition-all duration-700`}
                            style={{ width: `${(count / maxSubjectCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 최근 활동 */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 dark:text-gray-100">
                <Clock className="w-4 h-4 text-blue-500" />
                최근 활동
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recent.length === 0 ? (
                <p className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">최근 활동이 없습니다</p>
              ) : (
                <div className="space-y-0">
                  {stats.recent.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${getSubjectColor(r.subject || '기타')}`} />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 block truncate">
                          {r.subject || '기타'} 문제
                        </span>
                        {r.tags && r.tags.length > 0 && (
                          <span className="text-[10px] text-gray-400">{r.tags.slice(0, 2).join(', ')}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {r.is_correct !== null && (
                          r.is_correct
                            ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                            : <XCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span className="text-xs text-gray-400">{r.created_at?.split('T')[0]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
