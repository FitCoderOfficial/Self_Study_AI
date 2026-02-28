"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import MathContent from '@/components/MathContent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Clock, Image as ImageIcon, Copy, Loader2,
  BookOpen, Sparkles, CheckCircle, Tag, RefreshCw, ChevronDown, ChevronUp, Hash, Star
} from 'lucide-react';
import type { SimilarQuestion } from '@/app/api/similar-question/route';

interface ProcessedResult {
  id: string;
  questionId?: string;
  originalImage: string;
  fileName: string;
  ocrText: string;
  formattedProblem: string;
  explanation: string;
  subject: string;
  score: number | null;
  problemNumber: number | null;
  problemArea: string;
  timestamp: string;
}

export default function NewQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const [result, setResult] = useState<ProcessedResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [showImage, setShowImage] = useState(true);

  // 유사 문제 상태
  const [isGeneratingSimilar, setIsGeneratingSimilar] = useState(false);
  const [similarQuestion, setSimilarQuestion] = useState<SimilarQuestion | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isGraded, setIsGraded] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem(`processedResult_${params.id}`);
    if (data) {
      setTimeout(() => {
        setResult(JSON.parse(data));
        setIsLoading(false);
      }, 500);
    } else {
      router.push('/solve');
    }
  }, [params.id, router]);

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSaveToArchive = () => {
    if (!result) return;
    const archiveItem = {
      id: result.id,
      questionId: result.questionId,
      subject: result.subject,
      question: result.formattedProblem || result.ocrText,
      explanation: result.explanation,
      date: new Date(result.timestamp).toISOString().split('T')[0],
      isCorrect: null,
      difficulty: 'medium',
      tags: ['AI 처리', result.subject],
    };
    try {
      const existing = JSON.parse(localStorage.getItem('archivedQuestions') || '[]');
      existing.unshift(archiveItem);
      if (existing.length > 50) existing.splice(50);
      localStorage.setItem('archivedQuestions', JSON.stringify(existing));
      alert('아카이브에 저장되었습니다!');
    } catch {
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleGenerateSimilar = async () => {
    if (!result) return;
    setIsGeneratingSimilar(true);
    setSimilarQuestion(null);
    setSelectedChoice(null);
    setIsGraded(false);
    try {
      const response = await fetch('/api/similar-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemText: result.formattedProblem || result.ocrText,
          subject: result.subject,
        }),
      });
      const data = await response.json();
      if (data.success && data.similarQuestion) {
        setSimilarQuestion(data.similarQuestion);
      } else {
        alert(data.error || '유사 문제 생성 중 오류가 발생했습니다.');
      }
    } catch {
      alert('유사 문제 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingSimilar(false);
    }
  };

  const handleGrade = () => {
    if (selectedChoice === null) return;
    setIsGraded(true);
  };

  const handleRegenerate = () => {
    setSimilarQuestion(null);
    setSelectedChoice(null);
    setIsGraded(false);
    handleGenerateSimilar();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Navigation />
        <main className="container mx-auto px-4 py-16 text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">결과를 불러오는 중...</p>
        </main>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <Link href="/solve">
            <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300">
              <ArrowLeft className="w-4 h-4 mr-2" />
              돌아가기
            </Button>
          </Link>

          {/* 메타데이터 태그 */}
          <div className="flex items-center gap-2 flex-wrap">
            {result.problemNumber && (
              <Badge className="bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900 flex items-center gap-1">
                <Hash className="w-3 h-3" />
                {result.problemNumber}번
              </Badge>
            )}
            {result.score && (
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 flex items-center gap-1">
                <Star className="w-3 h-3" />
                {result.score}점
              </Badge>
            )}
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {result.subject}
            </Badge>
            {result.problemArea && (
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {result.problemArea}
              </Badge>
            )}
            <Badge variant="secondary" className="flex items-center gap-1 dark:bg-gray-700 dark:text-gray-300">
              <Clock className="w-3 h-3" />
              {new Date(result.timestamp).toLocaleString('ko-KR')}
            </Badge>
          </div>
        </div>

        {/* 본문 2단 레이아웃 */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* ─── 왼쪽 패널: 이미지 + 문제 텍스트 ─── */}
          <div className="space-y-4">
            {/* 원본 이미지 */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base dark:text-gray-100">
                    <ImageIcon className="w-4 h-4" />
                    원본 이미지
                  </CardTitle>
                  <button
                    onClick={() => setShowImage(!showImage)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showImage ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </CardHeader>
              {showImage && (
                <CardContent className="pt-0">
                  <Image
                    src={result.originalImage}
                    alt="원본 문제 이미지"
                    width={600}
                    height={400}
                    className="w-full h-auto rounded-lg border dark:border-gray-700"
                    unoptimized
                  />
                </CardContent>
              )}
            </Card>

            {/* 문제 텍스트 */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base dark:text-gray-100">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    문제
                  </CardTitle>
                  <Button
                    onClick={() => handleCopy(result.formattedProblem || result.ocrText, 'problem')}
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs dark:text-gray-400"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    {copied === 'problem' ? '복사됨!' : '복사'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-100 dark:border-blue-900 text-gray-900 dark:text-gray-100 text-sm leading-relaxed">
                  <MathContent content={result.formattedProblem || result.ocrText} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─── 오른쪽 패널: AI 해설 + 유사 문제 ─── */}
          <div className="space-y-4">
            {/* AI 해설 */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base dark:text-gray-100">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    AI 해설
                  </CardTitle>
                  <Button
                    onClick={() => handleCopy(result.explanation, 'explanation')}
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs dark:text-gray-400"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    {copied === 'explanation' ? '복사됨!' : '복사'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-100 dark:border-green-900 text-gray-900 dark:text-gray-100 text-sm leading-relaxed max-h-80 overflow-y-auto">
                  <MathContent content={result.explanation} />
                </div>
              </CardContent>
            </Card>

            {/* 유사 문제 */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base dark:text-gray-100">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  유사 문제 풀기
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!similarQuestion && !isGeneratingSimilar && (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      같은 개념의 유사 문제를 생성하여 풀어보세요
                    </p>
                    <Button
                      onClick={handleGenerateSimilar}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      유사 문제 생성
                    </Button>
                  </div>
                )}

                {isGeneratingSimilar && (
                  <div className="flex flex-col items-center py-8 gap-3">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">유사 문제 생성 중...</p>
                  </div>
                )}

                {similarQuestion && (
                  <div className="space-y-4">
                    {/* 핵심 개념 태그 */}
                    {similarQuestion.keyConcepts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                        {similarQuestion.keyConcepts.map((concept, i) => (
                          <Badge key={i} variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                            {concept}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* 문제 텍스트 */}
                    <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800 text-sm text-gray-900 dark:text-gray-100">
                      <MathContent content={similarQuestion.problem} />
                    </div>

                    {/* 선택지 */}
                    <div className="space-y-2">
                      {similarQuestion.choices.map((choice, i) => {
                        const choiceNum = i + 1;
                        const isSelected = selectedChoice === choiceNum;
                        const isCorrect = choiceNum === similarQuestion.answer;

                        let btnClass = 'w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all ';
                        if (!isGraded) {
                          btnClass += isSelected
                            ? 'border-purple-500 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 font-medium'
                            : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 dark:text-gray-200';
                        } else {
                          if (isCorrect) {
                            btnClass += 'border-green-500 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 font-medium';
                          } else if (isSelected && !isCorrect) {
                            btnClass += 'border-red-400 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
                          } else {
                            btnClass += 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400';
                          }
                        }

                        return (
                          <button
                            key={i}
                            className={btnClass}
                            onClick={() => !isGraded && setSelectedChoice(choiceNum)}
                            disabled={isGraded}
                          >
                            <MathContent content={choice} className="inline" />
                            {isGraded && isCorrect && (
                              <span className="ml-2 text-green-600 dark:text-green-400 font-bold">✓ 정답</span>
                            )}
                            {isGraded && isSelected && !isCorrect && (
                              <span className="ml-2 text-red-500 dark:text-red-400">✗ 오답</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* 채점 버튼 */}
                    {!isGraded ? (
                      <Button
                        onClick={handleGrade}
                        disabled={selectedChoice === null}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-40"
                      >
                        채점하기
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        {/* 정오답 피드백 */}
                        <div className={`rounded-lg p-3 border text-sm ${
                          selectedChoice === similarQuestion.answer
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300'
                            : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300'
                        }`}>
                          {selectedChoice === similarQuestion.answer
                            ? '정답입니다!'
                            : `오답입니다. 정답은 ${similarQuestion.answer}번입니다.`}
                        </div>

                        {/* 풀이 보기 */}
                        <details className="group">
                          <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 select-none">
                            풀이 보기 ▾
                          </summary>
                          <div className="mt-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200">
                            <MathContent content={similarQuestion.solution} />
                          </div>
                        </details>

                        {/* 오답 함정 */}
                        {similarQuestion.wrongAnswerExplanation && (
                          <details className="group">
                            <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 select-none">
                              오답 함정 설명 ▾
                            </summary>
                            <div className="mt-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800 text-sm text-gray-800 dark:text-gray-200">
                              <MathContent content={similarQuestion.wrongAnswerExplanation} />
                            </div>
                          </details>
                        )}

                        {/* 재생성 */}
                        <Button
                          onClick={handleRegenerate}
                          variant="outline"
                          size="sm"
                          className="w-full dark:border-gray-600 dark:text-gray-300"
                        >
                          <RefreshCw className="w-3.5 h-3.5 mr-2" />
                          다른 문제 생성
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <Button onClick={handleSaveToArchive} className="h-11 bg-blue-600 hover:bg-blue-700 text-white">
            <BookOpen className="w-4 h-4 mr-2" />
            히스토리에 저장
          </Button>
          <Link href="/solve">
            <Button variant="outline" className="w-full h-11 dark:border-gray-600 dark:text-gray-300">
              새로운 문제 풀기
            </Button>
          </Link>
          <Link href="/archive">
            <Button variant="outline" className="w-full h-11 dark:border-gray-600 dark:text-gray-300">
              학습 히스토리
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
