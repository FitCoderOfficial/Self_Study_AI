"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, RotateCcw, Download, BookOpen } from "lucide-react";
import { SimilarProblem } from "@/api/mockData";

interface SimilarProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  similarProblem: SimilarProblem | null;
  isLoading: boolean;
  onRetry: () => void;
  onSaveToArchive: () => void;
  onAddToWrongAnswers: () => void;
}

export default function SimilarProblemModal({
  isOpen,
  onClose,
  similarProblem,
  isLoading,
  onRetry,
  onSaveToArchive,
  onAddToWrongAnswers
}: SimilarProblemModalProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleAnswerSelect = (answer: string) => {
    if (showAnswer) return; // 답을 이미 확인한 경우 선택 불가
    setSelectedAnswer(answer);
  };

  const handleCheckAnswer = () => {
    if (!selectedAnswer || !similarProblem) return;
    
    const correct = selectedAnswer === similarProblem.newProblem.answer;
    setIsCorrect(correct);
    setShowAnswer(true);
  };

  const handleRetry = () => {
    setSelectedAnswer(null);
    setShowAnswer(false);
    setIsCorrect(null);
    onRetry();
  };

  const handleClose = () => {
    setSelectedAnswer(null);
    setShowAnswer(false);
    setIsCorrect(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            AI 유사 문제 생성
          </DialogTitle>
          <DialogDescription>
            현재 문제와 유사한 새로운 문제를 AI가 생성했습니다. 풀어보세요!
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-lg text-gray-600">AI가 유사 문제를 생성하고 있습니다...</p>
            <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요</p>
          </div>
        ) : similarProblem ? (
          <div className="space-y-6">
            {/* 문제 내용 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full mr-2">
                    AI 생성 문제
                  </span>
                  문제
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-lg leading-relaxed whitespace-pre-wrap">
                    {similarProblem.newProblem.content}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 객관식 보기 */}
            {similarProblem.newProblem.choices && (
              <Card>
                <CardHeader>
                  <CardTitle>보기</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {similarProblem.newProblem.choices.map((choice, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(choice)}
                        disabled={showAnswer}
                        className={`p-4 text-left border rounded-lg transition-all ${
                          selectedAnswer === choice
                            ? showAnswer
                              ? isCorrect
                                ? "border-green-500 bg-green-50 text-green-800"
                                : "border-red-500 bg-red-50 text-red-800"
                              : "border-blue-500 bg-blue-50 text-blue-800"
                            : showAnswer && choice === similarProblem.newProblem.answer
                            ? "border-green-500 bg-green-50 text-green-800"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        } ${showAnswer ? "cursor-default" : "cursor-pointer"}`}
                      >
                        <div className="flex items-center">
                          <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-sm font-medium mr-3">
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="text-lg">{choice}</span>
                          {showAnswer && choice === similarProblem.newProblem.answer && (
                            <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                          )}
                          {showAnswer && selectedAnswer === choice && !isCorrect && (
                            <XCircle className="w-5 h-5 text-red-600 ml-auto" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 답 확인 버튼 */}
            {!showAnswer && selectedAnswer && (
              <div className="flex justify-center">
                <Button onClick={handleCheckAnswer} size="lg" className="px-8">
                  답 확인하기
                </Button>
              </div>
            )}

            {/* 정답 및 해설 */}
            {showAnswer && (
              <Card>
                <CardHeader>
                  <CardTitle className={`flex items-center ${
                    isCorrect ? "text-green-600" : "text-red-600"
                  }`}>
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 mr-2" />
                    ) : (
                      <XCircle className="w-5 h-5 mr-2" />
                    )}
                    {isCorrect ? "정답입니다!" : "틀렸습니다"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={`p-4 rounded-lg ${
                    isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                  }`}>
                    <h4 className="font-semibold mb-2">정답</h4>
                    <p className="text-lg font-medium">
                      {similarProblem.newProblem.answer}
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">해설</h4>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {similarProblem.newProblem.explanation}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 액션 버튼들 */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                onClick={handleRetry}
                variant="outline"
                className="flex items-center"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                다른 문제 생성
              </Button>
              
              <Button
                onClick={onSaveToArchive}
                variant="outline"
                className="flex items-center"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                아카이브에 저장
              </Button>
              
              {!isCorrect && (
                <Button
                  onClick={onAddToWrongAnswers}
                  variant="outline"
                  className="flex items-center text-red-600 hover:text-red-700"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  오답노트에 추가
                </Button>
              )}
              
              <Button
                onClick={handleClose}
                variant="default"
                className="flex items-center"
              >
                닫기
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              문제 생성에 실패했습니다
            </h3>
            <p className="text-gray-600 mb-4">
              다시 시도해주세요.
            </p>
            <Button onClick={handleRetry} variant="outline">
              다시 시도
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

