'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { processImageMock, ImageProcessResponse } from '@/api/mockData';
import { Upload, FileImage, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

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

interface MathImageProcessorProps {
  onResult?: (result: string) => void;
  onError?: (error: string) => void;
}

export const MathImageProcessor: React.FC<MathImageProcessorProps> = ({
  onResult,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // MathJax 타입셋팅 함수
  const typesetMath = async () => {
    if (typeof window !== 'undefined' && window.MathJax) {
      try {
        await window.MathJax.startup?.promise;
        if (window.MathJax.typesetPromise) {
          await window.MathJax.typesetPromise();
        }
      } catch (error) {
        console.error('MathJax typeset error:', error);
      }
    }
  };

  // 결과 텍스트가 변경될 때마다 MathJax 재렌더링
  useEffect(() => {
    if (resultText) {
      const timer = setTimeout(typesetMath, 100);
      return () => clearTimeout(timer);
    }
  }, [resultText]);

  // 파일 처리 함수
  const handleFileProcess = async (file: File) => {
    if (!file) return;

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      const errorMsg = '이미지 파일만 업로드 가능합니다.';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // 파일 크기 검증 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      const errorMsg = '파일 크기는 10MB 이하여야 합니다.';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // 상태 초기화
    setIsLoading(true);
    setError(null);
    setResultText(null);
    setSelectedFile(file);

    try {
      const response: ImageProcessResponse = await processImageMock(file);
      
      if (response.success && response.data) {
        setResultText(response.data.processedText);
        onResult?.(response.data.processedText);
      } else {
        const errorMsg = response.error || '알 수 없는 오류가 발생했습니다.';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = '서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.';
      setError(errorMsg);
      onError?.(errorMsg);
      console.error('API 호출 에러:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 파일 선택 핸들러
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileProcess(file);
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
      handleFileProcess(file);
    }
  };

  // 파일 선택 버튼 클릭
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // 다시 시도 함수
  const handleRetry = () => {
    if (selectedFile) {
      handleFileProcess(selectedFile);
    } else {
      handleButtonClick();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* 파일 업로드 영역 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="w-5 h-5" />
            수학 이미지 업로드
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
              ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
              ${isLoading ? 'pointer-events-none opacity-50' : 'hover:border-gray-400'}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isLoading}
            />
            
            {isLoading ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-gray-600">이미지를 처리하고 있습니다...</p>
                <p className="text-sm text-gray-500">
                  {selectedFile ? `처리 중: ${selectedFile.name}` : ''}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Upload className="w-8 h-8 text-gray-400" />
                <div>
                  <p className="text-lg font-medium text-gray-700">
                    이미지를 여기에 드래그하거나 클릭하여 선택하세요
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    JPG, PNG 파일 지원 (최대 10MB)
                  </p>
                </div>
                <Button onClick={handleButtonClick} className="mt-2">
                  파일 선택
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 오류 표시 */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-700 font-medium">오류가 발생했습니다</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
                <Button 
                  onClick={handleRetry} 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
                >
                  다시 시도
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 결과 표시 */}
      {resultText && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              수학 기호 변환 결과
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              ref={resultRef}
              className="bg-white p-6 rounded-lg border shadow-sm"
              dangerouslySetInnerHTML={{ __html: resultText }}
            />
            <div className="mt-4 p-3 bg-green-100 rounded-lg">
              <p className="text-sm text-green-700">
                <strong>팁:</strong> 오류 테스트를 원하시면 파일명에 'error'를 포함시켜 업로드해보세요.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MathImageProcessor;
