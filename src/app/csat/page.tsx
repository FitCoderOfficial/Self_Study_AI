"use client";

import { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import MathContent from '@/components/MathContent';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search, GraduationCap, Sparkles, Loader2, ChevronDown, ChevronUp,
  BookOpen, Tag, ExternalLink, FileText, AlertTriangle,
} from 'lucide-react';
import type { SimilarQuestion } from '@/app/api/similar-question/route';

interface CsatProblem {
  id: string;
  year: number;
  month: number;
  subject: string;
  sub_subject: string | null;
  number: number;
  content: string;
  choices: string[] | null;
  answer: number | null;
  explanation: string;
  difficulty: string;
  tags: string[];
}

const SUBJECTS = ['전체', '수학', '영어', '국어', '사회', '과학'];
// 학년도 기준 (2026학년도 = 2025년 11월 시행)
const YEARS = [2026, 2025, 2024, 2023, 2022, 2021];
const MONTHS: { label: string; value: number }[] = [
  { label: '수능 (11월)', value: 11 },
  { label: '9월 모의평가', value: 9 },
  { label: '6월 모의평가', value: 6 },
];
const DIFFICULTY_MAP: Record<string, { label: string; color: string }> = {
  easy: { label: '쉬움', color: 'bg-green-100 text-green-700' },
  medium: { label: '보통', color: 'bg-yellow-100 text-yellow-700' },
  hard: { label: '어려움', color: 'bg-red-100 text-red-700' },
};

