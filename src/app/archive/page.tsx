"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
  Search, ChevronDown, ChevronUp, Trash2, Tag, Pencil, X, Check, Plus, Eye, EyeOff,
} from "lucide-react";
import type { SimilarQuestion } from "@/app/api/similar-question/route";
import NotionExportButton from "@/components/NotionExportButton";
import PdfExportButton from "@/components/PdfExportButton";

interface ArchiveItem {
  id: string;
  questionId?: string;
  subject: string;
  question: string;       // full text including ①②③④⑤ choices
  explanation?: string;
  imageUrl?: string;
  date: string;
  isCorrect: boolean | null;
  difficulty: string;
  tags: string[];
  score: number | null;
  problemNumber: number | null;
  problemArea: string;
}

// ── 선택지 파싱 ───────────────────────────────────────────────
const CHOICE_MARKERS = ['①', '②', '③', '④', '⑤'] as const;

function parseProblem(text: string): { stem: string; choices: string[] } {
  const firstIdx = text.indexOf('①');
  if (firstIdx === -1) return { stem: text.trim(), choices: [] };

  const stem = text.substring(0, firstIdx).trim();
  const rest = text.substring(firstIdx);
  const choices: string[] = [];

  for (let i = 0; i < CHOICE_MARKERS.length; i++) {
    const marker = CHOICE_MARKERS[i];
    const start = rest.indexOf(marker);
    if (start === -1) break;
    const nextMarker = i < CHOICE_MARKERS.length - 1 ? CHOICE_MARKERS[i + 1] : null;
    if (nextMarker) {
      const nextStart = rest.indexOf(nextMarker, start + 1);
      choices.push(nextStart === -1
        ? rest.substring(start).trim()
        : rest.substring(start, nextStart).trim());
    } else {
      choices.push(rest.substring(start).trim());
    }
  }
  return { stem, choices };
}

function isMultiAnswer(stem: string): boolean {
  return /모두\s*고르|옳은\s*것을\s*모두|있는\s*것을\s*모두|바르게\s*묶/.test(stem);
}

// ── 상수 ─────────────────────────────────────────────────────
const SUBJECTS = ['전체', '수학', '영어', '국어', '사회', '과학', '기타'];
const DIFFICULTY_LABELS: Record<string, string> = { easy: '쉬움', medium: '보통', hard: '어려움' };

// 수능 과목 프리셋 태그
const PRESET_TAGS: { group: string; tags: string[] }[] = [
  { group: '국어',  tags: ['화법과작문', '언어와매체'] },
  { group: '수학',  tags: ['확률과통계', '미적분', '기하'] },
  { group: '사탐',  tags: ['생활과윤리', '윤리와사상', '한국지리', '세계지리', '동아시아사', '세계사', '경제', '정치와법', '사회문화'] },
  { group: '과탐',  tags: ['물리학Ⅰ', '물리학Ⅱ', '화학Ⅰ', '화학Ⅱ', '생명과학Ⅰ', '생명과학Ⅱ', '지구과학Ⅰ', '지구과학Ⅱ'] },
  { group: '직탐',  tags: ['농업기초기술', '공업일반', '수산·해운산업기초', '인간발달'] },
  { group: '2외한', tags: ['독일어Ⅰ', '프랑스어Ⅰ', '스페인어Ⅰ', '중국어Ⅰ', '일본어Ⅰ', '러시아어Ⅰ', '아랍어Ⅰ', '베트남어Ⅰ', '한문Ⅰ'] },
  { group: '기타',  tags: ['한국사', '영어듣기', '수능특강', '수능완성'] },
];

