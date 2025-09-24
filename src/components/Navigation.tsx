"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, Camera, BookOpen, User, LogOut, Calculator } from "lucide-react";
interface NavigationProps {
  isLoggedIn?: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
}

export function Navigation({ isLoggedIn = false, onLogin, onLogout }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">셀프스터디 AI</span>
            </Link>
          </div>

          {/* 데스크톱 네비게이션 */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/solve"
              className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors flex items-center space-x-1"
            >
              <Camera className="w-4 h-4" />
              <span>문제 풀이</span>
            </Link>
            <Link
              href="/archive"
              className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors flex items-center space-x-1"
            >
              <BookOpen className="w-4 h-4" />
              <span>질문 아카이브</span>
            </Link>
            <Link
              href="/math-processor"
              className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors flex items-center space-x-1"
            >
              <Calculator className="w-4 h-4" />
              <span>수학 이미지 처리</span>
            </Link>
            <div className="flex items-center space-x-2">
              {isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder-avatar.jpg" alt="사용자" />
                        <AvatarFallback>김민준</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">김민준</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          kimminjun@example.com
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>마이페이지</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onLogout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>로그아웃</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={onLogin} variant="default" className="px-6 py-2 rounded-full shadow-sm hover:shadow-md transition-all duration-300">
                  로그인
                </Button>
              )}
            </div>
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              <Link
                href="/solve"
                className="text-gray-700 hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                문제 풀이
              </Link>
              <Link
                href="/archive"
                className="text-gray-700 hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                질문 아카이브
              </Link>
              <Link
                href="/math-processor"
                className="text-gray-700 hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                수학 이미지 처리
              </Link>
              {isLoggedIn ? (
                <div className="pt-4 pb-3 border-t">
                  <div className="flex items-center px-3">
                    <div className="flex-shrink-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder-avatar.jpg" alt="사용자" />
                        <AvatarFallback>김민준</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-800">김민준</div>
                      <div className="text-sm text-gray-500">kimminjun@example.com</div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <Link
                      href="/profile"
                      className="text-gray-700 hover:text-primary block px-3 py-2 rounded-md text-base font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      마이페이지
                    </Link>
                    <button
                      onClick={() => {
                        onLogout?.();
                        setIsMobileMenuOpen(false);
                      }}
                      className="text-red-600 hover:text-red-800 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
                    >
                      로그아웃
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-4 pb-3 border-t space-y-2">
                  <Button onClick={onLogin} className="w-full py-3 px-6 rounded-full shadow-sm hover:shadow-md transition-all duration-300">
                    로그인
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navigation;