/** 공식 시험지 출처 링크 */
const OFFICIAL_LINKS = [
  {
    title: 'KICE 수능 기출문제 (공식)',
    desc: '한국교육과정평가원 공식 기출문제 목록 — PDF 다운로드 가능',
    url: 'https://www.suneung.re.kr/sub/info.do?m=0405&s=suneung',
    badge: '공식',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  {
    title: 'EBSi 수능 기출문제',
    desc: 'EBS 수능 강의 사이트 — 과목별 기출문제 열람 (무료 회원가입 필요)',
    url: 'https://www.ebsi.co.kr/ebs/pot/potn/index.ebs',
    badge: 'EBS',
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
  {
    title: 'KICE 기출문제 안내 (kice.re.kr)',
    desc: '한국교육과정평가원 — 수능·모의평가 기출 자료 안내 페이지',
    url: 'https://www.kice.re.kr/sub/info.do?m=0303&s=kice',
    badge: '공식',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
];

export default function CsatPage() {
  const [activeTab, setActiveTab] = useState<'problems' | 'viewer'>('problems');
  const [problems, setProblems] = useState<CsatProblem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(11);
  const [selectedSubject, setSelectedSubject] = useState('전체');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [similarQuestions, setSimilarQuestions] = useState<Record<string, SimilarQuestion>>({});
  const [showAnswer, setShowAnswer] = useState<Record<string, boolean>>({});
  const [showSimilarAnswer, setShowSimilarAnswer] = useState<Record<string, boolean>>({});
  const [source, setSource] = useState<'database' | 'sample'>('sample');

  const fetchProblems = useCallback(async () => {
    setIsLoading(true);
    setExpandedId(null);
    try {
      const params = new URLSearchParams({
        year: selectedYear.toString(),
        month: selectedMonth.toString(),
        subject: selectedSubject,
        ...(searchQuery && { search: searchQuery }),
      });
      const response = await fetch(`/api/csat?${params}`);
      const data = await response.json();
      if (data.success) {
        setProblems(data.problems);
        setSource(data.source);
      }
    } catch (error) {
      console.error('수능 문제 로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth, selectedSubject, searchQuery]);

  useEffect(() => { fetchProblems(); }, [fetchProblems]);

  const handleGenerateSimilar = async (problem: CsatProblem) => {
    setGeneratingId(problem.id);
    setSimilarQuestions(prev => { const n = {...prev}; delete n[problem.id]; return n; });
    setShowSimilarAnswer(prev => { const n = {...prev}; delete n[problem.id]; return n; });
    try {
      const problemText = [
        problem.content,
        problem.choices ? problem.choices.map((c, i) => `${['①','②','③','④','⑤'][i]} ${c}`).join('\n') : '',
      ].filter(Boolean).join('\n\n');

      const response = await fetch('/api/similar-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemText, subject: problem.subject }),
      });
      const data = await response.json();
      if (data.success && data.similarQuestion) {
        setSimilarQuestions(prev => ({ ...prev, [problem.id]: data.similarQuestion }));
      } else {
        alert(data.error || '유사 문제 생성 중 오류가 발생했습니다.');
      }
    } catch {
      alert('유사 문제 생성 중 오류가 발생했습니다.');
    } finally {
      setGeneratingId(null);
    }
  };

  const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || '';

  const selectClass = "px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium mb-4">
            <GraduationCap className="w-4 h-4 mr-2" />
            수능 기출 문제
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            수능 기출문제 풀기
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            역대 수능 기출문제를 풀고 <span className="font-semibold text-purple-600 dark:text-purple-400">AI로 유사 문제를 생성</span>하세요
          </p>
          {source === 'sample' && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              * 현재 샘플 데이터를 표시 중입니다. Supabase 설정 후 실제 수능 문제를 등록하세요.
            </p>
          )}
        </div>

        {/* 필터 (드롭다운) */}
        <Card className="mb-5 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap items-end gap-4">
              {/* 연도 드롭다운 */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">연도</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className={selectClass}
                >
                  {YEARS.map(y => (
                    <option key={y} value={y}>{y}년</option>
                  ))}
                </select>
              </div>

              {/* 시험 종류 드롭다운 */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">시험</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className={selectClass}
                >
                  {MONTHS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* 과목 버튼 */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">과목</p>
                <div className="flex gap-1.5 flex-wrap">
                  {SUBJECTS.map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedSubject(s)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedSubject === s
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 검색 */}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="키워드로 문제 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 dark:bg-gray-700 dark:border-gray-600"
                onKeyDown={(e) => e.key === 'Enter' && fetchProblems()}
              />
            </div>
          </CardContent>
        </Card>

        {/* 탭 */}
        <div className="flex gap-1 mb-5 border-b dark:border-gray-700">
          <button
            onClick={() => setActiveTab('problems')}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
              activeTab === 'problems'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            문제 목록
          </button>
          <button
            onClick={() => setActiveTab('viewer')}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
              activeTab === 'viewer'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            시험지 보기
          </button>
        </div>

        {/* ── 탭 1: 문제 목록 ── */}
        {activeTab === 'problems' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {selectedYear}년 {monthLabel} {selectedSubject !== '전체' ? selectedSubject : ''} 기출문제
                <span className="ml-2 text-blue-600 dark:text-blue-400">({problems.length}문항)</span>
              </h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mr-3" />
                <span className="text-gray-600 dark:text-gray-300">문제를 불러오는 중...</span>
              </div>
            ) : problems.length === 0 ? (
              <Card className="text-center py-16 dark:bg-gray-800 dark:border-gray-700">
                <CardContent>
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300 text-lg mb-2">문제를 찾을 수 없습니다</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">다른 연도나 과목을 선택해보세요</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {problems.map((problem) => {
                  const isExpanded = expandedId === problem.id;
                  const difficulty = DIFFICULTY_MAP[problem.difficulty] || DIFFICULTY_MAP.medium;
                  const sq = similarQuestions[problem.id];
                  const isAnswerShown = showAnswer[problem.id];
                  const isSimilarAnswerShown = showSimilarAnswer[problem.id];

                  return (
                    <Card key={problem.id} className="dark:bg-gray-800 dark:border-gray-700 shadow-sm">
                      <div
                        className="flex items-start justify-between p-5 cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : problem.id)}
                      >
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs">
                              {problem.number}번
                            </Badge>
                            <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300">
                              {problem.subject}{problem.sub_subject ? ` - ${problem.sub_subject}` : ''}
                            </Badge>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficulty.color}`}>
                              {difficulty.label}
                            </span>
                            {problem.tags.map(tag => (
                              <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="text-gray-900 dark:text-gray-100 font-medium leading-relaxed text-sm">
                            <MathContent content={problem.content} />
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="flex-shrink-0">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>

                      {isExpanded && (
                        <div className="px-5 pb-5 border-t dark:border-gray-700 pt-4 space-y-4">
                          {problem.choices && (
                            <div className="space-y-2">
                              {problem.choices.map((choice, i) => (
                                <div
                                  key={i}
                                  className={`p-3 rounded-lg border text-sm leading-relaxed flex gap-2 ${
                                    isAnswerShown && problem.answer === i + 1
                                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-medium'
                                      : 'border-gray-200 dark:border-gray-600 dark:text-gray-300'
                                  }`}
                                >
                                  <span className="font-bold flex-shrink-0">{['①','②','③','④','⑤'][i]}</span>
                                  <MathContent content={choice} />
                                  {isAnswerShown && problem.answer === i + 1 && (
                                    <span className="ml-1 text-green-600 dark:text-green-400 font-bold flex-shrink-0">✓ 정답</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                            <Button
                              onClick={() => setShowAnswer(prev => ({ ...prev, [problem.id]: !isAnswerShown }))}
                              variant="outline"
                              size="sm"
                              className="dark:border-gray-600 dark:text-gray-300"
                            >
                              {isAnswerShown ? '해설 숨기기' : '정답 & 해설 보기'}
                            </Button>
                            <Button
                              onClick={() => handleGenerateSimilar(problem)}
                              disabled={generatingId === problem.id}
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              {generatingId === problem.id ? (
                                <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />생성 중...</>
                              ) : (
                                <><Sparkles className="w-3 h-3 mr-1.5" />유사 문제 생성</>
                              )}
                            </Button>
                          </div>

                          {isAnswerShown && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                              <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2 text-sm">풀이 & 해설</h4>
                              <div className="text-sm text-gray-700 dark:text-gray-300">
                                <MathContent content={problem.explanation} />
                              </div>
                            </div>
                          )}

                          {sq && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1.5 text-sm">
                                  <Sparkles className="w-4 h-4" />AI 유사 문제
                                </h4>
                                <Button
                                  onClick={() => handleGenerateSimilar(problem)}
                                  disabled={generatingId === problem.id}
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs dark:text-gray-400"
                                >
                                  다시 생성
                                </Button>
                              </div>

                              {sq.keyConcepts.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  <Tag className="w-3 h-3 text-gray-400" />
                                  {sq.keyConcepts.map((c, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                                      {c}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              <div className="text-sm text-gray-800 dark:text-gray-200">
                                <MathContent content={sq.problem} />
                              </div>

                              <div className="space-y-1.5">
                                {sq.choices.map((choice, i) => (
                                  <div
                                    key={i}
                                    className={`p-2.5 rounded-lg border text-sm flex gap-2 ${
                                      isSimilarAnswerShown && sq.answer === i + 1
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium'
                                        : 'border-gray-200 dark:border-gray-600 dark:text-gray-300'
                                    }`}
                                  >
                                    <span className="font-bold flex-shrink-0">{['①','②','③','④','⑤'][i]}</span>
                                    <MathContent content={choice} />
                                    {isSimilarAnswerShown && sq.answer === i + 1 && (
                                      <span className="ml-1 text-green-600 font-bold flex-shrink-0">✓</span>
                                    )}
                                  </div>
                                ))}
                              </div>

                              <Button
                                onClick={() => setShowSimilarAnswer(prev => ({ ...prev, [problem.id]: !isSimilarAnswerShown }))}
                                variant="outline"
                                size="sm"
                                className="dark:border-gray-600 dark:text-gray-300"
                              >
                                {isSimilarAnswerShown ? '정답 숨기기' : '정답 & 풀이 보기'}
                              </Button>

                              {isSimilarAnswerShown && (
                                <div className="space-y-2">
                                  <div className="bg-white dark:bg-gray-700/50 rounded-lg p-3 border dark:border-gray-600 text-sm">
                                    <MathContent content={sq.solution} className="text-gray-800 dark:text-gray-200" />
                                  </div>
                                  {sq.wrongAnswerExplanation && (
                                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800 text-sm">
                                      <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-1">오답 함정</p>
                                      <MathContent content={sq.wrongAnswerExplanation} className="text-gray-700 dark:text-gray-300" />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── 탭 2: 시험지 보기 ── */}
        {activeTab === 'viewer' && (
          <div className="space-y-4">
            {/* 안내 배너 */}
            <Card className="dark:bg-gray-800 dark:border-gray-700 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-300 mb-1">직접 임베드가 불가능합니다</p>
                    <p className="text-amber-700 dark:text-amber-400">
                      KICE 공식 시험지 페이지는 시험 직후 며칠만 임시 운영 후 삭제됩니다.
                      아래 영구 공식 사이트에서 PDF를 다운로드하거나 열람하세요.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 공식 출처 링크 카드 */}
            <div className="grid sm:grid-cols-3 gap-4">
              {OFFICIAL_LINKS.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <Card className="h-full dark:bg-gray-800 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all">
                    <CardContent className="pt-5 pb-5">
                      <div className="flex items-start justify-between mb-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${link.badgeClass}`}>
                          {link.badge}
                        </span>
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1.5 leading-snug">
                        {link.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        {link.desc}
                      </p>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>

            {/* 이용 방법 안내 */}
            <Card className="dark:bg-gray-800 dark:border-gray-700 shadow-sm">
              <CardContent className="pt-5 pb-5">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  수능 시험지 열람 방법
                </h3>
                <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2.5 list-decimal list-inside">
                  <li>
                    <strong className="text-gray-700 dark:text-gray-300">KICE 공식 기출문제 페이지</strong> 접속
                    <span className="block ml-5 text-xs mt-0.5 text-gray-500">suneung.re.kr → 기출문제 메뉴</span>
                  </li>
                  <li>
                    원하는 <strong className="text-gray-700 dark:text-gray-300">연도 및 시험 종류</strong> 선택
                    <span className="block ml-5 text-xs mt-0.5 text-gray-500">수능(11월), 9월/6월 모의평가</span>
                  </li>
                  <li>
                    과목별 <strong className="text-gray-700 dark:text-gray-300">PDF 파일 다운로드</strong> 또는 온라인 열람
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
