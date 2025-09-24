'use client';

import React from 'react';
import { Navigation } from '@/components/Navigation';
import { MathImageProcessor } from '@/components/MathImageProcessor';

export default function MathProcessorPage() {
  const handleResult = (result: string) => {
    console.log('처리 결과:', result);
  };

  const handleError = (error: string) => {
    console.error('처리 오류:', error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            수학 이미지 처리기
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            수학 문제가 포함된 이미지를 업로드하면 AI가 텍스트와 수학 기호로 변환해드립니다.
          </p>
        </div>

        <MathImageProcessor 
          onResult={handleResult}
          onError={handleError}
        />

        {/* 사용법 안내 */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              사용법 및 테스트 방법
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">✅ 정상 처리 테스트</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 임의의 이미지 파일 업로드</li>
                  <li>• 2초 후 수학 기호가 포함된 결과 확인</li>
                  <li>• LaTeX 수식이 정상 렌더링되는지 확인</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">❌ 오류 처리 테스트</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 파일명에 'error' 포함하여 업로드</li>
                  <li>• 예: 'math-error.jpg', 'test_error.png'</li>
                  <li>• 오류 메시지와 재시도 버튼 확인</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">지원되는 수학 기호 예시</h3>
              <div className="text-sm text-blue-800">
                <p className="mb-2">인라인 수식: \(x^2 + y^2 = r^2\)</p>
                <p>블록 수식:</p>
                <div className="mt-2 p-2 bg-white rounded border">
                  $$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
