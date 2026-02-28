"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navigation from "@/components/Navigation";
import AccessibilityFeatures from "@/components/AccessibilityFeatures";
import { Cloud, CloudUpload, ArrowRight, ImageIcon, AlertCircle, Loader2, Sparkles, RotateCcw, Bot, Lightbulb } from "lucide-react";
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
    <div className="min-h-screen bg-[#eff6ff]">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 py-10">

        {/* 페이지 제목 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-blue-500 mb-3">
            <Cloud className="w-8 h-8" />
            <h1 className="text-3xl font-bold text-gray-900">수능 AI 문제 풀이</h1>
          </div>
        </div>

        {/* 과목 선택 */}
        <nav className="mb-8">
          <ul className="flex flex-wrap justify-center gap-3">
            {SUBJECT_GROUPS.map((group) => {
              const isActive = selectedGroupId === group.id;
              return (
                <li key={group.id}>
                  <button
                    onClick={() => handleGroupSelect(group.id)}
                    className={`flex items-center gap-2 px-6 h-12 font-bold rounded-xl border text-base transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                        : 'bg-white text-gray-800 border-blue-100 hover:bg-blue-50 hover:border-blue-200'
                    }`}
                  >
                    <span className="text-lg">{group.emoji}</span>
                    {group.label}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* 2단계 세부과목 */}
          {currentGroup.subSubjects && currentGroup.subSubjects.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {currentGroup.subSubjects.map((sub) => {
                const isActive = selectedSub === sub;
                return (
                  <button
                    key={sub}
                    onClick={() => handleSubSelect(sub)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      isActive
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          )}
        </nav>

        {/* 업로드 영역 */}
        {!selectedImage ? (
          <section
            className={`w-full bg-white rounded-[2.5rem] py-20 px-8 border-4 border-dashed flex flex-col items-center justify-center text-center transition-colors cursor-pointer mb-12 ${
              dragActive ? 'border-blue-500 bg-blue-50/20' : 'border-blue-300 hover:bg-blue-50/10'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex items-center gap-4 text-6xl mb-6">
              <CloudUpload className="w-16 h-16 text-blue-500" />
              <ArrowRight className="w-10 h-10 text-gray-300" />
              <ImageIcon className="w-16 h-16 text-gray-300" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">문제 이미지 업로드</h2>
            <p className="text-gray-500 mb-8 max-w-md">
              여기에 파일을 드래그하거나 클릭하여 업로드하세요<br />
              (JPG, PNG, GIF) · Ctrl+V 붙여넣기 지원
            </p>
            {/* 선택 과목 표시 */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-6 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium">
              <span>{currentGroup.emoji}</span>
              <span>{getDisplayLabel(selectedGroupId, selectedSub)}</span>
            </div>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-12 rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            >
              파일 선택
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {error && (
              <p className="text-red-500 text-sm mt-4 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
          </section>
        ) : (
          /* 이미지 선택된 상태 */
          <section className="w-full bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm mb-12">
            <div className="relative max-w-2xl mx-auto mb-6">
              <Image
                src={selectedImage}
                alt="업로드된 문제"
                width={800}
                height={600}
                className="w-full h-auto max-h-[500px] object-contain rounded-xl border shadow-sm"
                unoptimized
              />
              <button
                onClick={resetProcess}
                disabled={isProcessing}
                className="absolute top-3 right-3 bg-white/90 border border-gray-200 rounded-full px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4 inline mr-1" />다시 선택
              </button>
            </div>

            {/* 선택 과목 */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium">
                {currentGroup.emoji} {getDisplayLabel(selectedGroupId, selectedSub)}
              </span>
              <span className="text-xs text-gray-400">과목으로 분석합니다</span>
            </div>

            {/* 에러 */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* 처리 상태 */}
            {isProcessing && processingStep && (
              <div className="flex items-center justify-center gap-3 py-3 bg-blue-50 rounded-lg mb-4">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-blue-700 font-medium">{processingStep}</span>
              </div>
            )}

            {/* 분석 버튼 */}
            <button
              onClick={handleAnalyze}
              disabled={isProcessing || !selectedFile}
              className="w-full h-14 text-lg font-bold text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 animate-spin" />AI 분석 중...</>
              ) : (
                <><Sparkles className="w-5 h-5" />AI로 문제 분석 + 해설 받기</>
              )}
            </button>
          </section>
        )}

        {/* 이용 방법 섹션 */}
        <section className="w-full text-center pb-12">
          <div className="mb-10">
            <span className="block text-sm font-semibold text-gray-400 tracking-wider mb-2">How it Works</span>
            <h2 className="text-4xl font-extrabold text-gray-900">이용 방법</h2>
          </div>
          <div className="relative flex flex-col md:flex-row justify-between items-start max-w-3xl mx-auto">
            {/* 연결선 */}
            <div className="absolute top-12 left-0 w-full h-px bg-gray-200 hidden md:block" style={{ zIndex: 0 }} />
            {[
              { icon: CloudUpload, label: '1. 문제 업로드' },
              { icon: Bot, label: '2. AI 분석 및 변환' },
              { icon: Lightbulb, label: '3. 해설 및 유사 문제 받기' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="relative flex flex-col items-center w-full md:w-1/3 z-10 mb-8 md:mb-0">
                <div className="w-24 h-24 rounded-full bg-white border-4 border-blue-100 flex items-center justify-center mb-6 shadow-sm">
                  <Icon className="w-10 h-10 text-blue-500" />
                </div>
                <p className="text-lg font-bold text-gray-900">{label}</p>
              </div>
            ))}
          </div>
        </section>

      </main>
      <AccessibilityFeatures />
    </div>
  );
}
