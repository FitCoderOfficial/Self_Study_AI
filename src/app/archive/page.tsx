"use client";

import { useEffect, useMemo, useState } from "react";
import Navigation from "@/components/Navigation";
import AccessibilityFeatures from "@/components/AccessibilityFeatures";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getMockQuestions, QuestionItem } from "@/api/mockData";
import { BookOpen, CheckCircle, XCircle, Filter, Archive, Download } from "lucide-react";

export default function ArchivePage() {
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header />
        <ArchiveContent />
      </main>

      <AccessibilityFeatures />
    </div>
  );
}

function Header() {
  return (
    <div className="text-center mb-12">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">질문 아카이브</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300">과거에 질문했던 문제들을 과목별, 날짜별로 정리하여 관리할 수 있습니다</p>
    </div>
  );
}

function ArchiveContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<QuestionItem[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("모든 과목");
  const [selectedSort, setSelectedSort] = useState("모든 상태");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getMockQuestions();
        if (mounted) setItems(data);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (selectedSubject !== "모든 과목" && it.subject !== selectedSubject) return false;
      if (selectedSort === "정답만" && !it.isCorrect) return false;
      if (selectedSort === "오답만" && it.isCorrect) return false;
      if (!q) return true;
      return (
        it.subject.toLowerCase().includes(q) ||
        it.question.toLowerCase().includes(q) ||
        it.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [items, query, selectedSubject, selectedSort]);

  const correctCount = items.filter(q => q.isCorrect).length;
  const incorrectCount = items.filter(q => !q.isCorrect).length;
  const totalCount = items.length;

  return (
    <div className="space-y-8">
      {/* 상단 통계 카드들 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center shadow-lg">
          <div className="flex items-center justify-center mb-2">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{totalCount}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">총 질문 수</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center shadow-lg">
          <div className="flex items-center justify-center mb-2">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">{correctCount}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">정답 문제</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center shadow-lg">
          <div className="flex items-center justify-center mb-2">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">{incorrectCount}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">오답 문제</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center shadow-lg">
          <div className="flex items-center justify-center mb-2">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <Archive className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">{totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0}%</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">정답률</div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-lg">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">검색 및 필터</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">질문을 쉽으로로 검색할 수 있도록 필터링해보세요</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Input 
              placeholder="문제, 내용, 답안 등으로 검색..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>
          <div>
            <select 
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md px-3 py-2"
            >
              <option>모든 과목</option>
              <option>수학</option>
              <option>과학</option>
              <option>영어</option>
              <option>국어</option>
            </select>
          </div>
          <div>
            <select 
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md px-3 py-2"
            >
              <option>모든 상태</option>
              <option>정답만</option>
              <option>오답만</option>
            </select>
          </div>
        </div>
      </div>

      {/* 질문 목록 */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">조건에 맞는 항목이 없습니다.</div>
        ) : (
          filtered.map((question) => (
            <div key={question.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">{question.subject}</span>
                  <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded">{question.difficulty}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">{question.date}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`flex items-center text-sm font-medium ${question.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {question.isCorrect ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        정답
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-1" />
                        오답
                      </>
                    )}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">오답노트 아이템</span>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-gray-900 dark:text-gray-200 whitespace-pre-wrap text-lg leading-relaxed">
                  {question.question}
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <div className="text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">정답</span>
                </div>
                <div className="text-green-600 dark:text-green-400 font-medium mt-1">
                  {question.answer}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {question.tags.map((tag) => (
                    <span key={tag} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Archive className="w-4 h-4 mr-1" />
                    차례대로 넣기
                  </Button>
                  <Button variant="outline" size="sm" className="text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Download className="w-4 h-4 mr-1" />
                    다운로드
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <XCircle className="w-4 h-4 mr-1" />
                    삭제
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


