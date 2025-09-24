"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Volume2, 
  VolumeX, 
  Eye, 
  EyeOff, 
  Type, 
  Contrast,
  Settings,
  Moon,
  Sun
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface AccessibilityFeaturesProps {
  onFontSizeChange?: (size: number) => void;
  onContrastChange?: (high: boolean) => void;
  onScreenReaderToggle?: (enabled: boolean) => void;
}

export default function AccessibilityFeatures({
  onFontSizeChange,
  onContrastChange,
  onScreenReaderToggle
}: AccessibilityFeaturesProps) {
  const { theme, toggleTheme } = useTheme();
  const [fontSize, setFontSize] = useState(16);
  const [highContrast, setHighContrast] = useState(false);
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 폰트 크기 변경 적용
    document.documentElement.style.fontSize = `${fontSize}px`;
    onFontSizeChange?.(fontSize);
  }, [fontSize, onFontSizeChange]);

  useEffect(() => {
    // 고대비 모드 적용
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    onContrastChange?.(highContrast);
  }, [highContrast, onContrastChange]);

  useEffect(() => {
    // 스크린 리더 모드 적용
    if (screenReaderEnabled) {
      document.body.classList.add('screen-reader-mode');
    } else {
      document.body.classList.remove('screen-reader-mode');
    }
    onScreenReaderToggle?.(screenReaderEnabled);
  }, [screenReaderEnabled, onScreenReaderToggle]);

  return (
    <>
      {/* 접근성 설정 버튼 */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="lg"
        className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700 shadow-lg hover:shadow-xl py-4 px-6 rounded-full transition-all duration-300"
        aria-label="접근성 설정 열기"
      >
        <Settings className="w-5 h-5 mr-3" />
        접근성
      </Button>

      {/* 접근성 설정 패널 */}
      {isOpen && (
        <Card className="fixed bottom-20 right-4 w-80 sm:w-96 max-w-[calc(100vw-2rem)] z-50 shadow-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-gray-900/50">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
              <Settings className="w-5 h-5 mr-2" />
              접근성 설정
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              청각장애 학생들을 위한 접근성 옵션입니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 폰트 크기 조절 */}
            <div>
              <label className="flex items-center mb-2">
                <Type className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">폰트 크기</span>
              </label>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                  className="px-3 py-2 rounded-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-all duration-300"
                  aria-label="폰트 크기 줄이기"
                >
                  A-
                </Button>
                <span className="text-sm w-12 text-center text-gray-900 dark:text-gray-100">{fontSize}px</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                  className="px-3 py-2 rounded-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-all duration-300"
                  aria-label="폰트 크기 늘리기"
                >
                  A+
                </Button>
              </div>
            </div>

            {/* 다크모드 토글 */}
            <div>
              <label className="flex items-center mb-2">
                {theme === "dark" ? (
                  <Moon className="w-4 h-4 mr-2" />
                ) : (
                  <Sun className="w-4 h-4 mr-2" />
                )}
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">다크모드</span>
              </label>
              <Button
                size="sm"
                variant="outline"
                onClick={toggleTheme}
                className="w-full py-3 px-4 rounded-full border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 shadow-sm hover:shadow-md transition-all duration-300"
                aria-label={theme === "dark" ? "라이트모드로 전환" : "다크모드로 전환"}
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="w-4 h-4 mr-3" />
                    라이트모드로 전환
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 mr-3" />
                    다크모드로 전환
                  </>
                )}
              </Button>
            </div>

            {/* 고대비 모드 */}
            <div>
              <label className="flex items-center mb-2">
                <Contrast className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">고대비 모드</span>
              </label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setHighContrast(!highContrast)}
                className={`w-full py-3 px-4 rounded-full border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-300 ${
                  highContrast 
                    ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600" 
                    : "text-gray-900 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                }`}
                aria-label={highContrast ? "고대비 모드 끄기" : "고대비 모드 켜기"}
              >
                {highContrast ? "고대비 모드 켜짐" : "고대비 모드 끄기"}
              </Button>
            </div>

            {/* 스크린 리더 모드 */}
            <div>
              <label className="flex items-center mb-2">
                {screenReaderEnabled ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">스크린 리더 모드</span>
              </label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setScreenReaderEnabled(!screenReaderEnabled)}
                className={`w-full py-3 px-4 rounded-full border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-300 ${
                  screenReaderEnabled 
                    ? "bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600" 
                    : "text-gray-900 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                }`}
                aria-label={screenReaderEnabled ? "스크린 리더 모드 끄기" : "스크린 리더 모드 켜기"}
              >
                {screenReaderEnabled ? "스크린 리더 모드 켜짐" : "스크린 리더 모드 끄기"}
              </Button>
            </div>

            {/* 도움말 */}
            <div className="pt-2 border-t dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                💡 이 설정들은 페이지를 새로고침해도 유지됩니다.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
