"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Image as ImageIcon, Copy, Loader2, BookOpen, Sparkles, CheckCircle } from 'lucide-react';

declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: () => Promise<void>;
      startup?: { promise?: Promise<void> };
    };
  }
}

interface ProcessedResult {
  id: string;
  questionId?: string;
  originalImage: string;
  fileName: string;
  ocrText: string;
  formattedProblem: string;
  explanation: string;
  subject: string;
  timestamp: string;
  confidence: number;
}

export default function NewQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const [result, setResult] = useState<ProcessedResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState<'problem' | 'explanation' | null>(null);
  const [activeTab, setActiveTab] = useState<'problem' | 'explanation'>('problem');
  const [isGeneratingSimilar, setIsGeneratingSimilar] = useState(false);
  const [similarProblem, setSimilarProblem] = useState<string | null>(null);

  const typesetMath = async () => {
    if (window.MathJax?.typesetPromise) {
      try {
        await window.MathJax.startup?.promise;
        await window.MathJax.typesetPromise();
      } catch (e) {
        console.error('MathJax error:', e);
      }
    }
  };

  useEffect(() => {
    const data = localStorage.getItem(`processedResult_${params.id}`);
    if (data) {
      setTimeout(() => {
        setResult(JSON.parse(data));
        setIsLoading(false);
      }, 800);
    } else {
      router.push('/solve');
    }
  }, [params.id, router]);

  useEffect(() => {
    if (result && !isLoading) {
      const timer = setTimeout(typesetMath, 200);
      return () => clearTimeout(timer);
    }
  }, [result, isLoading, activeTab]);

  const handleCopy = async (text: string, type: 'problem' | 'explanation') => {
    const clean = text.replace(/<[^>]*>/g, '');
    await navigator.clipboard.writeText(clean);
    setCopied(type);
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
    setSimilarProblem(null);
    try {
      const response = await fetch('/api/similar-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemText: result.formattedProblem || result.ocrText,
          subject: result.subject,
          questionId: result.questionId,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSimilarProblem(data.similarProblem);
        setTimeout(typesetMath, 300);
      }
    } catch {
      alert('유사 문제 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingSimilar(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Navigation />
        <main className="container mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">결과 불러오는 중...</h1>
          <p className="text-gray-600 dark:text-gray-300">AI가 분석한 결과를 가져오고 있습니다</p>
        </main>
      </div>
    );
  }

  if (!result) return null;

  const displayText = activeTab === 'problem'
    ? (result.formattedProblem || result.ocrText)
    : result.explanation;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/solve">
            <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300">
              <ArrowLeft className="w-4 h-4 mr-2" />
              돌아가기
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {result.subject}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1 dark:bg-gray-700">
              <Clock className="w-3 h-3" />
              {new Date(result.timestamp).toLocaleString('ko-KR')}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* 원본 이미지 */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100 text-lg">
                <ImageIcon className="w-5 h-5" />
                원본 이미지
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Image
                src={result.originalImage}
                alt="원본 이미지"
                width={600}
                height={400}
                className="w-full h-auto rounded-lg border dark:border-gray-700 shadow-sm"
                unoptimized
              />
            </CardContent>
          </Card>

          {/* AI 분석 결과 */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100 text-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                AI 분석 결과
              </CardTitle>
              {/* 탭 */}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setActiveTab('problem')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeTab === 'problem'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  문제 텍스트
                </button>
                <button
                  onClick={() => setActiveTab('explanation')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeTab === 'explanation'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  AI 해설
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-white dark:bg-gray-700 p-5 rounded-lg border dark:border-gray-600 min-h-[300px] text-gray-900 dark:text-gray-100 leading-relaxed overflow-auto">
                {displayText ? (
                  <div
                    className="whitespace-pre-wrap text-base"
                    dangerouslySetInnerHTML={{ __html: displayText.replace(/\n/g, '<br/>') }}
                  />
                ) : (
                  <p className="text-gray-400 dark:text-gray-500 italic">내용이 없습니다.</p>
                )}
              </div>
              <Button
                onClick={() => handleCopy(displayText, activeTab)}
                variant="outline"
                size="sm"
                className="mt-3 dark:border-gray-600 dark:text-gray-300"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copied === activeTab ? '복사됨!' : '텍스트 복사'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 유사 문제 생성 */}
        <Card className="mt-6 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Sparkles className="w-5 h-5 text-purple-600" />
              유사 문제 생성
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!similarProblem ? (
              <div className="text-center py-6">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  이 문제와 유사한 새로운 문제를 AI가 생성합니다
                </p>
                <Button
                  onClick={handleGenerateSimilar}
                  disabled={isGeneratingSimilar}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                >
                  {isGeneratingSimilar ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />유사 문제 생성 중...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" />유사 문제 생성하기</>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-lg border border-purple-200 dark:border-purple-700 leading-relaxed text-gray-900 dark:text-gray-100 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: similarProblem.replace(/\n/g, '<br/>') }}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleCopy(similarProblem, 'problem')}
                    variant="outline"
                    size="sm"
                    className="dark:border-gray-600 dark:text-gray-300"
                  >
                    <Copy className="w-4 h-4 mr-2" />복사
                  </Button>
                  <Button
                    onClick={() => { setSimilarProblem(null); handleGenerateSimilar(); }}
                    variant="outline"
                    size="sm"
                    className="dark:border-gray-600 dark:text-gray-300"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />다시 생성
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 액션 버튼 */}
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <Button onClick={handleSaveToArchive} className="h-12 bg-blue-600 hover:bg-blue-700 text-white">
            <BookOpen className="w-4 h-4 mr-2" />
            히스토리에 저장
          </Button>
          <Link href="/solve">
            <Button variant="outline" className="w-full h-12 dark:border-gray-600 dark:text-gray-300">
              새로운 문제 풀기
            </Button>
          </Link>
          <Link href="/archive">
            <Button variant="outline" className="w-full h-12 dark:border-gray-600 dark:text-gray-300">
              학습 히스토리 보기
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
