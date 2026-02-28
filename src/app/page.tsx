"use client";

import Navigation from "@/components/Navigation";
import AccessibilityFeatures from "@/components/AccessibilityFeatures";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Camera, Upload, BookOpen, Brain, Zap, Sparkles,
  GraduationCap, BarChart2, FileText, Crop,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <main>
        {/* 히어로 섹션 */}
        <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-20 overflow-hidden">
          {/* 배경 장식 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 dark:bg-blue-800 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 dark:bg-purple-800 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000" />
            <div className="absolute top-40 left-1/2 w-60 h-60 bg-indigo-200 dark:bg-indigo-800 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-500" />
          </div>

          <div className="relative max-w-7xl mx-auto px-6">
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-blue-200 dark:border-blue-600 mb-6">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Gemini Vision AI 기반 학습 솔루션</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent mb-6">
                셀프스터디 AI
              </h1>

              <p className="text-xl md:text-3xl mb-6 max-w-4xl mx-auto font-medium text-gray-700 dark:text-gray-200">
                수능 문제 이미지를 올리면
                <span className="font-bold text-blue-600 dark:text-blue-400"> AI가 즉시 풀이와 해설</span>을 제공합니다
              </p>

              <p className="text-lg md:text-xl mb-12 max-w-3xl mx-auto leading-relaxed text-gray-600 dark:text-gray-300">
                수능 기출 시험지 열람부터 유사문제 생성, 학습 대시보드까지
                <br className="hidden md:block" />
                <span className="font-semibold text-blue-600 dark:text-blue-400">수능 학습의 모든 것</span>을 한 곳에서.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
                <Button size="lg"
                  className="text-lg px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full"
                  asChild>
                  <a href="/solve" className="flex items-center justify-center">
                    <Camera className="mr-3 h-6 w-6" />
                    문제 풀이 시작하기
                  </a>
                </Button>
                <Button size="lg" variant="outline"
                  className="text-lg px-10 py-4 border-2 hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-600 transition-all duration-300 rounded-full"
                  asChild>
                  <a href="/csat" className="flex items-center justify-center">
                    <GraduationCap className="mr-3 h-6 w-6" />
                    수능 기출 보기
                  </a>
                </Button>
              </div>

              {/* 실제 기능 하이라이트 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                {[
                  { label: 'Gemini Vision AI', sub: '이미지 분석' },
                  { label: 'KaTeX', sub: '수식 렌더링' },
                  { label: '수능 기출', sub: 'PDF 뷰어' },
                  { label: '학습 대시보드', sub: '성취 추적' },
                ].map(({ label, sub }) => (
                  <div key={label}
                    className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-white/20 dark:border-gray-700/20">
                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{label}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 주요 기능 섹션 */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4 mr-2" />
                핵심 기능
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                주요 기능
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                AI 기술로 수능 학습을 더 스마트하게.
                <span className="font-semibold text-blue-600 dark:text-blue-400"> 문제 분석부터 성취 추적까지</span>
                모든 학습 과정을 지원합니다.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="text-center group hover:shadow-xl transition-all duration-300 border-0 shadow-lg dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="pb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Brain className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Gemini Vision 문제 분석</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Google Gemini Vision AI가 수학·국어·과학 문제 이미지를 즉시 분석합니다.
                    수식도 KaTeX로 정확하게 렌더링합니다.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center group hover:shadow-xl transition-all duration-300 border-0 shadow-lg dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="pb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <GraduationCap className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">수능 기출 시험지</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    역대 수능·모의평가 시험지를 과목별로 바로 열람하세요.
                    PDF.js 기반 뷰어로 드래그하여 문제를 직접 캡처·분석할 수 있습니다.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center group hover:shadow-xl transition-all duration-300 border-0 shadow-lg dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="pb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Zap className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">유사문제 자동 생성</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    AI가 풀었던 문제와 동일한 유형의 유사문제를 즉시 생성합니다.
                    선택지 채점과 오답 설명으로 심화 학습을 지원합니다.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center group hover:shadow-xl transition-all duration-300 border-0 shadow-lg dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="pb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">학습 히스토리</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    풀었던 문제를 과목·태그별로 정리하고, 블러 처리된 해설을 클릭하여 자기 점검하세요.
                    수능 과목 프리셋 태그를 제공합니다.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center group hover:shadow-xl transition-all duration-300 border-0 shadow-lg dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="pb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <BarChart2 className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">학습 대시보드</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    과목별 정답률, 30일 히트맵, 연속 학습일, 주간 활동 차트로
                    나의 성취를 한눈에 파악하세요.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center group hover:shadow-xl transition-all duration-300 border-0 shadow-lg dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="pb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Crop className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">드래그 문제 캡처</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    수능 기출 PDF 뷰어에서 원하는 문제 영역을 드래그하면 즉시 AI 분석으로 연결됩니다.
                    모바일 터치도 지원합니다.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA 섹션 */}
        <section className="bg-primary dark:bg-gray-800 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white dark:text-gray-100 mb-4">
              지금 시작해보세요
            </h2>
            <p className="text-xl text-blue-100 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              문제 이미지를 업로드하거나 수능 기출 시험지에서 드래그하여 AI 해설을 받아보세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary"
                className="text-lg px-10 py-4 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 rounded-full transition-all duration-300"
                asChild>
                <a href="/solve">
                  <Upload className="mr-2 h-5 w-5" />
                  이미지 업로드
                </a>
              </Button>
              <Button size="lg" variant="outline"
                className="text-lg px-10 py-4 border-white text-white hover:bg-white hover:text-blue-600 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-700 rounded-full transition-all duration-300"
                asChild>
                <a href="/csat">
                  <FileText className="mr-2 h-5 w-5" />
                  기출 시험지 보기
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-gray-900 dark:text-gray-100" />
              </div>
              <span className="text-xl font-bold">셀프스터디 AI</span>
            </div>
            <p className="text-gray-400 dark:text-gray-300 mb-4">
              Gemini Vision AI 기반 수능 학습 도우미
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2025 셀프스터디 AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* 접근성 기능 */}
      <AccessibilityFeatures />
    </div>
  );
}