// ── 메인 컴포넌트 ─────────────────────────────────────────────
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
  const [revealedExplanations, setRevealedExplanations] = useState<Record<string, boolean>>({});
  // key = `${itemId}:orig` | `${itemId}:sim`
  const [selectedChoices, setSelectedChoices] = useState<Record<string, number[]>>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 태그 인라인 편집 / 과목+배점 다이얼로그 편집
  const [editingTagsId, setEditingTagsId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [editDialog, setEditDialog] = useState<{ id: string; subject: string; score: string } | null>(null);

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
            imageUrl: q.image_url ?? undefined,
            date: new Date(q.created_at).toISOString().split('T')[0],
            isCorrect: q.is_correct,
            difficulty: q.difficulty || 'medium',
            tags: q.tags || [],
            score: q.score ?? null,
            problemNumber: q.problem_number ?? null,
            problemArea: q.problem_area ?? '',
          })));
          setIsLoading(false);
          return;
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const local: any[] = JSON.parse(localStorage.getItem('archivedQuestions') || '[]');
      setItems(local.map(q => ({
        ...q,
        score: q.score ?? null,
        problemNumber: q.problemNumber ?? null,
        problemArea: q.problemArea ?? '',
      })));
    } catch (err) {
      console.error('로드 오류:', err);
      const local = JSON.parse(localStorage.getItem('archivedQuestions') || '[]');
      setItems(local);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const filtered = useMemo(() => items.filter(item => {
    if (selectedSubject !== '전체' && item.subject !== selectedSubject) return false;
    if (filterCorrect === 'correct' && !item.isCorrect) return false;
    if (filterCorrect === 'incorrect' && item.isCorrect !== false) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        item.subject.toLowerCase().includes(q) ||
        item.question.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q)) ||
        (item.problemNumber !== null && String(item.problemNumber).includes(q)) ||
        (item.score !== null && `${item.score}점`.includes(q)) ||
        (item.problemArea && item.problemArea.toLowerCase().includes(q))
      );
    }
    return true;
  }), [items, selectedSubject, filterCorrect, query]);

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('questions').delete().eq('id', id).eq('user_id', user.id);
      }
    } catch { /* local-only fallback */ }
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

  const toggleChoice = (key: string, index: number, multi: boolean) => {
    setSelectedChoices(prev => {
      const current = prev[key] ?? [];
      if (multi) {
        return {
          ...prev,
          [key]: current.includes(index)
            ? current.filter(i => i !== index)
            : [...current, index],
        };
      }
      return { ...prev, [key]: current[0] === index ? [] : [index] };
    });
  };

  // ── 태그 / 배점 저장 ─────────────────────────────────────────
  const persistItem = async (itemId: string, patch: Partial<ArchiveItem>) => {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, ...patch } : i));
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dbPatch: Record<string, any> = {};
        if ('tags' in patch)    dbPatch.tags    = patch.tags;
        if ('score' in patch)   dbPatch.score   = patch.score;
        if ('subject' in patch) dbPatch.subject = patch.subject;
        if (Object.keys(dbPatch).length)
          await supabase.from('questions').update(dbPatch).eq('id', itemId).eq('user_id', user.id);
      } else {
        const local: ArchiveItem[] = JSON.parse(localStorage.getItem('archivedQuestions') || '[]');
        localStorage.setItem('archivedQuestions',
          JSON.stringify(local.map(i => i.id === itemId ? { ...i, ...patch } : i)));
      }
    } catch { /* ignore */ }
  };

  const handleSaveEdit = () => {
    if (!editDialog) return;
    const v = editDialog.score.trim() ? parseInt(editDialog.score) : null;
    persistItem(editDialog.id, {
      subject: editDialog.subject,
      score: (v !== null && !isNaN(v) && v > 0) ? v : null,
    });
    setEditDialog(null);
  };

  const addTag = (itemId: string, currentTags: string[]) => {
    const t = tagInput.trim();
    if (!t || currentTags.includes(t)) { setTagInput(''); return; }
    persistItem(itemId, { tags: [...currentTags, t] });
    setTagInput('');
  };

  const removeTag = (itemId: string, currentTags: string[], tag: string) => {
    persistItem(itemId, { tags: currentTags.filter(t => t !== tag) });
  };

  const totalCount = items.length;
  const correctCount = items.filter(i => i.isCorrect === true).length;
  const incorrectCount = items.filter(i => i.isCorrect === false).length;
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon: BookOpen,    label: '총 문제', value: totalCount,      color: 'text-blue-600 bg-blue-100' },
            { icon: CheckCircle, label: '정답',    value: correctCount,   color: 'text-green-600 bg-green-100' },
            { icon: XCircle,     label: '오답',    value: incorrectCount, color: 'text-red-600 bg-red-100' },
            { icon: Filter,      label: '정답률',  value: `${accuracy}%`, color: 'text-purple-600 bg-purple-100' },
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
                  placeholder="문제 내용, 과목, 배점(예: 3점), 영역, 태그로 검색..."
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
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
          <div className="space-y-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">{filtered.length}개의 문제</p>
            {filtered.map(item => {
              const isExpanded = expandedId === item.id;
              const sq = similarQuestions[item.id];
              const isAnswerRevealed = revealedAnswers[item.id];
              const { stem, choices } = parseProblem(item.question);
              const multi = isMultiAnswer(stem);
              const origKey = `${item.id}:orig`;
              const simKey = `${item.id}:sim`;
              const origSelected = selectedChoices[origKey] ?? [];
              const simSelected = selectedChoices[simKey] ?? [];

              return (
                <Card key={item.id} className="dark:bg-gray-800 dark:border-gray-700 shadow-sm overflow-hidden">

                  {/* ── 카드 헤더 ── */}
                  <div className="px-6 pt-5 pb-4">
                    {/* 자동 태그 행 */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {/* 과목 */}
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-semibold">
                        {item.subject}
                      </Badge>
                      {/* 문제 번호 */}
                      {item.problemNumber !== null && (
                        <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs">
                          {item.problemNumber}번
                        </Badge>
                      )}
                      {/* 배점 */}
                      {item.score !== null && (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-xs font-semibold">
                          {item.score}점
                        </Badge>
                      )}
                      {/* 영역 */}
                      {item.problemArea && (
                        <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 text-xs">
                          {item.problemArea}
                        </Badge>
                      )}
                      {/* 난이도 */}
                      {item.difficulty && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                          {DIFFICULTY_LABELS[item.difficulty] || item.difficulty}
                        </span>
                      )}
                      {/* 정답/오답 */}
                      {item.isCorrect !== null && (
                        item.isCorrect
                          ? <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400"><CheckCircle className="w-3 h-3" />정답</span>
                          : <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400"><XCircle className="w-3 h-3" />오답</span>
                      )}
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">{item.date}</span>
                    </div>

                    {/* 문제 미리보기 (접힌 상태) */}
                    {!isExpanded && (
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm line-clamp-3">
                        {stem.substring(0, 200)}{stem.length > 200 ? '...' : ''}
                        {choices.length > 0 && (
                          <span className="ml-1.5 text-gray-400 dark:text-gray-500 text-xs">
                            (객관식 {choices.length}지)
                          </span>
                        )}
                      </p>
                    )}

                    {/* 태그 (항상 표시, 인라인 편집) */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      {item.tags.map(tag => (
                        <span
                          key={tag}
                          className="flex items-center gap-0.5 text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full"
                        >
                          #{tag}
                          {editingTagsId === item.id && (
                            <button
                              onClick={() => removeTag(item.id, item.tags, tag)}
                              className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </span>
                      ))}
                      {editingTagsId === item.id ? (
                        <>
                          <form
                            onSubmit={e => { e.preventDefault(); addTag(item.id, item.tags); }}
                            className="flex items-center gap-1"
                          >
                            <input
                              value={tagInput}
                              onChange={e => setTagInput(e.target.value)}
                              placeholder="태그 추가"
                              autoFocus
                              onKeyDown={e => e.key === 'Escape' && setEditingTagsId(null)}
                              className="text-xs px-2 py-0.5 border border-blue-400 rounded-full w-20 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                            <button type="submit" className="text-blue-500 hover:text-blue-600">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </form>
                          <button
                            onClick={() => setEditingTagsId(null)}
                            className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-0.5"
                          >
                            <Check className="w-2.5 h-2.5" />완료
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => { setEditingTagsId(item.id); setTagInput(''); }}
                          title="태그 편집"
                          className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* 수능 과목 프리셋 태그 패널 (편집 모드) */}
                    {editingTagsId === item.id && (
                      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">수능 과목 태그 선택</p>
                        {PRESET_TAGS.map(group => {
                          const unselected = group.tags.filter(t => !item.tags.includes(t));
                          if (unselected.length === 0) return null;
                          return (
                            <div key={group.group} className="flex flex-wrap items-center gap-1 mb-1.5 last:mb-0">
                              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 w-10 shrink-0">{group.group}</span>
                              {unselected.map(tag => (
                                <button
                                  key={tag}
                                  onClick={() => persistItem(item.id, { tags: [...item.tags, tag] })}
                                  className="text-xs px-2 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-full hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                  +{tag}
                                </button>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 펼치기/접기 + 수정 + 삭제 */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        {isExpanded
                          ? <><ChevronUp className="w-4 h-4" />접기</>
                          : <><ChevronDown className="w-4 h-4" />자세히 보기</>
                        }
                      </button>
                      <div className="flex items-center gap-1 ml-auto">
                        {isLoggedIn && (item.questionId || item.id) && (
                          <>
                            <PdfExportButton
                              questionId={item.questionId || item.id}
                              mode="icon"
                            />
                            <NotionExportButton
                              questionId={item.questionId || item.id}
                              mode="icon"
                            />
                          </>
                        )}
                        <button
                          onClick={() => setEditDialog({ id: item.id, subject: item.subject, score: item.score?.toString() ?? '' })}
                          className="flex items-center p-1.5 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="flex items-center p-1.5 text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ── 확장 영역 ── */}
                  {isExpanded && (
                    <div className="border-t dark:border-gray-700 px-6 py-6 space-y-7">

                      {/* 원본 문제: 이미지(좌) + 텍스트(우) */}
                      <section>
                        <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">문제</h4>
                        <div className={`${item.imageUrl ? 'grid md:grid-cols-2 gap-4' : ''}`}>
                          {/* 원본 이미지 */}
                          {item.imageUrl && (
                            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/30">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.imageUrl}
                                alt="원본 문제 이미지"
                                className="w-full h-auto object-contain max-h-80"
                              />
                            </div>
                          )}
                          {/* 문제 텍스트 */}
                          <div className="bg-white dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 p-5">
                            <MathContent content={stem} className="text-gray-900 dark:text-gray-100 text-base leading-relaxed" />

                            {/* 선택지 카드 */}
                            {choices.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {multi && (
                                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                    복수 선택 가능 (모두 선택하세요)
                                  </p>
                                )}
                                {choices.map((choice, i) => {
                                  const isSelected = origSelected.includes(i);
                                  return (
                                    <button
                                      key={i}
                                      onClick={() => toggleChoice(origKey, i, multi)}
                                      className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm transition-all ${
                                        isSelected
                                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 font-medium'
                                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600'
                                      }`}
                                    >
                                      <MathContent content={choice} className="leading-relaxed" />
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </section>

                      {/* AI 해설 (블러 스포일러) */}
                      {item.explanation && (
                        <section>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">AI 해설</h4>
                            {revealedExplanations[item.id] && (
                              <button
                                onClick={() => setRevealedExplanations(prev => ({ ...prev, [item.id]: false }))}
                                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                              >
                                <EyeOff className="w-3 h-3" />다시 숨기기
                              </button>
                            )}
                          </div>
                          <div className="relative bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-5 overflow-hidden">
                            {/* 해설 본문 (블러 처리) */}
                            <div className={`transition-all duration-300 ${revealedExplanations[item.id] ? '' : 'blur-sm select-none pointer-events-none'}`}>
                              <MathContent content={item.explanation} className="text-gray-900 dark:text-gray-100 text-sm" />
                            </div>
                            {/* 오버레이: 클릭하여 공개 */}
                            {!revealedExplanations[item.id] && (
                              <button
                                onClick={() => setRevealedExplanations(prev => ({ ...prev, [item.id]: true }))}
                                className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-green-50/70 dark:bg-green-900/50 hover:bg-green-50/50 dark:hover:bg-green-900/30 transition-colors"
                              >
                                <Eye className="w-6 h-6 text-green-700 dark:text-green-400" />
                                <span className="text-sm font-semibold text-green-700 dark:text-green-400">클릭하여 해설 보기</span>
                              </button>
                            )}
                          </div>
                        </section>
                      )}

                      {/* 유사 문제 */}
                      <section>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">유사 문제</h4>
                          {sq && (
                            <button
                              onClick={() => handleGenerateSimilar(item)}
                              disabled={generatingId === item.id}
                              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
                            >
                              {generatingId === item.id && <Loader2 className="w-3 h-3 animate-spin" />}
                              다시 생성
                            </button>
                          )}
                        </div>

                        {!sq ? (
                          <button
                            onClick={() => handleGenerateSimilar(item)}
                            disabled={generatingId === item.id}
                            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
                          >
                            {generatingId === item.id
                              ? <><Loader2 className="w-4 h-4 animate-spin" />생성 중...</>
                              : <><Sparkles className="w-4 h-4" />유사 문제 생성</>
                            }
                          </button>
                        ) : (
                          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-5 space-y-4">
                            {/* 핵심 개념 태그 */}
                            {sq.keyConcepts.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 items-center">
                                <Tag className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                {sq.keyConcepts.map((c, i) => (
                                  <Badge key={i} className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                                    {c}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {/* 유사 문제 텍스트 */}
                            <div className="bg-white dark:bg-gray-700/50 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
                              <MathContent content={sq.problem} className="text-gray-900 dark:text-gray-100 text-sm" />
                            </div>

                            {/* 유사 문제 선택지 */}
                            {sq.choices.length > 0 && (
                              <div className="space-y-2">
                                {sq.choices.map((choice, i) => {
                                  const isSelected = simSelected.includes(i);
                                  const isCorrect = isAnswerRevealed && sq.answer === i + 1;
                                  return (
                                    <button
                                      key={i}
                                      onClick={() => !isAnswerRevealed && toggleChoice(simKey, i, false)}
                                      className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ${
                                        isCorrect
                                          ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-900 dark:text-green-100 font-medium'
                                          : isSelected
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 font-medium'
                                            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-600'
                                      } ${isAnswerRevealed ? 'cursor-default' : 'cursor-pointer'}`}
                                    >
                                      <div className="flex items-start gap-2">
                                        <MathContent content={choice} className="flex-1 leading-relaxed" />
                                        {isCorrect && <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* 채점 */}
                            <div className="flex items-center gap-3 flex-wrap">
                              <button
                                onClick={() => setRevealedAnswers(prev => ({ ...prev, [item.id]: !isAnswerRevealed }))}
                                className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              >
                                {isAnswerRevealed ? '정답 숨기기' : '채점하기'}
                              </button>
                              {isAnswerRevealed && simSelected.length > 0 && (
                                <span className={`text-sm font-semibold ${
                                  simSelected[0] + 1 === sq.answer
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {simSelected[0] + 1 === sq.answer ? '정답!' : `오답 (정답: ${sq.answer}번)`}
                                </span>
                              )}
                            </div>

                            {/* 풀이 해설 */}
                            {isAnswerRevealed && sq.solution && (
                              <div className="bg-white dark:bg-gray-700/50 rounded-lg p-4 border dark:border-gray-600">
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">풀이</p>
                                <MathContent content={sq.solution} className="text-gray-800 dark:text-gray-200 text-sm" />
                              </div>
                            )}

                            {/* 오답 함정 */}
                            {isAnswerRevealed && sq.wrongAnswerExplanation && (
                              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-700">
                                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-2">오답 함정</p>
                                <MathContent content={sq.wrongAnswerExplanation} className="text-amber-900 dark:text-amber-200 text-sm" />
                              </div>
                            )}
                          </div>
                        )}
                      </section>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* ── 과목/배점 수정 다이얼로그 ── */}
      {editDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl w-full max-w-sm mx-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5">문제 정보 수정</h3>

            <div className="space-y-4">
              {/* 과목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">과목</label>
                <select
                  value={editDialog.subject}
                  onChange={e => setEditDialog(prev => prev ? { ...prev, subject: e.target.value } : null)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {['수학', '영어', '국어', '사회', '과학', '한국사', '직업탐구', '제2외국어', '기타'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* 배점 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">배점 (점)</label>
                <input
                  type="number"
                  min="1"
                  max="9"
                  value={editDialog.score}
                  onChange={e => setEditDialog(prev => prev ? { ...prev, score: e.target.value } : null)}
                  placeholder="예: 2, 3, 4"
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                저장
              </button>
              <button
                onClick={() => setEditDialog(null)}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors text-sm"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      <AccessibilityFeatures />
    </div>
  );
}
