"use client";

import Navigation from "@/components/Navigation";
import { Check, X, ArrowRight, Zap, Star, Sparkles } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    id: "free",
    name: "무료",
    price: "0",
    period: "",
    description: "AI 공부 도우미를 처음 경험해보세요",
    badge: null,
    color: "border-gray-200 dark:border-gray-700",
    headerBg: "bg-gray-50 dark:bg-gray-800",
    btnClass: "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700",
    btnText: "무료로 시작하기",
    btnHref: "/signup",
    features: [
      { text: "AI 문제 분석 10회/월", included: true },
      { text: "수능 기출 뷰어", included: true },
      { text: "학습 히스토리 30일 보관", included: true },
      { text: "PDF 내보내기", included: true },
      { text: "유사 문제 생성 무제한", included: false },
      { text: "학습 히스토리 무제한 보관", included: false },
      { text: "Notion 내보내기", included: false },
      { text: "AI 약점 분석 리포트", included: false },
      { text: "AI 대화형 튜터", included: false },
    ],
  },
  {
    id: "standard",
    name: "스탠다드",
    price: "6,900",
    period: "/월",
    description: "수능 준비에 필요한 모든 AI 기능을 무제한으로",
    badge: "인기",
    color: "border-blue-500 dark:border-blue-400",
    headerBg: "bg-blue-600 dark:bg-blue-700",
    btnClass: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/50",
    btnText: "스탠다드 시작하기",
    btnHref: "/signup",
    features: [
      { text: "AI 문제 분석 무제한", included: true },
      { text: "수능 기출 뷰어", included: true },
      { text: "학습 히스토리 무제한 보관", included: true },
      { text: "PDF 내보내기", included: true },
      { text: "유사 문제 생성 무제한", included: true },
      { text: "학습 히스토리 무제한 보관", included: true },
      { text: "Notion 내보내기", included: false },
      { text: "AI 약점 분석 리포트", included: false },
      { text: "AI 대화형 튜터", included: false },
    ],
  },
  {
    id: "premium",
    name: "프리미엄",
    price: "14,900",
    period: "/월",
    description: "최상의 학습 경험 — AI 튜터와 함께 수능 완벽 정복",
    badge: "최강",
    color: "border-purple-500 dark:border-purple-400",
    headerBg: "bg-gradient-to-br from-purple-600 to-indigo-600",
    btnClass: "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-200 dark:shadow-purple-900/50",
    btnText: "프리미엄 시작하기",
    btnHref: "/signup",
    features: [
      { text: "AI 문제 분석 무제한", included: true },
      { text: "수능 기출 뷰어", included: true },
      { text: "학습 히스토리 무제한 보관", included: true },
      { text: "PDF 내보내기", included: true },
      { text: "유사 문제 생성 무제한", included: true },
      { text: "학습 히스토리 무제한 보관", included: true },
      { text: "Notion 내보내기 연동", included: true },
      { text: "AI 약점 분석 리포트", included: true },
      { text: "AI 대화형 튜터", included: true },
    ],
  },
];

