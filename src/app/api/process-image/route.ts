import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 무료 티어 할당량 고려 — 순서대로 시도
const GEMINI_MODELS = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-2.0-flash-lite'];

const SUBJECT_HINTS: Record<string, string> = {
  수학: '수능 수학 문제입니다. 수식과 기호를 정확하게 인식하세요.',
  영어: '수능 영어 문제입니다. 지문, 빈칸, 선택지를 정확하게 인식하세요.',
  국어: '수능 국어 문제입니다. 지문과 선택지를 정확하게 인식하세요.',
  사회: '수능 사회탐구 문제입니다.',
  과학: '수능 과학탐구 문제입니다. 수식과 단위를 정확히 인식하세요.',
  기타: '시험 문제입니다.',
};

type AnalysisResult = {
  rawText: string;
  formattedProblem: string;
  explanation: string;
  detectedSubject: string;
  score: number | null;
  problemNumber: number | null;
  problemArea: string;
};

function buildPrompt(subject: string): string {
  const hint = SUBJECT_HINTS[subject] || SUBJECT_HINTS['기타'];
  return `${hint}

이미지에서 수능 문제를 분석하여 아래 JSON 형식으로 반환하세요.

[수식 표기 규칙 — 반드시 준수]
- 모든 수학 수식, 변수, 함수는 예외 없이 LaTeX로 감싸세요
- 인라인 수식: $수식$ (예: $x^2$, $\\frac{a}{b}$, $\\sqrt{n}$)
- 블록 수식 (별도 줄): $$수식$$ (예: $$\\sum_{k=1}^{n} k = \\frac{n(n+1)}{2}$$)
- 지수: $x^{2}$ (중괄호 필수), 아래첨자: $a_{n}$
- 분수: $\\frac{분자}{분모}$, 루트: $\\sqrt{내용}$
- 절댓값: $|x|$, 극한: $\\lim_{x \\to \\infty}$
- 그리스 문자: $\\alpha$, $\\beta$, $\\theta$, $\\pi$
- 선택지는 ①②③④⑤ 기호를 사용하세요

[추출 규칙]
- problemNumber: 문제 번호 (숫자만, 없으면 null)
- score: 배점 (숫자만, 예: "[3점]" → 3, 없으면 null)
- problemArea: 문제가 속하는 세부 영역 (예: "수열", "미분", "이차방정식", "독해", "문학")
- explanation은 **1단계**, **2단계** 형식으로 각 단계를 구분하고, 최종 정답을 명시

반환 JSON (이 형식만 반환, 다른 텍스트 금지):
{
  "rawText": "이미지에서 인식한 원본 텍스트 그대로",
  "formattedProblem": "깔끔하게 정리된 문제 (문제번호·배점 제외, LaTeX 수식 적용, 선택지 포함)",
  "explanation": "단계별 상세 풀이 및 해설 (LaTeX 수식 적용, 정답 번호 명시)",
  "detectedSubject": "수학 또는 영어 또는 국어 또는 사회 또는 과학 또는 기타",
  "score": 3,
  "problemNumber": 15,
  "problemArea": "수열과 극한"
}`;
}

// Gemini Vision으로 분석 (모델 자동 전환)
async function analyzeWithGemini(base64: string, mimeType: string, subject: string): Promise<AnalysisResult> {
  const prompt = buildPrompt(subject);
  let lastError: Error | null = null;

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 4000,
        },
      });

      const result = await model.generateContent([
        { inlineData: { data: base64, mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' } },
        { text: prompt },
      ]);

      const parsed = JSON.parse(result.response.text());
      console.log(`[process-image] Gemini 성공: ${modelName}`);
      return {
        rawText: parsed.rawText || '',
        formattedProblem: parsed.formattedProblem || parsed.rawText || '',
        explanation: parsed.explanation || '해설을 생성할 수 없습니다.',
        detectedSubject: parsed.detectedSubject || subject || '기타',
        score: typeof parsed.score === 'number' ? parsed.score : null,
        problemNumber: typeof parsed.problemNumber === 'number' ? parsed.problemNumber : null,
        problemArea: parsed.problemArea || '',
      };
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      const is429 = lastError.message.includes('429') || lastError.message.includes('quota') || lastError.message.includes('Too Many Requests');
      console.warn(`[process-image] Gemini ${modelName} 실패: ${is429 ? '할당량 초과' : lastError.message}`);
      if (!is429) throw lastError; // 429 외 오류는 바로 throw
    }
  }
  throw lastError; // 모든 Gemini 모델 실패
}

