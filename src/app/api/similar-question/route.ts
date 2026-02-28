import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface SimilarQuestion {
  problem: string;
  choices: string[];
  answer: number;         // 1~5 (정답 번호)
  solution: string;
  keyConcepts: string[];
  wrongAnswerExplanation: string;
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Gemini API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const { problemText, subject } = await request.json();

    if (!problemText) {
      return NextResponse.json({ success: false, error: '문제 텍스트가 없습니다.' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 2500,
      },
    });

    const prompt = `당신은 한국 수능 문제 출제 전문가입니다.

[원본 문제]
${problemText}

[지시사항]
위 수능 ${subject || ''} 문제와 같은 개념을 다루지만, 수치·조건·상황을 변형한 새로운 문제를 만들어주세요.

요구사항:
- 동일한 핵심 개념과 풀이 방법을 사용하되 구체적인 수치/조건 변경
- 수능 5지선다형 형식 유지
- 수식은 LaTeX 형식($수식$, $$수식$$)으로 표현
- choices는 반드시 정확히 5개 (① ~ ⑤ 기호 포함)
- answer는 정답 번호 (1~5 정수)
- solution은 **1단계**, **2단계** 형식으로 단계별 풀이
- keyConcepts는 이 문제에서 사용된 핵심 개념/공식 (2~4개)
- wrongAnswerExplanation은 오답을 선택하게 되는 함정과 이유 설명

아래 JSON 형식으로만 응답하세요:
{
  "problem": "문제 텍스트 (조건, 지문 포함, LaTeX 수식 적용)",
  "choices": ["① 선택지1", "② 선택지2", "③ 선택지3", "④ 선택지4", "⑤ 선택지5"],
  "answer": 3,
  "solution": "단계별 풀이 (LaTeX 수식 적용)",
  "keyConcepts": ["핵심 개념1", "핵심 개념2"],
  "wrongAnswerExplanation": "오답 함정 설명"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text) as SimilarQuestion;

    // 유효성 검사
    if (!parsed.problem || !Array.isArray(parsed.choices) || parsed.choices.length !== 5) {
      throw new Error('유사 문제 형식이 올바르지 않습니다.');
    }

    return NextResponse.json({ success: true, similarQuestion: parsed });
  } catch (error) {
    console.error('유사 문제 생성 오류:', error);
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json(
      { success: false, error: `유사 문제 생성 중 오류가 발생했습니다: ${message}` },
      { status: 500 }
    );
  }
}
