"use client";

import Navigation from "@/components/Navigation";
import AccessibilityFeatures from "@/components/AccessibilityFeatures";
import { ArrowRight, Eye, Brain, GraduationCap, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main>
        {/* Hero 섹션 */}
        <section
          className="bg-gradient-to-b from-blue-50 via-white to-white pt-32 pb-24 overflow-hidden relative"
        >
          {/* 배경 장식 도형 */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <div
              style={{
                position: "absolute",
                top: "5%",
                left: "15%",
                width: "60px",
                height: "100px",
                transform: "rotate(-15deg)",
                borderRadius: "12px",
                background: "linear-gradient(135deg,#bfdbfe,#eff6ff)",
                opacity: 0.6,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "25%",
                left: "10%",
                width: "50px",
                height: "50px",
                background: "linear-gradient(135deg,#3b82f6,#60a5fa)",
                borderRadius: "12px",
                transform: "rotate(15deg)",
                boxShadow: "0 10px 20px rgba(37,99,235,0.2)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "-10%",
                left: "5%",
                width: "300px",
                height: "300px",
                border: "2px solid rgba(191,219,254,0.5)",
                borderRadius: "40px",
                transform: "rotate(-10deg)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "-10%",
                right: "5%",
                width: "400px",
                height: "400px",
                border: "2px solid rgba(191,219,254,0.5)",
                borderRadius: "60px",
                transform: "rotate(15deg)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "30%",
                right: "12%",
                width: 0,
                height: 0,
                borderLeft: "30px solid transparent",
                borderRight: "30px solid transparent",
                borderBottom: "50px solid #3b82f6",
                filter: "drop-shadow(0 10px 15px rgba(37,99,235,0.3))",
                transform: "rotate(15deg)",
              }}
            />
          </div>

          {/* 컨텐츠 */}
          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <span className="inline-block bg-blue-100 text-blue-600 text-sm font-semibold px-3 py-1 rounded-full mb-6">
              셀프스터디 AI
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-gray-900 leading-tight mb-4 tracking-tight">
              수능, AI와 함께 완벽 정복하세요!
            </h1>

            <p className="text-xl text-gray-500 font-medium mb-4">
              Gemini Vision AI 기반 학습 솔루션
            </p>

            <p className="text-gray-500 mb-10 max-w-2xl mx-auto text-lg">
              수능 문제 이미지를 올리면 AI가 즉시 풀이와 해설, 유사 문제까지 제공합니다.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/solve"
                className="px-8 py-3.5 text-base font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 shadow-lg shadow-blue-200 inline-flex items-center gap-2"
              >
                문제 풀이 시작하기
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="/csat"
                className="px-8 py-3.5 text-base font-bold text-gray-700 bg-white border border-blue-200 rounded-full hover:bg-gray-50 shadow-sm inline-flex items-center gap-2"
              >
                <Eye className="w-5 h-5 text-blue-600" />
                수능 기출 보기
              </a>
            </div>
          </div>
        </section>

        {/* Features 섹션 */}
        <section className="bg-white py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <span className="inline-block bg-blue-100 text-blue-600 text-xs font-bold px-3 py-1 rounded-full mb-4">
                ✨ 핵심 기능
              </span>
              <h2 className="text-3xl font-bold text-gray-900">핵심 기능</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* 카드 1 */}
              <div className="bg-white rounded-2xl p-8 border border-gray-100 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-300 shadow-lg">
                <div className="w-20 h-20 mb-6 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <Brain className="text-blue-500 w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">AI 비전 분석</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  문제 이미지를 업로드하면 AI가 텍스트와 수식을 정확히 인식하고 분석합니다.
                </p>
              </div>

              {/* 카드 2 */}
              <div className="bg-white rounded-2xl p-8 border border-gray-100 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-300 shadow-lg">
                <div className="w-20 h-20 mb-6 rounded-2xl bg-green-50 flex items-center justify-center">
                  <GraduationCap className="text-green-500 w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">수능 기출 라이브러리</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  역대 수능 및 모의평가 기출문제를 과목별로 탐색하고 학습할 수 있습니다.
                </p>
              </div>

              {/* 카드 3 */}
              <div className="bg-white rounded-2xl p-8 border border-gray-100 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-300 shadow-lg">
                <div className="w-20 h-20 mb-6 rounded-2xl bg-purple-50 flex items-center justify-center">
                  <Zap className="text-purple-500 w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">유사 문제 자동 생성</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  AI가 풀었던 문제와 유사한 유형의 문제를 자동으로 생성하여 맞춤형 심화 학습을 돕습니다.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-50 border-t border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-500 font-semibold mb-1">수능 AI 도우미</p>
          <p className="text-gray-400 text-sm">Gemini Vision AI 기반 수능 학습 도우미</p>
          <p className="text-gray-400 text-xs mt-3">© 2025 셀프스터디 AI. All rights reserved.</p>
        </div>
      </footer>

      <AccessibilityFeatures />
    </div>
  );
}
