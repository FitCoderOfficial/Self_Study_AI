// Mock Data API - 백엔드 연동 전까지 사용할 가상 데이터

// 이미지 처리 API 타입 정의
export interface ImageProcessResponse {
  success: boolean;
  data?: {
    processedText: string;
  };
  error?: string;
}


export interface QuestionItem {
  id: string;
  subject: string;
  question: string;
  answer: string;
  date: string;
  isCorrect: boolean;
  imageUrl?: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
}

export interface UserStats {
  name: string;
  email: string;
  joinDate: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  favoriteSubjects: string[];
  streak: number;
  level: number;
}

export interface SubjectStats {
  subject: string;
  total: number;
  correct: number;
  accuracy: number;
  recentTrend: "up" | "down" | "stable";
}

export interface RecentActivity {
  date: string;
  subject: string;
  question: string;
  isCorrect: boolean;
  timeSpent: number;
  difficulty: "easy" | "medium" | "hard";
}


// 질문 아카이브용 Mock 데이터
export const getMockQuestions = async (): Promise<QuestionItem[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    {
      id: "1",
      subject: "수학",
      question: "다음 이차방정식의 해를 구하시오.\n\nx² - 5x + 6 = 0",
      answer: "x = 2 또는 x = 3",
      date: "2024-01-15",
      isCorrect: true,
      imageUrl: "/placeholder-math.jpg",
      difficulty: "medium",
      tags: ["이차방정식", "인수분해"]
    },
    {
      id: "2",
      subject: "수학",
      question: "삼각함수 sin(30°)의 값을 구하시오.",
      answer: "1/2",
      date: "2024-01-14",
      isCorrect: false,
      imageUrl: "/placeholder-math.jpg",
      difficulty: "easy",
      tags: ["삼각함수", "기본값"]
    },
    {
      id: "3",
      subject: "과학",
      question: "물의 끓는점은 몇 도인가?",
      answer: "100°C (1기압에서)",
      date: "2024-01-13",
      isCorrect: true,
      imageUrl: "/placeholder-science.jpg",
      difficulty: "easy",
      tags: ["물리", "상태변화"]
    },
    {
      id: "4",
      subject: "수학",
      question: "로그 log₁₀(100)의 값을 구하시오.",
      answer: "2",
      date: "2024-01-12",
      isCorrect: true,
      imageUrl: "/placeholder-math.jpg",
      difficulty: "easy",
      tags: ["로그", "기본값"]
    },
    {
      id: "5",
      subject: "과학",
      question: "광합성의 화학반응식을 작성하시오.",
      answer: "6CO₂ + 6H₂O + 빛에너지 → C₆H₁₂O₆ + 6O₂",
      date: "2024-01-11",
      isCorrect: false,
      imageUrl: "/placeholder-science.jpg",
      difficulty: "medium",
      tags: ["생물", "광합성", "화학반응"]
    },
    {
      id: "6",
      subject: "수학",
      question: "함수 f(x) = x² - 4x + 3의 최솟값을 구하시오.",
      answer: "-1",
      date: "2024-01-10",
      isCorrect: true,
      imageUrl: "/placeholder-math.jpg",
      difficulty: "medium",
      tags: ["이차함수", "최솟값"]
    },
    {
      id: "7",
      subject: "영어",
      question: "다음 문장의 빈칸에 들어갈 적절한 단어는?\n\nI have been studying English _____ three years.",
      answer: "for",
      date: "2024-01-09",
      isCorrect: true,
      imageUrl: "/placeholder-english.jpg",
      difficulty: "easy",
      tags: ["현재완료", "전치사"]
    },
    {
      id: "8",
      subject: "국어",
      question: "다음 시의 화자의 심정을 가장 적절하게 표현한 것은?",
      answer: "그리움과 아쉬움",
      date: "2024-01-08",
      isCorrect: false,
      imageUrl: "/placeholder-korean.jpg",
      difficulty: "hard",
      tags: ["시", "화자", "심정"]
    }
  ];
};

// 사용자 통계 Mock 데이터
export const getMockUserStats = async (): Promise<UserStats> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return {
    name: "김민준",
    email: "kimminjun@example.com",
    joinDate: "2024-01-01",
    totalQuestions: 45,
    correctAnswers: 38,
    incorrectAnswers: 7,
    accuracy: 84.4,
    favoriteSubjects: ["수학", "과학"],
    streak: 12,
    level: 5
  };
};

