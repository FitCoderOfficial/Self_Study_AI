'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle, Upload } from 'lucide-react';

interface NotionExportButtonProps {
  questionId: string;
  mode?: 'icon' | 'button';
  onSuccess?: () => void;
}

export default function NotionExportButton({
  questionId,
  mode = 'button',
  onSuccess,
}: NotionExportButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'needs_setup'>('idle');

  const handleExport = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/notion/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIds: [questionId], includeSimilar: true }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        onSuccess?.();
        setTimeout(() => setStatus('idle'), 3000);
      } else if (data.needsSetup) {
        setStatus('needs_setup');
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  // 아이콘 모드 (히스토리 카드용 - 소형)
  if (mode === 'icon') {
    if (status === 'needs_setup') {
      return (
        <Link
          href="/profile"
          className="flex items-center p-1.5 text-amber-500 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
          title="Notion 연동 필요 - 프로필에서 설정하세요"
        >
          <Upload className="w-3.5 h-3.5" />
        </Link>
      );
    }

    return (
      <button
        onClick={handleExport}
        disabled={status === 'loading'}
        title={
          status === 'success' ? 'Notion에 저장 완료!'
            : status === 'error' ? '내보내기 실패'
            : 'Notion에 내보내기'
        }
        className="flex items-center p-1.5 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        {status === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {status === 'success' && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
        {status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
        {status === 'idle' && <Upload className="w-3.5 h-3.5" />}
      </button>
    );
  }

  // 버튼 모드 (문제 풀기 페이지용 - 전체 크기)
  if (status === 'needs_setup') {
    return (
      <Link href="/profile">
        <Button variant="outline" className="w-full h-11 dark:border-gray-600 dark:text-gray-300 border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20">
          <Upload className="w-4 h-4 mr-2" />
          Notion 연동 필요 → 설정하기
        </Button>
      </Link>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={status === 'loading'}
      className={`w-full h-11 transition-all dark:border-gray-600 dark:text-gray-300 ${
        status === 'success'
          ? 'border-green-400 text-green-600 bg-green-50 dark:border-green-700 dark:text-green-400 dark:bg-green-900/20'
          : status === 'error'
          ? 'border-red-300 text-red-500 dark:border-red-800 dark:text-red-400'
          : 'hover:border-gray-400 dark:hover:border-gray-500'
      }`}
    >
      {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
      {status === 'success' && <CheckCircle className="w-4 h-4 mr-2 text-green-500" />}
      {status === 'error' && <AlertCircle className="w-4 h-4 mr-2 text-red-400" />}
      {status === 'idle' && <Upload className="w-4 h-4 mr-2" />}
      {status === 'loading' ? 'Notion에 내보내는 중...'
        : status === 'success' ? 'Notion에 저장 완료!'
        : status === 'error' ? '내보내기 실패 - 다시 시도'
        : 'Notion에 내보내기'}
    </Button>
  );
}
