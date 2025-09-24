"use client";

import { useState, useRef } from "react";
import Navigation from "@/components/Navigation";
import AccessibilityFeatures from "@/components/AccessibilityFeatures";
import SimilarProblemModal from "@/components/SimilarProblemModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload, Download, RotateCcw, CheckCircle, XCircle, Sparkles } from "lucide-react";
import { getMockSimilarProblem, SimilarProblem } from "@/api/mockData";

export default function SolvePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    question: string;
    answer: string;
    explanation: string;
    confidence: number;
  } | null>(null);
  const [similarProblem, setSimilarProblem] = useState<SimilarProblem | null>(null);
  const [isSimilarProblemLoading, setIsSimilarProblemLoading] = useState(false);
  const [isSimilarProblemModalOpen, setIsSimilarProblemModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = () => {
    setIsLoggedIn(true);
    alert("로그인되었습니다! (데모용)");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    alert("로그아웃되었습니다! (데모용)");
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    // 실제 구현에서는 웹캠을 사용하지만, 데모에서는 파일 선택으로 대체
    fileInputRef.current?.click();
  };

  const simulateOCR = () => {
    setIsProcessing(true);
    
    // OCR 시뮬레이션 (3초 후 결과 반환)
    setTimeout(() => {
      setResult({
        question: "다음 이차방정식의 해를 구하시오.\n\nx² - 5x + 6 = 0",
        answer: "x = 2 또는 x = 3",
        explanation: `이차방정식 x² - 5x + 6 = 0을 인수분해하면 (x - 2)(x - 3) = 0이 됩니다.\n\n따라서 x - 2 = 0 또는 x - 3 = 0이므로\nx = 2 또는 x = 3입니다.\n\n검증: x = 2일 때, 2² - 5×2 + 6 = 4 - 10 + 6 = 0 ✓\nx = 3일 때, 3² - 5×3 + 6 = 9 - 15 + 6 = 0 ✓`,
        confidence: 95
      });
      setIsProcessing(false);
    }, 3000);
  };

  const resetProcess = () => {
    setSelectedImage(null);
    setResult(null);
    setIsProcessing(false);
    setSimilarProblem(null);
  };

  const handleGenerateSimilarProblem = async () => {
    if (!result) return;
    
    setIsSimilarProblemLoading(true);
    setIsSimilarProblemModalOpen(true);
    
    try {
      const similarProblemData = await getMockSimilarProblem("mock-problem-id");
      setSimilarProblem(similarProblemData);
    } catch (error) {
      console.error("Failed to generate similar problem:", error);
      setSimilarProblem(null);
    } finally {
      setIsSimilarProblemLoading(false);
    }
  };

  const handleRetrySimilarProblem = async () => {
    await handleGenerateSimilarProblem();
  };

  const handleSaveToArchive = () => {
    alert("유사 문제가 아카이브에 저장되었습니다!");
  };

  const handleAddToWrongAnswers = () => {
    alert("유사 문제가 오답노트에 추가되었습니다!");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation 
        isLoggedIn={isLoggedIn} 
        onLogin={handleLogin} 
        onLogout={handleLogout} 
      />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            AI 기반 문제 풀이
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            AI 문제 풀이
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            문제를 촬영하거나 업로드하면 AI가 정답과 상세한 해설을 제공합니다.
            <br className="hidden md:block" />
            <span className="font-semibold text-blue-600 dark:text-blue-400">유사 문제 생성</span> 기능으로 더 많은 연습을 해보세요!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 이미지 업로드 섹션 */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Camera className="mr-2 h-6 w-6 text-blue-600" />
                  문제 이미지
                </CardTitle>
                <CardDescription className="text-base">
                  카메라로 촬영하거나 이미지 파일을 업로드하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedImage ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Camera className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      문제 이미지 업로드
                    </h3>
                    <p className="text-gray-600 mb-6">
                      카메라로 촬영하거나 이미지 파일을 업로드하여 AI 분석을 시작하세요
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button 
                        onClick={handleCameraCapture} 
                        variant="outline" 
                        size="lg"
                        className="flex items-center py-4 px-6 rounded-full border-2 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 transition-all duration-300"
                      >
                        <Camera className="mr-3 h-5 w-5" />
                        카메라로 촬영
                      </Button>
                      <Button 
                        onClick={() => fileInputRef.current?.click()} 
                        variant="outline" 
                        size="lg"
                        className="flex items-center py-4 px-6 rounded-full border-2 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 transition-all duration-300"
                      >
                        <Upload className="mr-3 h-5 w-5" />
                        파일 업로드
                      </Button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <p className="text-sm text-gray-500 mt-4">
                      지원 형식: JPG, PNG, GIF (최대 10MB)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative group">
                      <img
                        src={selectedImage}
                        alt="업로드된 문제"
                        className="w-full h-auto rounded-xl border shadow-sm"
                      />
                      <Button
                        onClick={resetProcess}
                        size="sm"
                        variant="outline"
                        className="absolute top-3 right-3 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 shadow-lg rounded-full px-3 py-2 border-2 transition-all duration-300"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button 
                      onClick={simulateOCR} 
                      disabled={isProcessing}
                      className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          AI가 문제를 분석 중...
                        </>
                      ) : (
                        <>
                          <Brain className="mr-3 h-5 w-5" />
                          AI 분석 시작
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 결과 섹션 */}
          <div className="space-y-6">
            {result ? (
              <>
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center text-xl">
                      <CheckCircle className="mr-2 h-6 w-6 text-green-600" />
                      인식된 문제
                    </CardTitle>
                    <CardDescription className="text-base">
                      신뢰도: <span className="font-semibold text-green-600">{result.confidence}%</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-6 rounded-xl border">
                      <pre className="whitespace-pre-wrap text-base text-gray-700 leading-relaxed">
                        {result.question}
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center text-xl text-green-600">
                      <CheckCircle className="mr-2 h-6 w-6" />
                      정답
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                      <p className="text-xl font-bold text-green-800">
                        {result.answer}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center text-xl">
                      <Brain className="mr-2 h-6 w-6 text-blue-600" />
                      상세 해설
                    </CardTitle>
                    <CardDescription className="text-base">
                      단계별 풀이 과정을 확인하세요
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                      <pre className="whitespace-pre-wrap text-base text-gray-700 leading-relaxed">
                        {result.explanation}
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  {/* 유사 문제 생성 버튼 */}
                  <Button 
                    onClick={handleGenerateSimilarProblem}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                    size="lg"
                  >
                    <Sparkles className="w-5 h-5 mr-3" />
                    AI 유사 문제 풀기
                  </Button>
                  
                  {/* 기존 액션 버튼들 */}
                  <div className="flex gap-4">
                    <Button 
                      onClick={() => {
                        // 실제 구현에서는 질문을 아카이브에 저장
                        alert("질문이 아카이브에 저장되었습니다!");
                      }}
                      variant="outline"
                      className="flex-1 py-3 px-4 rounded-full border-2 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 transition-all duration-300"
                    >
                      아카이브에 저장
                    </Button>
                    <Button 
                      onClick={() => {
                        // 실제 구현에서는 오답노트에 추가
                        alert("오답노트에 추가되었습니다!");
                      }}
                      variant="outline"
                      className="flex-1 py-3 px-4 rounded-full border-2 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 transition-all duration-300"
                    >
                      오답노트에 추가
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>AI 분석 결과</CardTitle>
                  <CardDescription>
                    문제를 업로드하고 분석을 시작하면 결과가 여기에 표시됩니다
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">
                      왼쪽에서 문제 이미지를 업로드하세요
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* 사용 팁 */}
        <Card className="mt-12 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Sparkles className="mr-2 h-6 w-6 text-purple-600" />
              사용 팁
            </CardTitle>
            <CardDescription className="text-base">
              더 정확한 AI 분석을 위한 촬영 및 업로드 가이드입니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Camera className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 text-lg">📸 촬영 시 주의사항</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        문제가 선명하게 보이도록 촬영하세요
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        그림자나 반사가 없도록 주의하세요
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        문제 전체가 프레임에 들어오도록 하세요
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 text-lg">🎯 정확도 향상</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        수식이 있는 경우 특히 선명하게 촬영하세요
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        손글씨보다는 인쇄된 문제가 인식률이 높습니다
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        한 번에 하나의 문제만 촬영하는 것을 권장합니다
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* 접근성 기능 */}
      <AccessibilityFeatures />

      {/* 유사 문제 생성 Modal */}
      <SimilarProblemModal
        isOpen={isSimilarProblemModalOpen}
        onClose={() => setIsSimilarProblemModalOpen(false)}
        similarProblem={similarProblem}
        isLoading={isSimilarProblemLoading}
        onRetry={handleRetrySimilarProblem}
        onSaveToArchive={handleSaveToArchive}
        onAddToWrongAnswers={handleAddToWrongAnswers}
      />
    </div>
  );
}
