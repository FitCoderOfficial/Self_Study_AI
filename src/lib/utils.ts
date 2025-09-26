import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 문제 텍스트 파싱 유틸리티
export interface ParsedProblem {
  number: string | null;
  score: string | null;
  content: string;
  formattedContent: string;
}

export function parseProblemText(text: string): ParsedProblem {
  const cleanText = text.replace(/<[^>]*>/g, '').trim(); // HTML 태그 제거
  
  // 문제 번호 추출 패턴 (우선순위순)
  const numberPatterns = [
    /^(\d+)\.\s*/,           // "30. "
    /^(\d+)\)\s*/,           // "1) "
    /^\[(\d+)\]\s*/,         // "[1] "
    /^문제\s*(\d+)\s*[:.]/,  // "문제 1:" 또는 "문제 1."
    /^Q\s*(\d+)\s*[:.]/i,    // "Q1:" 또는 "q1."
    /^(\d+)번\s*/,           // "1번 "
  ] as const;
  
  let problemNumber: string | null = null;
  let remainingText = cleanText;
  
  for (const pattern of numberPatterns) {
    const match = remainingText.match(pattern);
    if (match) {
      problemNumber = match[1];
      remainingText = remainingText.replace(pattern, '').trim();
      break;
    }
  }
  
  // 배점 추출 패턴 (우선순위순)
  const scorePatterns = [
    /\[(\d+)점?\]/gi,         // "[4점]" 또는 "[4]"
    /\((\d+)점?\)/gi,         // "(4점)" 또는 "(4)"
    /\【(\d+)점?\】/gi,       // "【4점】" (전각 괄호)
    /（(\d+)점?）/gi,         // "（4점）" (전각 괄호)
    /(\d+)점(?!\w)/gi,        // "4점"
    /\[(\d+)\s*pt\]/gi,       // "[4pt]"
    /\((\d+)\s*pt\)/gi,       // "(4pt)"
    /(\d+)\s*점/gi,           // "3 점" 또는 "3점"
    /\b(\d+)\s*pt\b/gi,       // "4 pt" 또는 "4pt"
  ] as const;
  
  let problemScore: string | null = null;
  
  // 배점 추출 (원본 텍스트 전체에서 검색)
  for (const pattern of scorePatterns) {
    const match = text.match(pattern);
    if (match) {
      problemScore = match[1] + '점';
      remainingText = remainingText.replace(new RegExp(pattern.source, 'gi'), '').trim();
      break;
    }
  }
  
  // 추가 배점 검색 (문제 번호 기반)
  if (!problemScore && problemNumber) {
    const patternAfterNumber = new RegExp(`${problemNumber}\\..*?\\[(\\d+)점?\\]`, 'i');
    const match = text.match(patternAfterNumber);
    if (match) {
      problemScore = match[1] + '점';
      remainingText = remainingText.replace(/\[(\d+)점?\]/gi, '').trim();
    }
  }
  
  // 문제 내용 포맷팅
  const formattedContent = formatProblemContent(remainingText);
  
  return {
    number: problemNumber,
    score: problemScore,
    content: remainingText,
    formattedContent
  };
}

