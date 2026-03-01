import { Client, APIResponseError } from '@notionhq/client';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Rich text 2000자 제한 분할
function toRichText(text: string) {
  if (!text) return [{ type: 'text' as const, text: { content: '' } }];
  const chunks = [];
  for (let i = 0; i < text.length; i += 2000) {
    chunks.push({ type: 'text' as const, text: { content: text.slice(i, i + 2000) } });
  }
  return chunks;
}

// 텍스트를 단락 블록 배열로 분할
function toParagraphBlocks(text: string) {
  if (!text) return [];
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  const blocks = [];
  for (const para of paragraphs) {
    // 각 단락도 1900자 제한
    for (let i = 0; i < para.length; i += 1900) {
      blocks.push({
        object: 'block' as const,
        type: 'paragraph' as const,
        paragraph: {
          rich_text: [{ type: 'text' as const, text: { content: para.slice(i, i + 1900) } }],
        },
      });
    }
  }
  return blocks.length > 0 ? blocks : [{
    object: 'block' as const,
    type: 'paragraph' as const,
    paragraph: { rich_text: toRichText(text) },
  }];
}

// 난이도 한글 변환
function difficultyLabel(difficulty: string): string {
  const map: Record<string, string> = { easy: '쉬움', medium: '보통', hard: '어려움' };
  return map[difficulty] || '보통';
}

// 정오답 한글 변환
function correctLabel(isCorrect: boolean | null): string {
  if (isCorrect === true) return '정답 ✅';
  if (isCorrect === false) return '오답 ❌';
  return '미채점 ⬜';
}

// 페이지 속성 빌드
function buildProperties(q: Record<string, unknown>) {
  const titleText = q.problem_number
    ? `${q.problem_number}번 문제 (${q.subject || '기타'})`
    : `${q.subject || '기타'} 문제`;

  const props: Record<string, unknown> = {
    '문제': { title: [{ text: { content: titleText } }] },
    '과목': { select: { name: (q.subject as string) || '기타' } },
    '정오답': { select: { name: correctLabel(q.is_correct as boolean | null) } },
    '난이도': { select: { name: difficultyLabel((q.difficulty as string) || 'medium') } },
  };

  if (q.score) props['배점'] = { number: q.score };

  const tags = (q.tags as string[]) || [];
  if (tags.length > 0) {
    props['태그'] = { multi_select: tags.map((t: string) => ({ name: t })) };
  }

  if (q.created_at) {
    props['날짜'] = { date: { start: (q.created_at as string).split('T')[0] } };
  }

  if (q.problem_area) {
    props['영역'] = { rich_text: [{ text: { content: q.problem_area as string } }] };
  }

  return props;
}