const faqs = [
  {
    q: "무료 플랜에서 유료로 업그레이드하면 기존 데이터는 유지되나요?",
    a: "네, 업그레이드 후에도 기존에 풀었던 문제와 히스토리가 모두 유지됩니다.",
  },
  {
    q: "언제든지 구독을 취소할 수 있나요?",
    a: "네, 언제든지 취소할 수 있습니다. 취소 후에도 남은 구독 기간 동안은 유료 기능을 계속 사용할 수 있습니다.",
  },
  {
    q: "Notion 연동은 어떻게 사용하나요?",
    a: "프리미엄 플랜 가입 후 마이페이지에서 Notion 계정을 연결하면, 풀었던 문제를 클릭 한 번으로 Notion 오답노트에 내보낼 수 있습니다.",
  },
  {
    q: "AI 대화형 튜터는 어떤 기능인가요?",
    a: "문제를 풀다 막혔을 때 AI 튜터에게 질문하면 단계별로 힌트를 제공하고, 관련 개념을 대화 형식으로 설명해줍니다. (출시 예정)",
  },
  {
    q: "월 단위 결제 외에 연간 결제도 가능한가요?",
    a: "연간 결제 플랜은 준비 중입니다. 출시 시 20% 할인 혜택이 제공될 예정입니다.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Navigation />

      <main>
        {/* ── Hero ── */}
        <section className="bg-gradient-to-b from-blue-50 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 pt-20 pb-16 text-center">
          <div className="max-w-3xl mx-auto px-4">
            <span className="inline-block bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-sm font-semibold px-3 py-1 rounded-full mb-5">
              요금제
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight tracking-tight">
              나에게 맞는 플랜을 선택하세요
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              무료로 시작하고, 준비가 됐을 때 업그레이드하세요.
              <br className="hidden sm:block" />
              언제든지 취소 가능합니다.
            </p>
          </div>
        </section>

        {/* ── 플랜 카드 ── */}
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border-2 overflow-hidden shadow-md ${
                  plan.id === "standard"
                    ? "shadow-blue-100 dark:shadow-blue-900/30 scale-[1.02]"
                    : plan.id === "premium"
                    ? "shadow-purple-100 dark:shadow-purple-900/30"
                    : ""
                } ${plan.color} bg-white dark:bg-gray-800`}
              >
                {/* 배지 */}
                {plan.badge && (
                  <div className={`absolute top-4 right-4 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full text-white ${
                    plan.id === "standard" ? "bg-blue-500" : "bg-purple-500"
                  }`}>
                    {plan.id === "standard" ? <Star className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                    {plan.badge}
                  </div>
                )}

                {/* 헤더 */}
                <div className={`px-6 pt-8 pb-6 ${plan.id !== "free" ? plan.headerBg : ""}`}>
                  <h2 className={`text-xl font-bold mb-1 ${plan.id !== "free" ? "text-white" : "text-gray-900 dark:text-white"}`}>
                    {plan.name}
                  </h2>
                  <p className={`text-sm mb-5 leading-relaxed ${
                    plan.id !== "free" ? "text-white/80" : "text-gray-500 dark:text-gray-400"
                  }`}>
                    {plan.description}
                  </p>
                  <div className="flex items-end gap-1">
                    <span className={`text-4xl font-extrabold ${plan.id !== "free" ? "text-white" : "text-gray-900 dark:text-white"}`}>
                      ₩{plan.price}
                    </span>
                    <span className={`text-sm pb-1 ${plan.id !== "free" ? "text-white/70" : "text-gray-500 dark:text-gray-400"}`}>
                      {plan.period}
                    </span>
                  </div>
                </div>

                {/* 기능 목록 */}
                <div className="px-6 py-6 flex-1">
                  <ul className="space-y-3">
                    {plan.features.map((f) => (
                      <li key={f.text} className="flex items-center gap-3">
                        {f.included ? (
                          <Check className={`w-4 h-4 shrink-0 ${
                            plan.id === "premium" ? "text-purple-500" :
                            plan.id === "standard" ? "text-blue-500" :
                            "text-green-500"
                          }`} />
                        ) : (
                          <X className="w-4 h-4 shrink-0 text-gray-300 dark:text-gray-600" />
                        )}
                        <span className={`text-sm ${
                          f.included
                            ? "text-gray-700 dark:text-gray-200"
                            : "text-gray-400 dark:text-gray-500"
                        }`}>
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA 버튼 */}
                <div className="px-6 pb-7">
                  <Link href={plan.btnHref}>
                    <button className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${plan.btnClass}`}>
                      {plan.btnText}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* 부가 설명 */}
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-6">
            * VAT 별도 · 카드/계좌이체 결제 지원 · 언제든 해지 가능
          </p>
        </section>

        {/* ── 기능 비교 테이블 ── */}
        <section className="bg-gray-50 dark:bg-gray-800 py-20">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-10">
              <span className="inline-block bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-xs font-bold px-3 py-1 rounded-full mb-4">
                플랜 비교
              </span>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">상세 기능 비교</h2>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left px-6 py-4 text-gray-500 dark:text-gray-400 font-medium w-1/2">기능</th>
                    <th className="px-4 py-4 text-center text-gray-700 dark:text-gray-300 font-semibold">무료</th>
                    <th className="px-4 py-4 text-center text-blue-600 dark:text-blue-400 font-bold">스탠다드</th>
                    <th className="px-4 py-4 text-center text-purple-600 dark:text-purple-400 font-bold">프리미엄</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "AI 문제 분석", free: "10회/월", std: "무제한", prem: "무제한" },
                    { feature: "수능 기출 뷰어", free: true, std: true, prem: true },
                    { feature: "학습 히스토리 보관", free: "30일", std: "무제한", prem: "무제한" },
                    { feature: "유사 문제 자동 생성", free: false, std: true, prem: true },
                    { feature: "PDF 내보내기", free: true, std: true, prem: true },
                    { feature: "Notion 내보내기", free: false, std: false, prem: true },
                    { feature: "AI 약점 분석 리포트", free: false, std: false, prem: true },
                    { feature: "AI 대화형 튜터", free: false, std: false, prem: "출시 예정" },
                    { feature: "우선 고객 지원", free: false, std: false, prem: true },
                  ].map(({ feature, free, std, prem }, i) => (
                    <tr
                      key={feature}
                      className={`border-b border-gray-100 dark:border-gray-800 last:border-0 ${
                        i % 2 === 0 ? "" : "bg-gray-50/50 dark:bg-gray-800/30"
                      }`}
                    >
                      <td className="px-6 py-3.5 text-gray-700 dark:text-gray-300 font-medium">{feature}</td>
                      <td className="px-4 py-3.5 text-center text-gray-500 dark:text-gray-400">
                        <CellValue value={free} color="gray" />
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <CellValue value={std} color="blue" />
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <CellValue value={prem} color="purple" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── 왜 셀프스터디 AI인가 ── */}
        <section className="bg-white dark:bg-gray-900 py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="inline-block bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-xs font-bold px-3 py-1 rounded-full mb-4">
              왜 선택해야 할까요
            </span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-12">
              수능 AI 학습의 새로운 기준
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  icon: "🤖",
                  title: "Gemini Vision AI",
                  desc: "Google 최신 멀티모달 AI로 수식·그래프·표까지 정확하게 분석",
                },
                {
                  icon: "⚡",
                  title: "즉시 해설 제공",
                  desc: "이미지 업로드 후 수초 내 상세 해설과 유사문제 제공",
                },
                {
                  icon: "📓",
                  title: "스마트 오답노트",
                  desc: "Notion 연동으로 AI가 정리한 오답노트를 자동으로 관리",
                },
              ].map(({ icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 text-left"
                >
                  <div className="text-3xl mb-4">{icon}</div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="bg-blue-50 dark:bg-gray-800 py-20">
          <div className="max-w-2xl mx-auto px-4">
            <div className="text-center mb-10">
              <span className="inline-block bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-xs font-bold px-3 py-1 rounded-full mb-4">
                FAQ
              </span>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">자주 묻는 질문</h2>
            </div>
            <div className="space-y-3">
              {faqs.map(({ q, a }) => (
                <details
                  key={q}
                  className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-medium text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 select-none list-none">
                    <span className="pr-4">{q}</span>
                    <span className="text-gray-400 group-open:rotate-180 transition-transform shrink-0 text-lg">▾</span>
                  </summary>
                  <div className="px-5 pb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-700 pt-3">
                    {a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="bg-blue-600 dark:bg-blue-700 py-20">
          <div className="max-w-2xl mx-auto px-4 text-center text-white">
            <Zap className="w-10 h-10 mx-auto mb-4 text-blue-200" />
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              지금 무료로 시작해보세요
            </h2>
            <p className="text-blue-100 text-lg mb-8">
              신용카드 없이, 언제든 취소 가능. 수능 AI 도우미를 무료로 경험하세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-bold text-blue-600 bg-white rounded-full hover:bg-blue-50 shadow-xl transition-colors"
              >
                무료로 시작하기
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/solve"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-bold text-white border-2 border-white/40 rounded-full hover:bg-white/10 transition-colors"
              >
                먼저 체험해보기
              </Link>
            </div>
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
    </div>
  );
}

function CellValue({ value, color }: { value: boolean | string; color: "gray" | "blue" | "purple" }) {
  const checkColor =
    color === "purple" ? "text-purple-500" :
    color === "blue" ? "text-blue-500" :
    "text-green-500";

  if (value === true) {
    return <Check className={`w-4 h-4 ${checkColor} mx-auto`} />;
  }
  if (value === false) {
    return <X className="w-4 h-4 text-gray-300 dark:text-gray-600 mx-auto" />;
  }
  return (
    <span className={`text-xs font-medium ${
      color === "purple" ? "text-purple-600 dark:text-purple-400" :
      color === "blue" ? "text-blue-600 dark:text-blue-400" :
      "text-gray-500 dark:text-gray-400"
    }`}>
      {value}
    </span>
  );
}
