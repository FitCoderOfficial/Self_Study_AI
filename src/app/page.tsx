"use client";

import { useState } from "react";
import Navigation from "@/components/Navigation";
import AccessibilityFeatures from "@/components/AccessibilityFeatures";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload, BookOpen, Brain, Users, Zap, Sparkles } from "lucide-react";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
    alert("로그인되었습니다! (데모용)");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    alert("로그아웃되었습니다! (데모용)");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation 
        isLoggedIn={isLoggedIn} 
        onLogin={handleLogin} 
        onLogout={handleLogout} 
      />
      
      <main>
        {/* 히어로 섹션 */}
        <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-20 overflow-hidden">
          {/* 배경 장식 요소 */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 dark:bg-blue-800 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 dark:bg-purple-800 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
            <div className="absolute top-40 left-1/2 w-60 h-60 bg-indigo-200 dark:bg-indigo-800 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-500"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-6">
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-blue-200 dark:border-blue-600 mb-6">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">AI 기반 학습 솔루션</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent mb-6">
                셀프스터디 AI
              </h1>
              
              <p className="text-xl md:text-3xl mb-6 max-w-4xl mx-auto font-medium text-gray-700 dark:text-gray-200">
                청각장애 학생들을 위한 
                <span className="font-bold text-blue-600 dark:text-blue-400"> AI 기반 시험문제 풀이</span> 서비스
              </p>
              
              <p className="text-lg md:text-xl mb-12 max-w-3xl mx-auto leading-relaxed text-gray-600 dark:text-gray-300">
                문제를 찍으면 AI가 즉시 정답과 상세한 해설을 제공합니다. 
                <br className="hidden md:block" />
                학습의 장벽을 없애고 <span className="font-semibold text-blue-600 dark:text-blue-400">동등한 교육 기회</span>를 만들어갑니다.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
                <Button size="lg" className="text-lg px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full" asChild>
                  <a href="/solve" className="flex items-center justify-center">
                    <Camera className="mr-3 h-6 w-6" />
                    문제 풀이 시작하기
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-10 py-4 border-2 hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-600 transition-all duration-300 rounded-full" asChild>
                  <a href="/archive" className="flex items-center justify-center">
                    <BookOpen className="mr-3 h-6 w-6" />
                    질문 아카이브 보기
                  </a>
                </Button>
              </div>

              {/* 통계 카드 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-white/20 dark:border-gray-700/20">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">95%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">OCR 정확도</div>
                </div>
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-white/20 dark:border-gray-700/20">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">10초</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">평균 응답시간</div>
                </div>
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-white/20 dark:border-gray-700/20">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">1000+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">활성 사용자</div>
                </div>
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-white/20 dark:border-gray-700/20">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">24/7</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">언제든 이용</div>
                </div>
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
                혁신적인 AI 기술
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                주요 기능
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                AI 기술을 활용한 혁신적인 학습 도구들로 
                <span className="font-semibold text-blue-600 dark:text-blue-400"> 학습의 장벽을 없애고</span> 
                더 나은 교육 환경을 제공합니다
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="text-center group hover:shadow-xl transition-all duration-300 border-0 shadow-lg dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="pb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Camera className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">문제 촬영</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    스마트폰 카메라나 웹캠으로 시험문제를 간편하게 촬영하세요. 
                    고해상도 이미지로 정확한 인식을 보장합니다.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center group hover:shadow-xl transition-all duration-300 border-0 shadow-lg dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="pb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Brain className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">AI 인식</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    OCR 기술로 텍스트와 수식을 정확하게 인식하고 분석합니다. 
                    95% 이상의 높은 정확도를 자랑합니다.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center group hover:shadow-xl transition-all duration-300 border-0 shadow-lg dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="pb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Zap className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">즉시 해설</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    10초 이내에 정답과 상세한 단계별 풀이를 제공합니다. 
                    이해하기 쉬운 설명으로 학습 효과를 극대화합니다.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center group hover:shadow-xl transition-all duration-300 border-0 shadow-lg dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="pb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">질문 아카이브</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    과거 질문들을 과목별, 날짜별로 정리하여 관리할 수 있습니다. 
                    언제든지 복습할 수 있는 개인 학습 데이터베이스입니다.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center group hover:shadow-xl transition-all duration-300 border-0 shadow-lg dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="pb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">개인화 학습</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    자주 틀리는 문제 유형을 분석하여 맞춤형 학습을 지원합니다. 
                    AI가 개인별 학습 패턴을 파악하여 최적화된 학습 계획을 제안합니다.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center group hover:shadow-xl transition-all duration-300 border-0 shadow-lg dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="pb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">접근성</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    시각적 정보를 텍스트로 전환하여 학습 장벽을 해소합니다. 
                    모든 학생이 동등한 교육 기회를 누릴 수 있도록 설계되었습니다.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* 사용자 스토리 섹션 */}
        <section className="bg-gray-100 dark:bg-gray-900 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                사용자 스토리
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                실제 사용자들의 경험을 들어보세요
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <Card className="dark:bg-gray-800 dark:border-gray-700 dark:shadow-gray-900/50">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">김</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        김민준 (17세, 고등학생)
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        &quot;수학 문제를 풀다가 막히면 선생님께 질문하기 어려웠어요. 
                        셀프스터디 AI를 사용한 후로는 문제를 찍으면 바로 해설을 볼 수 있어서 
                        혼자서도 충분히 공부할 수 있게 되었습니다. 
                        특히 수식이 복잡한 문제도 정확하게 인식해주어서 정말 도움이 됩니다.&quot;
                      </p>
                    </div>
                  </div>
                </CardContent>
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
              AI 기술로 학습의 장벽을 없애고, 더 나은 교육 환경을 만들어갑니다
            </p>
            <Button size="lg" variant="secondary" className="text-lg px-10 py-4 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 rounded-full transition-all duration-300" asChild>
              <a href="/solve">무료로 시작하기</a>
            </Button>
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
              청각장애 학생들을 위한 AI 기반 시험문제 풀이 서비스
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2024 셀프스터디 AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* 접근성 기능 */}
      <AccessibilityFeatures />
    </div>
  );
}
