"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navigation from "@/components/Navigation";
import AccessibilityFeatures from "@/components/AccessibilityFeatures";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload, FileImage, RotateCcw, CheckCircle, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { processImageWithMathpix } from "@/api/mockData";

export default function SolvePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => setIsLoggedIn(false);

  // 파일 변경 핸들러
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  // 파일 처리 함수
  const handleFileProcess = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB 제한
      setError('파일 크기는 10MB를 초과할 수 없습니다.');
      return;
    }

    setError(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const response = await processImageWithMathpix(file);

      if (response.success && response.data) {
        const resultId = Date.now().toString();
        const processedResult = {
          id: resultId,
          originalImage: selectedImage, // base64 string
          fileName: file.name,
          processedText: response.data.processedText,
          subject: "다양한 과목", // 다양한 과목으로 설정
          timestamp: new Date().toISOString(),
          confidence: 95
        };
        localStorage.setItem(`processedResult_${resultId}`, JSON.stringify(processedResult));
        
        // 결과 목록에 추가
        const existingResults = JSON.parse(localStorage.getItem('processedResults') || '[]');
        existingResults.unshift(processedResult);
        localStorage.setItem('processedResults', JSON.stringify(existingResults));

        router.push(`/new-question/${resultId}`);
      } else {
        setError(response.error || '이미지 처리 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error("API 호출 오류:", err);
      setError('네트워크 오류 또는 서버 응답이 없습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 프로세스 리셋
  const resetProcess = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setError(null);
    setIsProcessing(false);
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
            문제를 촬영하거나 업로드하면 <span className="font-semibold text-green-600 dark:text-green-400">Mathpix AI</span>가 수학 기호와 텍스트를 인식하여 정답과 상세한 해설을 제공합니다.
            <br className="hidden md:block" />
            <span className="font-semibold text-blue-600 dark:text-blue-400">수학, 물리, 화학 등의 문제</span>를 처리할 수 있습니다!
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
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
                  <div 
                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors 
                      ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-gray-300 hover:border-blue-400 dark:border-gray-700 dark:hover:border-blue-500'}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileImage className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      문제 이미지 업로드
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      파일을 드래그 앤 드롭하거나 아래 버튼을 클릭하세요
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                      지원 형식: JPG, PNG, GIF (최대 10MB)
                    </p>
                    {error && (
                      <p className="text-red-500 text-sm mt-2 flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {error}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative group max-w-2xl mx-auto">
                      <Image
                        src={selectedImage}
                        alt="업로드된 문제"
                        width={800}
                        height={600}
                        className="w-full h-auto max-h-96 object-contain rounded-xl border shadow-sm"
                        unoptimized
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
                      onClick={() => selectedFile && handleFileProcess(selectedFile)} 
                      disabled={isProcessing || !selectedFile}
                      className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="animate-spin h-5 w-5 mr-3" />
                          Mathpix AI가 이미지를 분석 중...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-3 h-5 w-5" />
                          Mathpix AI 분석 시작
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
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
                    <h4 className="font-semibold text-gray-900 dark:text-gray-300 mb-3 text-lg">📸 촬영 시 주의사항</h4>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-300">
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
                    <h4 className="font-semibold text-gray-900 dark:text-gray-300 mb-3 text-lg">🎯 Mathpix AI 인식 향상</h4>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        수학 기호와 수식이 선명하게 보이도록 촬영하세요
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        인쇄된 문제가 손글씨보다 인식률이 높습니다
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        LaTeX 형식의 수학 기호로 변환됩니다
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <AccessibilityFeatures />
    </div>
  );
}