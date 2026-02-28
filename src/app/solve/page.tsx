"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navigation from "@/components/Navigation";
import AccessibilityFeatures from "@/components/AccessibilityFeatures";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload, FileImage, RotateCcw, CheckCircle, Sparkles, AlertCircle, Loader2, ChevronRight } from "lucide-react";
import { StorageManager } from "@/lib/utils";

// ─── 수능 과목 구조 정의 ───────────────────────────────────────────────────────

interface SubjectGroup {
  id: string;
  label: string;
  emoji: string;
  apiValue: string; // 하위 선택 없을 때 API로 보내는 값
  subSubjects?: string[];
}

const SUBJECT_GROUPS: SubjectGroup[] = [
  { id: 'auto',   label: '자동감지',       emoji: '✨', apiValue: '기타' },
  { id: 'korean', label: '국어',           emoji: '📖', apiValue: '국어',  subSubjects: ['화법과작문', '언어와매체'] },
  { id: 'math',   label: '수학',           emoji: '📐', apiValue: '수학',  subSubjects: ['확률과통계', '미적분', '기하'] },
  { id: 'english',label: '영어',           emoji: '🌍', apiValue: '영어' },
  { id: 'history',label: '한국사',         emoji: '🏛', apiValue: '한국사' },
  {
    id: 'social', label: '사회탐구',       emoji: '🗺', apiValue: '사회',
    subSubjects: ['생활과윤리', '윤리와사상', '한국지리', '세계지리', '동아시아사', '세계사', '경제', '정치와법', '사회문화'],
  },
  {
    id: 'science',label: '과학탐구',       emoji: '🔬', apiValue: '과학',
    subSubjects: ['물리학Ⅰ', '물리학Ⅱ', '화학Ⅰ', '화학Ⅱ', '생명과학Ⅰ', '생명과학Ⅱ', '지구과학Ⅰ', '지구과학Ⅱ'],
  },
  {
    id: 'vocation',label: '직업탐구',      emoji: '🏭', apiValue: '직업탐구',
    subSubjects: ['농업기초기술', '공업일반', '수산·해운산업기초', '인간발달'],
  },
  {
    id: 'lang2',  label: '제2외국어/한문', emoji: '🌐', apiValue: '제2외국어',
    subSubjects: ['독일어Ⅰ', '프랑스어Ⅰ', '스페인어Ⅰ', '중국어Ⅰ', '일본어Ⅰ', '러시아어Ⅰ', '아랍어Ⅰ', '베트남어Ⅰ', '한문Ⅰ'],
  },
  { id: 'etc',   label: '기타',           emoji: '📝', apiValue: '기타' },
];

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

function getApiSubjectValue(groupId: string, subSubject: string | null): string {
  const group = SUBJECT_GROUPS.find((g) => g.id === groupId);
  if (!group) return '기타';
  if (subSubject) return subSubject;
  return group.apiValue;
}

function getDisplayLabel(groupId: string, subSubject: string | null): string {
  const group = SUBJECT_GROUPS.find((g) => g.id === groupId);
  if (!group) return '기타';
  if (subSubject) return `${group.label} > ${subSubject}`;
  return group.label;
}

// ─── 컴포넌트 ──────────────────────────────────────────────────────────────────