// 과목별 통계 Mock 데이터
export const getMockSubjectStats = async (): Promise<SubjectStats[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return [
    { subject: "수학", total: 25, correct: 22, accuracy: 88.0, recentTrend: "up" },
    { subject: "과학", total: 12, correct: 9, accuracy: 75.0, recentTrend: "down" },
    { subject: "영어", total: 5, correct: 4, accuracy: 80.0, recentTrend: "stable" },
    { subject: "국어", total: 3, correct: 3, accuracy: 100.0, recentTrend: "up" },
  ];
};

// 최근 활동 Mock 데이터
export const getMockRecentActivity = async (): Promise<RecentActivity[]> => {
  await new Promise(resolve => setTimeout(resolve, 250));
  
  return [
    { date: "2024-01-15", subject: "수학", question: "이차방정식 문제", isCorrect: true, timeSpent: 120, difficulty: "medium" },
    { date: "2024-01-14", subject: "과학", question: "광합성 관련 문제", isCorrect: false, timeSpent: 180, difficulty: "hard" },
    { date: "2024-01-13", subject: "수학", question: "삼각함수 문제", isCorrect: true, timeSpent: 90, difficulty: "easy" },
    { date: "2024-01-12", subject: "영어", question: "문법 문제", isCorrect: true, timeSpent: 60, difficulty: "easy" },
    { date: "2024-01-11", subject: "수학", question: "로그 문제", isCorrect: true, timeSpent: 150, difficulty: "medium" },
    { date: "2024-01-10", subject: "국어", question: "시 분석 문제", isCorrect: false, timeSpent: 200, difficulty: "hard" },
    { date: "2024-01-09", subject: "과학", question: "화학 반응 문제", isCorrect: true, timeSpent: 110, difficulty: "medium" },
  ];
};

// 학습 목표 Mock 데이터
export const getMockLearningGoals = async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    monthlyGoal: {
      subject: "수학",
      target: 50,
      current: 25,
      progress: 50
    },
    accuracyGoal: {
      target: 90,
      current: 84.4,
      progress: 93.8
    },
    streakGoal: {
      target: 30,
      current: 12,
      progress: 40
    }
  };
};

// Mathpix API를 사용한 실제 이미지 처리 함수
export const processImageWithMathpix = async (imageFile: File): Promise<ImageProcessResponse> => {
  console.log("Mathpix API 호출 시작:", imageFile.name);

  try {
    const formData = new FormData();
    formData.append('file', imageFile);

    const response = await fetch('/api/mathpix', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error("Mathpix API 호출 실패:", result);
      return {
        success: false,
        error: result.error || '이미지 처리에 실패했습니다.'
      };
    }

    console.log("Mathpix API 호출 성공:", result);
    return result;

  } catch (error) {
    console.error("Mathpix API 네트워크 오류:", error);
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다. 다시 시도해주세요.'
    };
  }
};

// 이미지 처리 Mock API - 개발/테스트용 (backward compatibility)
export const processImageMock = async (imageFile: File): Promise<ImageProcessResponse> => {
  console.log("가상 API 호출 시작:", imageFile.name);

  // 실제 네트워크 요청을 시뮬레이션하기 위해 2초간 대기
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 성공 시 반환할 가상 데이터
  const mockSuccessData: ImageProcessResponse = {
    success: true,
    data: {
      processedText: "이차방정식 $$x^2 - 5x + 6 = 0$$의 두 근을 \\(\\alpha, \\beta\\)라고 할 때, 다음 식의 값을 구하시오. $$\\frac{1}{\\alpha} + \\frac{1}{\\beta}$$"
    }
  };

  // 실패 시 반환할 가상 데이터
  const mockErrorData: ImageProcessResponse = {
    success: false,
    error: "이미지 인식에 실패했습니다. 더 선명한 이미지를 업로드해 주세요."
  };

  // 테스트를 위해 파일 이름에 'error'가 포함되면 일부러 실패 응답을 보냄
  if (imageFile.name.toLowerCase().includes('error')) {
    console.log("가상 API 호출 실패 응답 반환");
    return mockErrorData;
  } else {
    console.log("가상 API 호출 성공 응답 반환");
    return mockSuccessData;
  }
};

