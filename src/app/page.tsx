"use client";

import Navigation from "@/components/Navigation";
import AccessibilityFeatures from "@/components/AccessibilityFeatures";
import { ArrowRight, Eye, Brain, GraduationCap, Zap, CloudUpload, Bot, Lightbulb, CheckCircle2, BookOpen, BarChart2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Navigation />

      <main>
        {/* ── Hero 섹션 ── */}
        <section className="bg-gradient-to-b from-blue-50 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 pt-32 pb-24 overflow-hidden relative">
          {/* 배경 장식 도형 */}
          <div className="absolute inset-0 pointer-events-none z-0 opacity-60 dark:opacity-20">
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
            <span className="inline-block bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-sm font-semibold px-3 py-1 rounded-full mb-6">
              셀프스터디 AI
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-gray-900 dark:text-white leading-tight mb-4 tracking-tight">
              수능, AI와 함께 완벽 정복하세요!
            </h1>

            <p className="text-xl text-gray-500 dark:text-gray-400 font-medium mb-4">
              Gemini Vision AI 기반 학습 솔루션
            </p>

            <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto text-lg">
              수능 문제 이미지를 올리면 AI가 즉시 풀이와 해설, 유사 문제까지 제공합니다.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/solve"
                className="px-8 py-3.5 text-base font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-blue-900/50 inline-flex items-center gap-2 transition-colors"
              >
                문제 풀이 시작하기
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="/csat"
                className="px-8 py-3.5 text-base font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-blue-200 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm inline-flex items-center gap-2 transition-colors"
              >
                <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                수능 기출 보기
              </a>
            </div>
          </div>
        </section>

        {/* ── 통계 바 ── */}
        <section className="bg-blue-600 dark:bg-blue-800 py-10">
          <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
            {[
              { number: "10+", label: "수능 전 과목 지원" },
              { number: "AI", label: "Gemini Vision 분석" },
              { number: "즉시", label: "해설 및 유사문제 제공" },
              { number: "무료", label: "베타 서비스 무료 이용" },
            ].map(({ number, label }) => (
              <div key={label}>
                <p className="text-3xl font-extrabold mb-1">{number}</p>
                <p className="text-blue-100 text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 핵심 기능 섹션 ── */}
        <section className="bg-white dark:bg-gray-900 py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <span className="inline-block bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-xs font-bold px-3 py-1 rounded-full mb-4">
                ✨ 핵심 기능
              </span>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">핵심 기능</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-300 shadow-lg">
                <div className="w-20 h-20 mb-6 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <Brain className="text-blue-500 w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">AI 비전 분석</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                  문제 이미지를 업로드하면 AI가 텍스트와 수식을 정확히 인식하고 분석합니다.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-300 shadow-lg">
                <div className="w-20 h-20 mb-6 rounded-2xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                  <GraduationCap className="text-green-500 w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">수능 기출 라이브러리</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                  역대 수능 및 모의평가 기출문제를 과목별로 탐색하고 학습할 수 있습니다.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-300 shadow-lg">
                <div className="w-20 h-20 mb-6 rounded-2xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                  <Zap className="text-purple-500 w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">유사 문제 자동 생성</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                  AI가 풀었던 문제와 유사한 유형의 문제를 자동으로 생성하여 맞춤형 심화 학습을 돕습니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 이용 방법 섹션 ── */}
        <section className="bg-blue-50 dark:bg-gray-800 py-20">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <div className="mb-12">
              <span className="block text-sm font-semibold text-blue-500 dark:text-blue-400 tracking-wider mb-2 uppercase">How it Works</span>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">이용 방법</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-3 text-base">3단계로 간단하게 시작하세요</p>
            </div>

            <div className="relative flex flex-col md:flex-row justify-between items-start max-w-3xl mx-auto">
              <div className="absolute top-12 left-0 w-full h-px bg-blue-200 dark:bg-gray-600 hidden md:block" style={{ zIndex: 0 }} />
              {[
                { icon: CloudUpload, label: "1. 문제 업로드", desc: "수능 문제 이미지를 사진 촬영하거나 스캔하여 업로드하세요" },
                { icon: Bot, label: "2. AI 분석 및 변환", desc: "Gemini Vision AI가 이미지를 분석하고 풀이를 생성합니다" },
                { icon: Lightbulb, label: "3. 해설 및 유사 문제 받기", desc: "상세 해설과 함께 유사 유형의 연습 문제를 받아보세요" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="relative flex flex-col items-center w-full md:w-1/3 z-10 mb-10 md:mb-0 px-4">
                  <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-700 border-4 border-blue-100 dark:border-blue-900 flex items-center justify-center mb-5 shadow-sm">
                    <Icon className="w-10 h-10 text-blue-500 dark:text-blue-400" />
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">{label}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 지원 과목 태그 섹션 ── */}
        <section className="bg-white dark:bg-gray-900 py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="block text-sm font-semibold text-blue-500 dark:text-blue-400 tracking-wider mb-2 uppercase">Subjects</span>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">수능 전 과목 지원</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-10 text-base">국어부터 제2외국어까지 모든 수능 과목을 분석할 수 있습니다</p>

            <div className="flex flex-wrap justify-center gap-3">
              {[
                { label: "📖 국어", sub: "화법과작문 · 언어와매체" },
                { label: "📐 수학", sub: "확률과통계 · 미적분 · 기하" },
                { label: "🌍 영어", sub: "" },
                { label: "🏛 한국사", sub: "" },
                { label: "🗺 사회탐구", sub: "9개 선택 과목" },
                { label: "🔬 과학탐구", sub: "8개 선택 과목" },
                { label: "🏭 직업탐구", sub: "" },
                { label: "🌐 제2외국어/한문", sub: "9개 선택 과목" },
              ].map(({ label, sub }) => (
                <div
                  key={label}
                  className="bg-blue-50 dark:bg-gray-800 border border-blue-100 dark:border-gray-700 rounded-xl px-5 py-3 text-left min-w-[140px]"
                >
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{label}</p>
                  {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 장점 목록 섹션 ── */}
        <section className="bg-gray-50 dark:bg-gray-800 py-20">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <span className="block text-sm font-semibold text-blue-500 dark:text-blue-400 tracking-wider mb-2 uppercase">Why Us</span>
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">왜 셀프스터디 AI인가요?</h2>
                <ul className="space-y-4">
                  {[
                    { icon: CheckCircle2, text: "이미지 한 장으로 즉시 상세 해설 제공" },
                    { icon: BookOpen, text: "수능 출제 경향에 맞춘 유사 문제 생성" },
                    { icon: BarChart2, text: "과목별 학습 현황 및 통계 대시보드" },
                    { icon: Zap, text: "클립보드 붙여넣기 · 드래그앤드롭 지원" },
                    { icon: GraduationCap, text: "역대 수능 기출문제 PDF 뷰어 제공" },
                  ].map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-start gap-3">
                      <Icon className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300 text-base">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-600">
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Brain className="w-10 h-10 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Gemini Vision AI</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                    Google의 최신 멀티모달 AI가 이미지 속 수식, 그래프, 표까지 정확하게 인식하고 분석합니다.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {["수식 인식", "그래프 분석", "표 해석", "한국어 최적화"].map((tag) => (
                      <span key={tag} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2.5 py-1 rounded-full font-medium border border-blue-100 dark:border-blue-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA 섹션 ── */}
        <section className="bg-blue-600 dark:bg-blue-700 py-20">
          <div className="max-w-2xl mx-auto px-4 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">지금 바로 시작해보세요!</h2>
            <p className="text-blue-100 text-lg mb-8">
              수능 문제 이미지 한 장으로 AI 해설과 유사 문제를 무료로 받아보세요.
            </p>
            <a
              href="/solve"
              className="inline-flex items-center gap-2 px-10 py-4 text-lg font-bold text-blue-600 bg-white rounded-full hover:bg-blue-50 shadow-xl transition-colors"
            >
              문제 풀이 시작하기
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </section>
      </main>

      <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 py-10">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-500 dark:text-gray-400 font-semibold mb-1">수능 AI 도우미</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">Gemini Vision AI 기반 수능 학습 도우미</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-3">© 2025 셀프스터디 AI. All rights reserved.</p>
        </div>
      </footer>

      <AccessibilityFeatures />
    </div>
  );
}
