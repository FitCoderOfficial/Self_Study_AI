import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SUBJECT_HINTS: Record<string, string> = {
  수학: '수능 수학 문제입니다. 수식과 기호를 정확하게 인식하세요.',
  영어: '수능 영어 문제입니다. 지문, 빈칸, 선택지를 정확하게 인식하세요.',
  국어: '수능 국어 문제입니다. 지문과 선택지를 정확하게 인식하세요.',
  사회: '수능 사회탐구 문제입니다.',
  과학: '수능 과학탐구 문제입니다. 수식과 단위를 정확히 인식하세요.',
  기타: '시험 문제입니다.',
};

async function analyzeImageWithGemini(
  base64: string,
  mimeType: string,
  subject: string
): Promise<{
  rawText: string;
  formattedProblem: string;
  explanation: string;
  detectedSubject: string;
}> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
      maxOutputTokens: 4000,
    },
  });

  const subjectHint = SUBJECT_HINTS[subject] || SUBJECT_HINTS['기타'];

  const prompt = `${subjectHint}

이미지에서 수능 문제를 분석하여 아래 JSON 형식으로 반환하세요.

규칙:
- 수학 수식은 반드시 LaTeX 형식으로 표현하세요: 인라인은 $수식$, 블록은 $$수식$$
- 선택지는 ①②③④⑤ 기호를 사용하세요
- 문제 번호와 배점이 있으면 포함하세요
- explanation은 **1단계**, **2단계** 형식으로 단계를 구분하고, 정답과 각 오답의 이유를 설명하세요

반환 JSON:
{
  "rawText": "이미지에서 인식한 원본 텍스트 그대로",
  "formattedProblem": "깔끔하게 정리된 문제 전체 (선택지 포함, LaTeX 수식 적용)",
  "explanation": "단계별 상세 풀이 및 해설 (LaTeX 수식 적용, 정답 명시)",
  "detectedSubject": "수학 또는 영어 또는 국어 또는 사회 또는 과학 또는 기타"
}`;

  const result = await model.generateContent([
    {
      inlineData: {
        data: base64,
        mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
      },
    },
    { text: prompt },
  ]);

  const text = result.response.text();
  const parsed = JSON.parse(text);

  return {
    rawText: parsed.rawText || '',
    formattedProblem: parsed.formattedProblem || parsed.rawText || '',
    explanation: parsed.explanation || '해설을 생성할 수 없습니다.',
    detectedSubject: parsed.detectedSubject || subject || '기타',
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Gemini API 키가 설정되지 않았습니다. .env.local에 GEMINI_API_KEY를 추가하세요.' },
        { status: 500 }
      );
    }

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

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    const { rawText, formattedProblem, explanation, detectedSubject } =
      await analyzeImageWithGemini(base64, file.type, subject);

    if (!rawText.trim() && !formattedProblem.trim()) {
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
            ocr_text: formattedProblem,
            ai_explanation: explanation,
            subject: detectedSubject,
          })
          .select('id')
          .single();

        if (!error && data) questionId = data.id;
      }
    } catch {
      // DB 저장 실패 시 무시하고 계속 진행
    }

    return NextResponse.json({
      success: true,
      data: {
        ocrText: rawText,
        formattedProblem,
        explanation,
        subject: detectedSubject,
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
