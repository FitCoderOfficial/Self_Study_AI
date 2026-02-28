"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, Clipboard, Loader2, Camera } from 'lucide-react';

interface CaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubject?: string; // CSAT 현재 선택 과목 (국어, 수학 등)
}

const SUBJECT_MAP: Record<string, string> = {
  '국어': '국어',
  '수학': '수학',
  '영어': '영어',
  '한국사': '기타',
  '사회탐구': '사회',
  '과학탐구': '과학',
  '직업탐구': '기타',
  '제2외국어': '기타',
};

const API_SUBJECTS = ['기타', '국어', '수학', '영어', '사회', '과학'];

function compressImage(file: File): Promise<{ dataUrl: string; blob: File }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxWidth = 1200;
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      canvas.toBlob((blob) => {
        const compressed = new File(
          [blob!],
          file.name.replace(/\.[^.]+$/, '.jpg'),
          { type: 'image/jpeg' }
        );
        resolve({ dataUrl, blob: compressed });
      }, 'image/jpeg', 0.85);
    };
    img.src = url;
  });
}

export default function CaptureModal({ isOpen, onClose, defaultSubject = '기타' }: CaptureModalProps) {
  const router = useRouter();
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [pastedFile, setPastedFile] = useState<File | null>(null);
  const [subject, setSubject] = useState(SUBJECT_MAP[defaultSubject] ?? '기타');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // defaultSubject가 바뀌면 과목 동기화
  useEffect(() => {
    setSubject(SUBJECT_MAP[defaultSubject] ?? '기타');
  }, [defaultSubject]);

  // 모달 닫힐 때 초기화
  useEffect(() => {
    if (!isOpen) {
      setPastedImage(null);
      setPastedFile(null);
      setError(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

  // 클립보드 붙여넣기 핸들러
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    if (!isOpen) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image')) {
        const blob = items[i].getAsFile();
        if (!blob) break;
        const file = new File([blob], `capture-${Date.now()}.png`, { type: blob.type });
        const { dataUrl, blob: compressed } = await compressImage(file);
        setPastedImage(dataUrl);
        setPastedFile(compressed);
        setError(null);
        break;
      }
    }
  }, [isOpen]);

  useEffect(() => {
    document.addEventListener('paste', handlePaste as unknown as EventListener);
    return () => document.removeEventListener('paste', handlePaste as unknown as EventListener);
  }, [handlePaste]);

  const handleSave = async () => {
    if (!pastedFile || !pastedImage) return;
    setIsProcessing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', pastedFile);
      formData.append('subject', subject);

      const res = await fetch('/api/process-image', { method: 'POST', body: formData });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'AI 분석 실패');

      const resultId = data.data.questionId || Date.now().toString();
      const processedResult = {
        id: resultId,
        questionId: data.data.questionId,
        originalImage: pastedImage,
        fileName: pastedFile.name,
        ocrText: data.data.ocrText,
        formattedProblem: data.data.formattedProblem,
        explanation: data.data.explanation,
        subject: data.data.subject,
        score: data.data.score ?? null,
        problemNumber: data.data.problemNumber ?? null,
        problemArea: data.data.problemArea ?? '',
        timestamp: new Date().toISOString(),
        confidence: 95,
      };
      localStorage.setItem(`processedResult_${resultId}`, JSON.stringify(processedResult));
      onClose();
      router.push(`/new-question/${resultId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다');
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const selectClass = "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">문제 저장하기</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 안내 */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          문제 영역을 캡처 후 이 창에 붙여넣으면 AI가 분석해서 히스토리에 저장합니다.
        </p>

        {/* 과목 선택 */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">과목</label>
          <select value={subject} onChange={e => setSubject(e.target.value)} className={selectClass}>
            {API_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* 이미지 붙여넣기 영역 */}
        {pastedImage ? (
          <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-4 bg-gray-50 dark:bg-gray-900">
            <img
              src={pastedImage}
              alt="캡처된 문제"
              className="w-full max-h-56 object-contain"
            />
            <button
              onClick={() => { setPastedImage(null); setPastedFile(null); }}
              className="absolute top-2 right-2 p-1 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center mb-4 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
            <Clipboard className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Ctrl+V 로 붙여넣기
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              <span className="font-medium text-gray-600 dark:text-gray-300">Win+Shift+S</span> 로 캡처 후<br />
              이 창을 클릭하고 <span className="font-medium text-gray-600 dark:text-gray-300">Ctrl+V</span>
            </p>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400 mb-4 px-1">{error}</p>
        )}

        {/* 버튼 */}
        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!pastedImage || isProcessing}
            className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                AI 분석 중...
              </>
            ) : (
              '분석 후 저장'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