// GPT-4o Vision 폴백
async function analyzeWithGPT4o(base64: string, mimeType: string, subject: string): Promise<AnalysisResult> {
  const prompt = buildPrompt(subject);
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' } },
        { type: 'text', text: prompt },
      ],
    }],
    response_format: { type: 'json_object' },
    max_tokens: 4000,
    temperature: 0.1,
  });

  const parsed = JSON.parse(response.choices[0].message.content || '{}');
  console.log('[process-image] GPT-4o 폴백 성공');
  return {
    rawText: parsed.rawText || '',
    formattedProblem: parsed.formattedProblem || parsed.rawText || '',
    explanation: parsed.explanation || '해설을 생성할 수 없습니다.',
    detectedSubject: parsed.detectedSubject || subject || '기타',
    score: typeof parsed.score === 'number' ? parsed.score : null,
    problemNumber: typeof parsed.problemNumber === 'number' ? parsed.problemNumber : null,
    problemArea: parsed.problemArea || '',
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const subject = (formData.get('subject') as string) || '기타';

    if (!file) {
      return NextResponse.json({ success: false, error: '파일이 없습니다.' }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: '파일 크기는 10MB를 초과할 수 없습니다.' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ success: false, error: '이미지 파일만 업로드 가능합니다.' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
      return NextResponse.json({ success: false, error: 'AI API 키가 설정되지 않았습니다.' }, { status: 500 });
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    let result: AnalysisResult;

    // Gemini 먼저 시도, 실패하면 GPT-4o 폴백
    if (process.env.GEMINI_API_KEY) {
      try {
        result = await analyzeWithGemini(base64, file.type, subject);
      } catch (geminiError) {
        console.warn('[process-image] Gemini 전체 실패, GPT-4o 폴백 시도');
        if (!process.env.OPENAI_API_KEY) throw geminiError;
        result = await analyzeWithGPT4o(base64, file.type, subject);
      }
    } else {
      result = await analyzeWithGPT4o(base64, file.type, subject);
    }

    if (!result.rawText.trim() && !result.formattedProblem.trim()) {
      return NextResponse.json(
        { success: false, error: '이미지에서 문제를 인식할 수 없습니다. 더 선명한 이미지를 사용해주세요.' },
        { status: 400 }
      );
    }

    // Supabase에 저장 (로그인된 경우)
    let questionId: string | null = null;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('questions')
          .insert({
            user_id: user.id,
            ocr_text: result.formattedProblem,
            ai_explanation: result.explanation,
            subject: result.detectedSubject,
          })
          .select('id')
          .single();
        if (!error && data) questionId = data.id;
      }
    } catch {
      // DB 저장 실패 시 무시
    }

    return NextResponse.json({
      success: true,
      data: {
        ocrText: result.rawText,
        formattedProblem: result.formattedProblem,
        explanation: result.explanation,
        subject: result.detectedSubject,
        score: result.score,
        problemNumber: result.problemNumber,
        problemArea: result.problemArea,
        questionId,
      },
    });
  } catch (error) {
    console.error('이미지 처리 오류:', error);
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json(
      { success: false, error: `이미지 분석 중 오류가 발생했습니다: ${message}` },
      { status: 500 }
    );
  }
}
