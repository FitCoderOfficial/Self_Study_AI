"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import AccessibilityFeatures from "@/components/AccessibilityFeatures";
import MathContent from "@/components/MathContent";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import {
  BookOpen, CheckCircle, XCircle, Filter, Sparkles, Loader2,
  Search, ChevronDown, ChevronUp, Trash2, Eye, Tag
} from "lucide-react";
import type { SimilarQuestion } from "@/app/api/similar-question/route";

interface ArchiveItem {
  id: string;
  questionId?: string;
  subject: string;
  question: string;
  explanation?: string;
  date: string;
  isCorrect: boolean | null;
  difficulty: string;
  tags: string[];
}

const SUBJECTS = ['전체', '수학', '영어', '국어', '사회', '과학', '기타'];
const DIFFICULTY_LABELS: Record<string, string> = { easy: '쉬움', medium: '보통', hard: '어려움' };

export default function ArchivePage() {
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('전체');
  const [filterCorrect, setFilterCorrect] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [similarQuestions, setSimilarQuestions] = useState<Record<string, SimilarQuestion>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);

      if (user) {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (!error && data) {
          setItems(data.map(q => ({
            id: q.id,
            questionId: q.id,
            subject: q.subject || '기타',
            question: q.ocr_text || '',
            explanation: q.ai_explanation,
            date: new Date(q.created_at).toISOString().split('T')[0],
            isCorrect: q.is_correct,
            difficulty: q.difficulty || 'medium',
            tags: q.tags || [],
          })));
          setIsLoading(false);
          return;
        }
      }

      const local = JSON.parse(localStorage.getItem('archivedQuestions') || '[]');
      setItems(local);
    } catch (err) {
      console.error('로드 오류:', err);
      const local = JSON.parse(localStorage.getItem('archivedQuestions') || '[]');
      setItems(local);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const filtered = items.filter(item => {
    if (selectedSubject !== '전체' && item.subject !== selectedSubject) return false;
    if (filterCorrect === 'correct' && !item.isCorrect) return false;
    if (filterCorrect === 'incorrect' && item.isCorrect !== false) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        item.subject.toLowerCase().includes(q) ||
        item.question.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('questions').delete().eq('id', id).eq('user_id', user.id);
      }
    } catch {}
    const local = JSON.parse(localStorage.getItem('archivedQuestions') || '[]');
    localStorage.setItem('archivedQuestions', JSON.stringify(local.filter((i: ArchiveItem) => i.id !== id)));
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleGenerateSimilar = async (item: ArchiveItem) => {
    setGeneratingId(item.id);
    try {
      const response = await fetch('/api/similar-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemText: item.question, subject: item.subject }),
      });
      const data = await response.json();
      if (data.success && data.similarQuestion) {
        setSimilarQuestions(prev => ({ ...prev, [item.id]: data.similarQuestion }));
      } else {
        alert(data.error || '유사 문제 생성 중 오류가 발생했습니다.');
      }
    } catch {
      alert('유사 문제 생성 중 오류가 발생했습니다.');
    } finally {
      setGeneratingId(null);
    }
  };

  const totalCount = items.length;
  const correctCount = items.filter(i => i.isCorrect === true).length;
  const incorrectCount = items.filter(i => i.isCorrect === false).length;
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">학습 히스토리</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            풀었던 문제들을 다시 확인하고 <span className="font-semibold text-purple-600">유사 문제를 생성</span>하세요
          </p>
          {!isLoggedIn && (
            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg inline-block">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                <Link href="/login" className="font-semibold underline">로그인</Link>하면 모든 기기에서 히스토리를 동기화할 수 있습니다
              </p>
            </div>
          )}
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon: BookOpen, label: '총 문제', value: totalCount, color: 'text-blue-600 bg-blue-100' },
            { icon: CheckCircle, label: '정답', value: correctCount, color: 'text-green-600 bg-green-100' },
            { icon: XCircle, label: '오답', value: incorrectCount, color: 'text-red-600 bg-red-100' },
            { icon: Filter, label: '정답률', value: `${accuracy}%`, color: 'text-purple-600 bg-purple-100' },
          ].map(({ icon: Icon, label, value, color }) => (
            <Card key={label} className="dark:bg-gray-800 dark:border-gray-700 text-center shadow-sm">
              <CardContent className="pt-5 pb-5">
                <div className={`w-10 h-10 ${color} dark:opacity-80 rounded-full flex items-center justify-center mx-auto mb-2`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 필터 */}
        <Card className="mb-6 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="문제 내용, 태그로 검색..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedSubject(s)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedSubject === s
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
                <div className="border-l dark:border-gray-600 mx-1" />
                {(['all', 'correct', 'incorrect'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterCorrect(f)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      filterCorrect === f
                        ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {f === 'all' ? '전체' : f === 'correct' ? '정답만' : '오답만'}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 문제 목록 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mr-3" />
            <span className="text-gray-600 dark:text-gray-300">불러오는 중...</span>
          </div>
        ) : filtered.length === 0 ? (
          <Card className="text-center py-16 dark:bg-gray-800 dark:border-gray-700">
            <CardContent>
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300 text-lg mb-2">
                {items.length === 0 ? '아직 풀었던 문제가 없습니다' : '조건에 맞는 문제가 없습니다'}
              </p>
              {items.length === 0 && (
                <Link href="/solve">
                  <Button className="mt-3 bg-blue-600 hover:bg-blue-700 text-white">첫 번째 문제 풀기</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{filtered.length}개의 문제</p>
            {filtered.map(item => {
              const isExpanded = expandedId === item.id;
              const sq = similarQuestions[item.id];
              const isAnswerRevealed = revealedAnswers[item.id];

              return (
                <Card key={item.id} className="dark:bg-gray-800 dark:border-gray-700 shadow-sm">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-xs">
                            {item.subject}
                          </Badge>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{item.date}</span>
                          {item.difficulty && (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                              {DIFFICULTY_LABELS[item.difficulty] || item.difficulty}
                            </span>
                          )}
                          {item.isCorrect !== null && (
                            item.isCorrect
                              ? <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400"><CheckCircle className="w-3 h-3" />정답</span>
                              : <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400"><XCircle className="w-3 h-3" />오답</span>
                          )}
                        </div>
                        <p className="text-gray-900 dark:text-gray-100 leading-relaxed line-clamp-2 text-sm">
                          {item.question?.replace(/\$.*?\$/g, '[수식]').substring(0, 150)}...
                        </p>
                        {item.tags.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {item.tags.map(tag => (
                              <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="h-8 px-2 dark:text-gray-400"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="h-8 px-2 text-red-500 hover:text-red-700 dark:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t dark:border-gray-700 pt-4 space-y-4">
                      {/* 문제 */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">문제</h4>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-sm">
                          <MathContent content={item.question} className="text-gray-900 dark:text-gray-100" />
                        </div>
                      </div>

                      {/* AI 해설 */}
                      {item.explanation && (
                        <div>
                          <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">AI 해설</h4>
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 text-sm">
                            <MathContent content={item.explanation} className="text-gray-900 dark:text-gray-100" />
                          </div>
                        </div>
                      )}

                      {/* 유사 문제 생성 버튼 */}
                      {!sq && (
                        <Button
                          onClick={() => handleGenerateSimilar(item)}
                          disabled={generatingId === item.id}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          {generatingId === item.id ? (
                            <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />생성 중...</>
                          ) : (
                            <><Sparkles className="w-3 h-3 mr-1.5" />유사 문제 생성</>
                          )}
                        </Button>
                      )}

                      {/* 생성된 유사 문제 */}
                      {sq && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4" />AI 유사 문제
                            </h4>
                            <Button
                              onClick={() => handleGenerateSimilar(item)}
                              disabled={generatingId === item.id}
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs dark:text-gray-400"
                            >
                              {generatingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : '다시 생성'}
                            </Button>
                          </div>

                          {/* 핵심 개념 */}
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
                                className={`p-2.5 rounded-lg border text-sm transition-colors ${
                                  isAnswerRevealed && sq.answer === i + 1
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 font-medium'
                                    : 'border-gray-200 dark:border-gray-600 dark:text-gray-300'
                                }`}
                              >
                                <MathContent content={choice} />
                                {isAnswerRevealed && sq.answer === i + 1 && (
                                  <span className="ml-1 text-green-600 font-bold">✓ 정답</span>
                                )}
                              </div>
                            ))}
                          </div>

                          <Button
                            onClick={() => setRevealedAnswers(prev => ({ ...prev, [item.id]: !isAnswerRevealed }))}
                            variant="outline"
                            size="sm"
                            className="dark:border-gray-600 dark:text-gray-300"
                          >
                            {isAnswerRevealed ? '정답 숨기기' : '정답 보기'}
                          </Button>

                          {isAnswerRevealed && sq.solution && (
                            <div className="bg-white dark:bg-gray-700/50 rounded-lg p-3 border dark:border-gray-600 text-sm">
                              <MathContent content={sq.solution} className="text-gray-800 dark:text-gray-200" />
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
      </main>

      <AccessibilityFeatures />
    </div>
  );
}
