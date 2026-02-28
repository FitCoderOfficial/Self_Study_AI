import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// GPT-4o Vision으로 이미지에서 문제 추출 + 해설 생성 (한 번에 처리)
async function analyzeImageWithGPT4o(
  base64: string,
  mimeType: string,
  subject: string
): Promise<{ formattedProblem: string; explanation: string; detectedSubject: string; rawText: string }> {
  const prompt = `당신은 한국 수능 전문 교육 AI입니다. 이 이미지는 수능 또는 수능 관련 문제입니다.

[지시사항]
1. 이미지에서 문제 텍스트를 정확하게 읽어주세요. 한국어와 수식을 모두 포함합니다.
2. 수학 수식은 LaTeX 형식($...$, $$...$$)으로 표현하세요.
3. 문제를 보기 좋게 정리하고 (선택지 포함), 상세한 단계별 풀이와 해설을 작성하세요.
4. 힌트나 선지 번호 등 문제의 모든 구성요소를 포함하세요.
5. 사용자가 선택한 과목: ${subject || '자동감지'}

[응답 형식] 반드시 아래 JSON만 응답하세요:
{
  "rawText": "이미지에서 추출한 원본 텍스트 (수식 포함)",
  "formattedProblem": "깔끔하게 정리된 문제 전체 (문제번호, 배점, 문제내용, 선택지 포함)",
  "explanation": "단계별 상세 풀이 및 해설 (정답 명시, 각 단계 설명, 오답 이유 포함)",
  "detectedSubject": "수학 또는 영어 또는 국어 또는 사회 또는 과학 또는 기타"
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
              detail: 'high',  // 고해상도 분석
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 3000,
    temperature: 0.2,
  });

  const content = response.choices[0].message.content || '{}';
  const result = JSON.parse(content);

  return {
    rawText: result.rawText || '',
    formattedProblem: result.formattedProblem || result.rawText || '',
    explanation: result.explanation || '해설을 생성할 수 없습니다.',
    detectedSubject: result.detectedSubject || subject || '기타',
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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API 키가 설정되지 않았습니다. .env.local에 OPENAI_API_KEY를 추가하세요.',
      }, { status: 500 });
    }

    // 이미지를 base64로 변환
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    // GPT-4o Vision으로 이미지 분석 (OCR + 해설 한 번에)
    const { rawText, formattedProblem, explanation, detectedSubject } =
      await analyzeImageWithGPT4o(base64, file.type, subject);

    if (!rawText.trim() && !formattedProblem.trim()) {
      return NextResponse.json({
        success: false,
        error: '이미지에서 문제를 인식할 수 없습니다. 더 선명한 이미지를 사용해주세요.',
      }, { status: 400 });
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

        if (!error && data) {
          questionId = data.id;
        }
      }
    } catch (dbError) {
      console.warn('DB 저장 실패 (Supabase 미설정):', dbError);
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

    if (error instanceof Error && error.message.includes('invalid_api_key')) {
      return NextResponse.json({ success: false, error: 'OpenAI API 키가 유효하지 않습니다.' }, { status: 401 });
    }

    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