export default function SolvePage() {
  const router = useRouter();

  // 이미지 상태
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 과목 선택 상태
  const [selectedGroupId, setSelectedGroupId] = useState<string>('auto');
  const [selectedSub, setSelectedSub] = useState<string | null>(null);

  // 처리 상태
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [error, setError] = useState<string | null>(null);

  const currentGroup = SUBJECT_GROUPS.find((g) => g.id === selectedGroupId) ?? SUBJECT_GROUPS[0];

  // ── 과목 선택 핸들러 ────────────────────────────────────────────────────────

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedSub(null); // 그룹 바꾸면 하위 초기화
  };

  const handleSubSelect = (sub: string) => {
    setSelectedSub((prev) => (prev === sub ? null : sub)); // 토글
  };

  // ── 파일 처리 ────────────────────────────────────────────────────────────────

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB를 초과할 수 없습니다.');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setSelectedImage(e.target?.result as string);
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  // ── 드래그앤드롭 ─────────────────────────────────────────────────────────────

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // ── 클립보드 붙여넣기 ────────────────────────────────────────────────────────

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const file = new File([blob], `pasted-${Date.now()}.png`, { type: blob.type });
          processFile(file);
        }
        break;
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  // ── 이미지 압축 ──────────────────────────────────────────────────────────────

  const compressImage = (file: File): Promise<{ dataUrl: string; blob: File }> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not available'));

      img.onload = () => {
        const maxWidth = 1200;
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Compression failed'));
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
          resolve({ dataUrl, blob: compressedFile });
        }, 'image/jpeg', 0.85);
      };

      img.onerror = () => reject(new Error('Image load failed'));
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target?.result as string; };
      reader.readAsDataURL(file);
    });
  };

  // ── 분석 실행 ────────────────────────────────────────────────────────────────

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);

    if (StorageManager.needsCleanup()) {
      StorageManager.cleanupOldData();
    }

    try {
      setProcessingStep('이미지 압축 중...');
      const { dataUrl, blob: compressedFile } = await compressImage(selectedFile);
      setSelectedImage(dataUrl);

      setProcessingStep('Gemini Vision AI로 이미지 분석 중...');
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('subject', getApiSubjectValue(selectedGroupId, selectedSub));

      const response = await fetch('/api/process-image', {
        method: 'POST',
        body: formData,
      });

      setProcessingStep('AI 해설 생성 중...');
      const result = await response.json();

      if (!result.success) {
        setError(result.error || '이미지 처리 중 오류가 발생했습니다.');
        return;
      }

      const resultId = result.data.questionId || Date.now().toString();
      const processedResult = {
        id: resultId,
        questionId: result.data.questionId,
        originalImage: dataUrl,
        fileName: selectedFile.name,
        ocrText: result.data.ocrText,
        formattedProblem: result.data.formattedProblem,
        explanation: result.data.explanation,
        subject: result.data.subject,
        score: result.data.score ?? null,
        problemNumber: result.data.problemNumber ?? null,
        problemArea: result.data.problemArea ?? '',
        timestamp: new Date().toISOString(),
        confidence: 95,
      };

      StorageManager.safeSetItem(`processedResult_${resultId}`, JSON.stringify(processedResult));
      router.push(`/new-question/${resultId}`);
    } catch (err) {
      console.error('처리 오류:', err);
      setError('네트워크 오류 또는 서버 응답이 없습니다.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const resetProcess = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setError(null);
    setIsProcessing(false);
    setProcessingStep('');
  };

  // ── 렌더링 ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* 페이지 헤더 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4 mr-2" />
            AI 기반 문제 풀이
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            문제 이미지 업로드
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            문제 사진을 업로드하면 AI가 자동으로{' '}
            <span className="font-semibold text-blue-600 dark:text-blue-400">텍스트 변환 + 해설</span>을 생성합니다
          </p>
        </div>

        <div className="space-y-6">

          {/* ── 수능 과목 선택 ──────────────────────────────────────────────── */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">과목 선택 (선택사항)</CardTitle>
              <CardDescription className="text-xs">
                현재 선택:{' '}
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {getDisplayLabel(selectedGroupId, selectedSub)}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* 1단계: 대분류 */}
              <div className="flex flex-wrap gap-2">
                {SUBJECT_GROUPS.map((group) => {
                  const isActive = selectedGroupId === group.id;
                  return (
                    <button
                      key={group.id}
                      onClick={() => handleGroupSelect(group.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <span>{group.emoji}</span>
                      <span>{group.label}</span>
                      {group.subSubjects && (
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-transform ${isActive ? 'rotate-90' : ''}`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 2단계: 세부 과목 (선택된 그룹에 하위 과목이 있을 때만) */}
              {currentGroup.subSubjects && currentGroup.subSubjects.length > 0 && (
                <div className="pl-3 pt-1 border-l-2 border-blue-200 dark:border-blue-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium uppercase tracking-wide">
                    {currentGroup.emoji} {currentGroup.label} 세부 과목
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentGroup.subSubjects.map((sub) => {
                      const isActive = selectedSub === sub;
                      return (
                        <button
                          key={sub}
                          onClick={() => handleSubSelect(sub)}
                          className={`px-3 py-1 rounded-md text-sm transition-all ${
                            isActive
                              ? 'bg-blue-500 text-white font-medium shadow-sm'
                              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400'
                          }`}
                        >
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

          {/* ── 이미지 업로드 ───────────────────────────────────────────────── */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Camera className="mr-2 h-6 w-6 text-blue-600" />
                문제 이미지
              </CardTitle>
              <CardDescription>
                카메라로 촬영하거나 이미지 파일을 업로드하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedImage ? (
                <div
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer
                    ${dragActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-gray-300 hover:border-blue-400 dark:border-gray-700 dark:hover:border-blue-500'
                    }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileImage className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    문제 이미지 업로드
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    클릭하거나 파일을 드래그하세요
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-6">
                    Ctrl+V로 클립보드 이미지 붙여넣기도 가능
                  </p>

                  {/* 선택된 과목 표시 */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-5 rounded-full bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-sm font-medium">
                    <span>{currentGroup.emoji}</span>
                    <span>{getDisplayLabel(selectedGroupId, selectedSub)}</span>
                  </div>

                  <div>
                    <Button variant="outline" size="lg" className="pointer-events-none">
                      <Upload className="mr-2 h-5 w-5" />
                      파일 선택
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
                    JPG, PNG, GIF 지원 (최대 10MB)
                  </p>
                  {error && (
                    <p className="text-red-500 text-sm mt-3 flex items-center justify-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 이미지 미리보기 */}
                  <div className="relative max-w-2xl mx-auto">
                    <Image
                      src={selectedImage}
                      alt="업로드된 문제"
                      width={800}
                      height={600}
                      className="w-full h-auto max-h-[500px] object-contain rounded-xl border shadow-sm"
                      unoptimized
                    />
                    <Button
                      onClick={resetProcess}
                      size="sm"
                      variant="outline"
                      disabled={isProcessing}
                      className="absolute top-3 right-3 bg-white/90 dark:bg-gray-800/90 rounded-full"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* 선택 과목 배지 */}
                  <div className="flex items-center justify-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-sm font-medium">
                      {currentGroup.emoji} {getDisplayLabel(selectedGroupId, selectedSub)}
                    </span>
                    <span className="text-xs text-gray-400">과목으로 분석합니다</span>
                  </div>

                  {/* 에러 표시 */}
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* 처리 진행 상태 */}
                  {isProcessing && processingStep && (
                    <div className="flex items-center justify-center gap-3 py-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      <span className="text-blue-700 dark:text-blue-300 font-medium">{processingStep}</span>
                    </div>
                  )}

                  {/* 분석 버튼 */}
                  <Button
                    onClick={handleAnalyze}
                    disabled={isProcessing || !selectedFile}
                    className="w-full h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl shadow-lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5 mr-3" />
                        AI 분석 중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-3" />
                        AI로 문제 분석 + 해설 받기
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── AI 분석 과정 안내 ────────────────────────────────────────────── */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                AI 분석 과정
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-center">
                {[
                  {
                    step: '1',
                    icon: '🔍',
                    title: '이미지 분석',
                    desc: 'Gemini Vision AI로 이미지 분석 및 수식 포함 정확한 텍스트 추출',
                  },
                  {
                    step: '2',
                    icon: '🤖',
                    title: 'AI 해설 생성',
                    desc: 'GPT-4o가 문제를 분석하고 단계별 해설 제공',
                  },
                  {
                    step: '3',
                    icon: '📚',
                    title: '히스토리 저장',
                    desc: '분석 결과가 학습 히스토리에 자동 저장',
                  },
                ].map(({ step, icon, title, desc }) => (
                  <div key={step} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl mb-2">{icon}</div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{desc}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </main>

      <AccessibilityFeatures />
    </div>
  );
}
