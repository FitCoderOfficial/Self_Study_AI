'use client';

import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PdfExportButtonProps {
  questionId: string;
  mode?: 'icon' | 'button';
}

export default function PdfExportButton({ questionId, mode = 'button' }: PdfExportButtonProps) {
  const handleExport = () => {
    window.open(`/api/export/pdf?id=${questionId}`, '_blank');
  };

  if (mode === 'icon') {
    return (
      <button
        onClick={handleExport}
        title="PDF로 저장"
        className="flex items-center p-1.5 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <FileDown className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      className="w-full h-11 dark:border-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500"
    >
      <FileDown className="w-4 h-4 mr-2" />
      PDF로 저장
    </Button>
  );
}