// 문제 내용 포맷팅 함수 분리
function formatProblemContent(text: string): string {
  return text
    // LaTeX 수식 임시 보호
    .replace(/\$\$([^$]+)\$\$/g, '<<<BLOCK_MATH_$1>>>')
    .replace(/\$([^$]+)\$/g, '<<<INLINE_MATH_$1>>>')
    // 수식 및 특수 기호 보호
    .replace(/([A-Z])(\d+)/g, '<<<VAR_$1$2>>>')  // C1, O1 등
    .replace(/([가-힣]{2,})\s*\(/g, '<<<FUNC_$1>>>(')  // 함수명
    // 마침표 뒤 줄바꿈 (더 포괄적으로)
    .replace(/\.\s+/g, '.\n')  // 모든 마침표 뒤 줄바꿈
    // 연속된 줄바꿈을 하나로 정리
    .replace(/\n\s*\n+/g, '\n')
    // 보호된 요소들 복원
    .replace(/<<<VAR_([A-Z]\d+)>>>/g, '$1')
    .replace(/<<<FUNC_([가-힣]{2,})>>>/g, '$1')
    // 수식 복원
    .replace(/<<<BLOCK_MATH_([^>]+)>>>/g, '$$$$1$$')
    .replace(/<<<INLINE_MATH_([^>]+)>>>/g, '$$$1$$')
    // 공백 정리
    .replace(/\s+/g, ' ')
    .replace(/^\s*\n|\n\s*$/g, '')  // 시작/끝 빈 줄 제거
    .trim();
}

export class StorageManager {
  private static readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly STORAGE_WARNING_THRESHOLD = 0.8; // 80%
  private static readonly STORAGE_KEYS = {
    PROCESSED_RESULT: 'processedResult_',
    PROCESSED_RESULTS: 'processedResults',
    ARCHIVED_QUESTIONS: 'archivedQuestions'
  } as const;

  // 현재 스토리지 사용량 확인 (최적화)
  static getStorageUsage(): { used: number; percentage: number } {
    try {
      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
          }
        }
      }
      
      return {
        used: totalSize,
        percentage: (totalSize / this.MAX_STORAGE_SIZE) * 100
      };
    } catch (error) {
      console.error('스토리지 사용량 확인 오류:', error);
      return { used: 0, percentage: 0 };
    }
  }

  // 스토리지 정리가 필요한지 확인
  static needsCleanup(): boolean {
    const usage = this.getStorageUsage();
    return usage.percentage > this.STORAGE_WARNING_THRESHOLD * 100;
  }

  // 안전한 스토리지 저장
  static safeSetItem(key: string, value: string): boolean {
    try {
      // 저장 전 공간 확인
      const currentUsage = this.getStorageUsage();
      const valueSize = value.length;
      
      if ((currentUsage.used + valueSize) > this.MAX_STORAGE_SIZE) {
        console.warn('스토리지 용량 부족, 정리 실행');
        this.cleanupOldData();
      }
      
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('스토리지 저장 실패:', error);
      
      // 한 번 더 정리 시도
      try {
        this.forceCleanup();
        localStorage.setItem(key, value);
        return true;
      } catch (secondError) {
        console.error('정리 후에도 저장 실패:', secondError);
        return false;
      }
    }
  }

  // 일반적인 정리 (오래된 데이터 제거)
  static cleanupOldData(): void {
    try {
      // processedResult 항목들 정리
      const processedResultKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('processedResult_')) {
          processedResultKeys.push(key);
        }
      }

      if (processedResultKeys.length > 5) {
        const keysWithTime = processedResultKeys.map(key => {
          const data = localStorage.getItem(key);
          try {
            const parsed = data ? JSON.parse(data) : {};
            return {
              key,
              timestamp: parsed.timestamp ? new Date(parsed.timestamp).getTime() : 0
            };
          } catch {
            return { key, timestamp: 0 };
          }
        });

        keysWithTime.sort((a, b) => b.timestamp - a.timestamp);
        
        // 최신 5개만 유지
        for (let i = 5; i < keysWithTime.length; i++) {
          localStorage.removeItem(keysWithTime[i].key);
        }
      }

      // processedResults 목록도 업데이트
      try {
        const existingResults = JSON.parse(localStorage.getItem('processedResults') || '[]');
        if (existingResults.length > 5) {
          const limitedResults = existingResults.slice(0, 5);
          localStorage.setItem('processedResults', JSON.stringify(limitedResults));
        }
      } catch (error) {
        console.error('processedResults 정리 오류:', error);
      }

      // 아카이브도 제한
      try {
        const archivedQuestions = JSON.parse(localStorage.getItem('archivedQuestions') || '[]');
        if (archivedQuestions.length > 30) {
          const limitedArchive = archivedQuestions.slice(0, 30);
          localStorage.setItem('archivedQuestions', JSON.stringify(limitedArchive));
        }
      } catch (error) {
        console.error('아카이브 정리 오류:', error);
      }

    } catch (error) {
      console.error('스토리지 정리 중 오류:', error);
    }
  }

  // 강제 정리 (더 많은 데이터 제거)
  static forceCleanup(): void {
    try {
      // 더 적은 수만 유지
      const processedResultKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('processedResult_')) {
          processedResultKeys.push(key);
        }
      }

      // 최신 2개만 유지
      if (processedResultKeys.length > 2) {
        const keysWithTime = processedResultKeys.map(key => {
          const data = localStorage.getItem(key);
          try {
            const parsed = data ? JSON.parse(data) : {};
            return {
              key,
              timestamp: parsed.timestamp ? new Date(parsed.timestamp).getTime() : 0
            };
          } catch {
            return { key, timestamp: 0 };
          }
        });

        keysWithTime.sort((a, b) => b.timestamp - a.timestamp);
        
        for (let i = 2; i < keysWithTime.length; i++) {
          localStorage.removeItem(keysWithTime[i].key);
        }
      }

      // 아카이브도 대폭 줄이기
      try {
        const archivedQuestions = JSON.parse(localStorage.getItem('archivedQuestions') || '[]');
        if (archivedQuestions.length > 10) {
          const limitedArchive = archivedQuestions.slice(0, 10);
          localStorage.setItem('archivedQuestions', JSON.stringify(limitedArchive));
        }
      } catch (error) {
        console.error('아카이브 강제 정리 오류:', error);
      }

      console.log('강제 스토리지 정리 완료');
    } catch (error) {
      console.error('강제 정리 중 오류:', error);
    }
  }

  // 스토리지 상태 리포트
  static getStorageReport(): {
    usage: { used: number; percentage: number };
    processedResults: number;
    archivedQuestions: number;
    needsCleanup: boolean;
  } {
    const usage = this.getStorageUsage();
    
    let processedResults = 0;
    let archivedQuestions = 0;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('processedResult_')) {
          processedResults++;
        }
      }
      
      const archived = JSON.parse(localStorage.getItem('archivedQuestions') || '[]');
      archivedQuestions = archived.length;
    } catch (error) {
      console.error('스토리지 리포트 생성 오류:', error);
    }

    return {
      usage,
      processedResults,
      archivedQuestions,
      needsCleanup: this.needsCleanup()
    };
  }
}