// 페이지 콘텐츠 블록 빌드
function buildBlocks(q: Record<string, unknown>, similar?: Record<string, unknown> | null) {
  const blocks: object[] = [];

  // 원본 이미지
  if (q.image_url) {
    blocks.push({
      object: 'block',
      type: 'image',
      image: { type: 'external', external: { url: q.image_url } },
    });
    blocks.push({ object: 'block', type: 'divider', divider: {} });
  }

  // 📖 문제 (callout)
  const problemText = (q.ocr_text as string) || '';
  blocks.push({
    object: 'block',
    type: 'callout',
    callout: {
      icon: { type: 'emoji', emoji: '📖' },
      color: 'blue_background',
      rich_text: toRichText(problemText),
    },
  });

  blocks.push({ object: 'block', type: 'divider', divider: {} });

  // 💡 AI 해설
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ type: 'text', text: { content: '💡 AI 해설' } }],
      color: 'default',
    },
  });

  const explanationBlocks = toParagraphBlocks((q.ai_explanation as string) || '');
  blocks.push(...explanationBlocks);

  // 🔄 유사문제 (toggle)
  if (similar?.generated_content) {
    blocks.push({ object: 'block', type: 'divider', divider: {} });

    let simContent: Record<string, unknown> = {};
    try {
      simContent = JSON.parse(similar.generated_content as string);
    } catch {
      simContent = {};
    }

    const simChildren: object[] = [];

    if (simContent.problem) {
      simChildren.push({
        object: 'block',
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '✏️' },
          color: 'purple_background',
          rich_text: toRichText(simContent.problem as string),
        },
      });
    }

    if (Array.isArray(simContent.choices) && simContent.choices.length > 0) {
      const choicesText = (simContent.choices as string[]).join('\n');
      simChildren.push({
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: choicesText } }] },
      });
    }

    if (simContent.answer) {
      simChildren.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{
            type: 'text',
            text: { content: `정답: ${simContent.answer}번` },
            annotations: { bold: true },
          }],
        },
      });
    }

    if (simContent.solution) {
      simChildren.push(...toParagraphBlocks(simContent.solution as string));
    }

    if (Array.isArray(simContent.keyConcepts) && simContent.keyConcepts.length > 0) {
      simChildren.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{
            type: 'text',
            text: { content: `핵심 개념: ${(simContent.keyConcepts as string[]).join(', ')}` },
            annotations: { italic: true, color: 'gray' },
          }],
        },
      });
    }

    blocks.push({
      object: 'block',
      type: 'toggle',
      toggle: {
        rich_text: [{ type: 'text', text: { content: '🔄 유사문제 보기' } }],
        color: 'purple_background',
        children: simChildren,
      },
    });
  }

  return blocks;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { questionIds, includeSimilar = true } = await request.json();
    if (!questionIds?.length) {
      return NextResponse.json({ success: false, error: '내보낼 문제를 선택해주세요.' }, { status: 400 });
    }

    // Notion 설정 조회
    const { data: profile } = await supabase
      .from('profiles')
      .select('notion_token, notion_database_id')
      .eq('id', user.id)
      .single();

    if (!profile?.notion_token || !profile?.notion_database_id) {
      return NextResponse.json({
        success: false,
        error: 'Notion 연동이 필요합니다.',
        needsSetup: true,
      }, { status: 400 });
    }

    // 문제 조회
    const { data: questions, error: qErr } = await supabase
      .from('questions')
      .select('*')
      .in('id', questionIds)
      .eq('user_id', user.id);

    if (qErr || !questions?.length) {
      return NextResponse.json({ success: false, error: '문제를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 유사문제 조회
    const similarMap: Record<string, Record<string, unknown>> = {};
    if (includeSimilar) {
      const { data: similars } = await supabase
        .from('similar_questions')
        .select('*')
        .in('original_question_id', questionIds)
        .eq('user_id', user.id);

      if (similars) {
        for (const s of similars) {
          if (s.original_question_id && !similarMap[s.original_question_id]) {
            similarMap[s.original_question_id] = s;
          }
        }
      }
    }

    const notion = new Client({ auth: profile.notion_token });
    const exportedPages: { id: string; url: string }[] = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i] as Record<string, unknown>;
      const similar = similarMap[q.id as string] || null;

      const page = await notion.pages.create({
        parent: { database_id: profile.notion_database_id },
        properties: buildProperties(q) as Parameters<typeof notion.pages.create>[0]['properties'],
        children: buildBlocks(q, similar) as Parameters<typeof notion.pages.create>[0]['children'],
      });

      exportedPages.push({ id: page.id, url: (page as { url: string }).url });

      // Rate limit 대응: 복수 내보내기 시 딜레이
      if (questions.length > 1 && i < questions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 350));
      }
    }

    return NextResponse.json({
      success: true,
      exported: exportedPages.length,
      pages: exportedPages,
    });

  } catch (err) {
    console.error('Notion export error:', err);
    if (err instanceof APIResponseError) {
      if (err.code === 'object_not_found') {
        return NextResponse.json({
          success: false,
          error: 'Notion 데이터베이스를 찾을 수 없습니다. 프로필에서 Notion을 재연결해주세요.',
          needsSetup: true,
        }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: `Notion 오류: ${err.message}` }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: '내보내기 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
