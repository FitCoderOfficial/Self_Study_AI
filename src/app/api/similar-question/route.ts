import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { problemText, subject } = await request.json();

    if (!problemText) {
      return NextResponse.json({ success: false, error: '문제 텍스트가 없습니다.' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ success: false, error: 'OpenAI API가 설정되지 않았습니다.' }, { status: 500 });
    }

    const prompt = `당신은 한국 수능 문제 출제 전문가입니다.

[원본 문제]
${problemText}

[지시사항]
위 수능 ${subject || ''} 문제와 유사하지만 수치나 조건을 변형한 새로운 문제를 만들어주세요.

요구사항:
1. 동일한 개념과 풀이 방법을 사용하되, 숫자나 조건을 변경하세요
2. 수능 문제 형식(선택지 5개)을 유지하세요
3. 수식은 LaTeX 형식($...$)으로 표현하세요
4. 문제 다음에 단계별 풀이와 정답을 포함하세요

[응답 형식]
문제:
(문제 내용)

①~⑤ (선택지)

풀이:
(단계별 풀이 과정)

정답: (번호)`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const similarProblem = response.choices[0].message.content || '';

    return NextResponse.json({ success: true, similarProblem });

  } catch (error) {
    console.error('유사 문제 생성 오류:', error);
    return NextResponse.json({ success: false, error: '유사 문제 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
