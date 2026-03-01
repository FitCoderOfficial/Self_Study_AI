import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { data: q, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !q) {
      return NextResponse.json({ error: '문제를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 유사문제도 가져오기
    const { data: similar } = await supabase
      .from('similar_questions')
      .select('generated_content')
      .eq('original_question_id', id)
      .eq('user_id', user.id)
      .limit(1)
      .single();

    let simContent: Record<string, unknown> | null = null;
    if (similar?.generated_content) {
      try { simContent = JSON.parse(similar.generated_content); } catch { /* ignore */ }
    }

    const diffMap: Record<string, string> = { easy: '쉬움', medium: '보통', hard: '어려움' };
    const correctMap: Record<string, string> = { true: '✅ 정답', false: '❌ 오답', null: '미채점' };

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>오답노트 - ${q.subject || '문제'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', sans serif;
      font-size: 14px;
      color: #1a1a1a;
      background: white;
      padding: 32px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #1a1a1a;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    .header-left h1 {
      font-size: 20px;
      font-weight: 800;
    }
    .header-left p {
      font-size: 12px;
      color: #666;
      margin-top: 2px;
    }
    .meta-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 100px;
      font-size: 12px;
      font-weight: 600;
      border: 1.5px solid #ddd;
    }
    .chip.subject { background: #EFF6FF; color: #1D4ED8; border-color: #BFDBFE; }
    .chip.score   { background: #FFFBEB; color: #92400E; border-color: #FDE68A; }
    .chip.correct-yes { background: #F0FDF4; color: #166534; border-color: #BBF7D0; }
    .chip.correct-no  { background: #FEF2F2; color: #991B1B; border-color: #FECACA; }
    .chip.diff    { background: #F5F3FF; color: #5B21B6; border-color: #DDD6FE; }

    .layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .layout.no-image { grid-template-columns: 1fr; }

    .section-title {
      font-size: 10px;
      font-weight: 700;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 8px;
    }
    .image-box {
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
    }
    .image-box img {
      width: 100%;
      height: auto;
      display: block;
    }
    .problem-box {
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      padding: 16px;
      background: #F8FAFC;
      line-height: 1.75;
      white-space: pre-wrap;
    }
    .explanation-box {
      border: 1.5px solid #BBF7D0;
      border-radius: 10px;
      padding: 16px;
      background: #F0FDF4;
      line-height: 1.75;
      white-space: pre-wrap;
      margin-bottom: 20px;
    }
    .similar-box {
      border: 1.5px solid #DDD6FE;
      border-radius: 10px;
      padding: 16px;
      background: #F5F3FF;
      margin-bottom: 20px;
    }
    .similar-box .problem-text {
      white-space: pre-wrap;
      line-height: 1.75;
      margin-bottom: 12px;
    }
    .answer-highlight {
      display: inline-block;
      background: #1D4ED8;
      color: white;
      padding: 2px 10px;
      border-radius: 100px;
      font-weight: 700;
      font-size: 13px;
    }
    .footer {
      margin-top: 32px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #aaa;
    }
    @media print {
      body { padding: 20px; }
      @page { margin: 15mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>📚 Self Study AI 오답노트</h1>
      <p>${new Date(q.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
  </div>

  <div class="meta-chips">
    <span class="chip subject">${q.subject || '기타'}</span>
    ${q.problem_number ? `<span class="chip">${q.problem_number}번 문제</span>` : ''}
    ${q.score ? `<span class="chip score">${q.score}점</span>` : ''}
    ${q.is_correct === true ? '<span class="chip correct-yes">✅ 정답</span>'
      : q.is_correct === false ? '<span class="chip correct-no">❌ 오답</span>' : ''}
    ${q.difficulty ? `<span class="chip diff">${diffMap[q.difficulty] || q.difficulty}</span>` : ''}
    ${(q.tags || []).map((t: string) => `<span class="chip">${t}</span>`).join('')}
  </div>

  <div class="${q.image_url ? 'layout' : 'layout no-image'}">
    ${q.image_url ? `
    <div>
      <p class="section-title">원본 이미지</p>
      <div class="image-box">
        <img src="${q.image_url}" alt="원본 문제 이미지" />
      </div>
    </div>` : ''}
    <div>
      <p class="section-title">문제</p>
      <div class="problem-box">${(q.ocr_text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </div>
  </div>

  ${q.ai_explanation ? `
  <div>
    <p class="section-title">💡 AI 해설</p>
    <div class="explanation-box">${q.ai_explanation.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
  </div>` : ''}

  ${simContent ? `
  <div>
    <p class="section-title">🔄 유사문제</p>
    <div class="similar-box">
      <div class="problem-text">${String(simContent.problem || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      ${Array.isArray(simContent.choices) ? `<div style="margin-bottom:12px">${(simContent.choices as string[]).map((c: string) => `<div style="margin-bottom:4px">${c.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`).join('')}</div>` : ''}
      <span class="answer-highlight">정답: ${simContent.answer}번</span>
    </div>
  </div>` : ''}

  <div class="footer">
    <span>Self Study AI</span>
    <span>출력일: ${new Date().toLocaleDateString('ko-KR')}</span>
  </div>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });

  } catch (err) {
    console.error('PDF export error:', err);
    return NextResponse.json({ error: '내보내기 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
