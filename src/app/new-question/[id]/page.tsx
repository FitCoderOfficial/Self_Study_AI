"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, Clock, Image as ImageIcon, Copy, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: () => Promise<void>;
      startup?: {
        promise?: Promise<void>;
      };
    };
  }
}

interface ProcessedResult {
  id: string;
  originalImage: string;
  fileName: string;
  processedText: string;
  timestamp: string;
  subject: string;
  confidence: number;
}

export default function NewQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const [result, setResult] = useState<ProcessedResult | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // MathJax 타입셋팅 함수 최적화
  const typesetMath = async () => {
    if (window.MathJax?.typesetPromise) {
      try {
        await window.MathJax.startup?.promise;
        await window.MathJax.typesetPromise();
      } catch (error) {
        console.error('MathJax typeset error:', error);
      }
    }
  };

  useEffect(() => {
    // localStorage에서 결과 데이터 즉시 가져오기
    const resultData = localStorage.getItem(`processedResult_${params.id}`);
    
    if (resultData) {
      const parsedResult = JSON.parse(resultData);
      // 로딩 애니메이션을 위한 최소 대기 시간 (UX 개선)
      setTimeout(() => {
        setResult(parsedResult);
        setIsLoading(false);
      }, 1000); // 1초로 단축
    } else {
      // 결과를 찾을 수 없으면 즉시 리다이렉트
      router.push('/solve');
    }
  }, [params.id, router]);

  // 결과 텍스트가 변경될 때마다 MathJax 재렌더링
  useEffect(() => {
    if (result?.processedText && !isLoading) {
      const timer = setTimeout(typesetMath, 100);
      return () => clearTimeout(timer);
    }
  }, [result?.processedText, isLoading]);

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => setIsLoggedIn(false);

  const handleCopyText = async () => {
    if (result?.processedText) {
      try {
        await navigator.clipboard.writeText(result.processedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('복사 실패:', err);
      }
    }
  };

  const handleSaveToArchive = () => {
    if (!result) return;
    
    const archiveItem = {
      id: result.id,
      subject: result.subject,
      question: result.processedText,
      answer: "AI가 분석한 문제입니다",
      date: new Date(result.timestamp).toISOString().split('T')[0],
      isCorrect: true,
      imageUrl: result.originalImage,
      difficulty: "medium" as const,
      tags: ["AI 처리", result.subject]
    };

    try {
      const existingArchive = JSON.parse(localStorage.getItem('archivedQuestions') || '[]');
      existingArchive.unshift(archiveItem);
      localStorage.setItem('archivedQuestions', JSON.stringify(existingArchive));
      alert('✅ 아카이브에 저장되었습니다!');
    } catch (error) {
      console.error('저장 오류:', error);
      alert('❌ 저장 중 오류가 발생했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Navigation isLoggedIn={isLoggedIn} onLogin={handleLogin} onLogout={handleLogout} />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                AI 분석 중... 🔍
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                AI가 이미지를 텍스트로 변환하고 있습니다
              </p>
              
              {/* 로딩 애니메이션 */}
              <div className="flex justify-center space-x-2 mb-8">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Navigation isLoggedIn={isLoggedIn} onLogin={handleLogin} onLogout={handleLogout} />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300">결과를 불러오는 중...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Navigation isLoggedIn={isLoggedIn} onLogin={handleLogin} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="text-center justify-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Link href="/solve">
              <Button variant="outline" size="sm" className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                문제 풀이로 돌아가기
              </Button>
            </Link>
            <Badge variant="secondary" className="flex items-center gap-1 dark:bg-gray-700 dark:text-gray-300">
              <Clock className="w-3 h-3" />
              {new Date(result.timestamp).toLocaleString('ko-KR')}
            </Badge>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            새로운 문제 처리 완료! 🎉
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            이미지에서 추출한 수학 문제와 기호들이 정확하게 렌더링됩니다.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 원본 이미지 */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <ImageIcon className="w-5 h-5" />
                원본 이미지
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Image
                  src={result.originalImage}
                  alt="원본 이미지"
                  width={600}
                  height={400}
                  className="w-full h-auto rounded-lg border dark:border-gray-700 shadow-sm"
                  unoptimized
                />
                <div className="flex gap-2">
                  <Badge variant="outline" className="dark:bg-gray-700 dark:text-gray-300">
                    신뢰도: {result.confidence}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 처리된 텍스트 */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <CheckCircle className="w-5 h-5 text-green-600" />
                AI 분석 결과
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div 
                  className="bg-white dark:bg-gray-700 p-6 rounded-lg border dark:border-gray-600 shadow-sm min-h-[200px] text-gray-900 dark:text-gray-100"
                  dangerouslySetInnerHTML={{ __html: result.processedText }}
                />
                
                <div className="flex flex-wrap gap-2">
                  <Button 
                    onClick={handleCopyText} 
                    variant="outline" 
                    size="sm"
                    className={copied ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400" : "dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {copied ? "복사됨!" : "텍스트 복사"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 분석 결과 관리 */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {/* 저장 및 공유 */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                💾 저장 & 공유
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <Button 
                  onClick={handleSaveToArchive}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  🗂️ 아카이브에 저장
                </Button>
                <Button 
                  onClick={() => {
                    const notionUrl = `https://www.notion.so/new?content=${encodeURIComponent(result?.processedText || '')}`;
                    window.open(notionUrl, '_blank');
                  }}
                  variant="outline" 
                  className="w-full h-12 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  📝 Notion으로 내보내기
                </Button>
                <Button 
                  onClick={() => {
                    if (navigator.share && result) {
                      navigator.share({
                        title: 'AI 분석 결과',
                        text: result.processedText.replace(/<[^>]*>/g, '') // HTML 태그 제거
                      }).catch(console.error);
                    } else {
                      handleCopyText();
                    }
                  }}
                  variant="outline" 
                  className="w-full h-12 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  📤 공유하기
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 다음 작업 */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                🚀 다음 작업
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <Link href="/solve">
                  <Button className="w-full h-12 bg-green-600 hover:bg-green-700 text-white">
                    ➕ 새로운 문제 풀기
                  </Button>
                </Link>
                <Link href="/archive">
                  <Button variant="outline" className="w-full h-12 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                    📚 내 아카이브 보기
                  </Button>
                </Link>
                <Button 
                  onClick={() => {
                    const studyUrl = `https://www.google.com/search?q=${encodeURIComponent('수학 문제 ' + (result?.subject || ''))}`;
                    window.open(studyUrl, '_blank');
                  }}
                  variant="outline" 
                  className="w-full h-12 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  🔍 유사한 문제 찾기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
