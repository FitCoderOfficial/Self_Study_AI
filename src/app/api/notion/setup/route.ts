import { Client, APIResponseError } from '@notionhq/client';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { notion_token } = await request.json();
    if (!notion_token?.trim()) {
      return NextResponse.json({ success: false, error: 'Integration Token을 입력해주세요.' }, { status: 400 });
    }

    // Notion 클라이언트 초기화 및 토큰 검증
    const notion = new Client({ auth: notion_token.trim() });

    let workspaceUser;
    try {
      workspaceUser = await notion.users.me({});
    } catch (err) {
      if (err instanceof APIResponseError) {
        if (err.code === 'unauthorized') {
          return NextResponse.json({ success: false, error: '유효하지 않은 토큰입니다. notion.so/my-integrations에서 토큰을 확인해주세요.' }, { status: 400 });
        }
      }
      throw err;
    }

    // 이미 연동된 데이터베이스가 있는지 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('notion_database_id')
      .eq('id', user.id)
      .single();

    if (profile?.notion_database_id) {
      // 기존 DB가 유효한지 확인
      try {
        await notion.databases.retrieve({ database_id: profile.notion_database_id });
        // 유효하면 토큰만 업데이트
        await supabase.from('profiles').update({ notion_token: notion_token.trim() }).eq('id', user.id);
        return NextResponse.json({
          success: true,
          alreadyExists: true,
          database_id: profile.notion_database_id,
          workspace: workspaceUser.name,
        });
      } catch {
        // DB가 삭제된 경우 새로 생성
      }
    }

    // 통합이 접근 가능한 페이지 검색
    const searchResult = await notion.search({
      filter: { property: 'object', value: 'page' },
      page_size: 1,
    });

    if (searchResult.results.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Notion 페이지에 통합 연결이 필요합니다.\n\n연결 방법:\n1. Notion에서 원하는 페이지 열기\n2. 우측 상단 "..." 클릭\n3. "연결" → 생성한 통합 선택\n4. 다시 시도해주세요.',
      }, { status: 400 });
    }

    const parentPageId = searchResult.results[0].id;

    // "Self Study AI 오답노트" 데이터베이스 생성
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const database = await (notion.databases.create as any)({
      parent: { type: 'page_id', page_id: parentPageId },
      icon: { type: 'emoji', emoji: '📚' },
      title: [{ type: 'text', text: { content: 'Self Study AI 오답노트' } }],
      properties: {
        '문제': { title: {} },
        '과목': {
          select: {
            options: [
              { name: '수학', color: 'blue' },
              { name: '영어', color: 'green' },
              { name: '국어', color: 'orange' },
              { name: '사회', color: 'yellow' },
              { name: '과학', color: 'purple' },
              { name: '한국사', color: 'red' },
              { name: '기타', color: 'gray' },
            ],
          },
        },
        '정오답': {
          select: {
            options: [
              { name: '정답 ✅', color: 'green' },
              { name: '오답 ❌', color: 'red' },
              { name: '미채점 ⬜', color: 'gray' },
            ],
          },
        },
        '배점': { number: { format: 'number' } },
        '난이도': {
          select: {
            options: [
              { name: '쉬움', color: 'green' },
              { name: '보통', color: 'yellow' },
              { name: '어려움', color: 'red' },
            ],
          },
        },
        '태그': { multi_select: {} },
        '날짜': { date: {} },
        '영역': { rich_text: {} },
      },
    });

    // Supabase profiles에 저장
    await supabase.from('profiles')
      .update({
        notion_token: notion_token.trim(),
        notion_database_id: database.id,
      })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      database_id: database.id,
      workspace: workspaceUser.name,
    });

  } catch (err) {
    console.error('Notion setup error:', err);
    if (err instanceof APIResponseError) {
      return NextResponse.json({ success: false, error: `Notion 오류: ${err.message}` }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: '연결 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
