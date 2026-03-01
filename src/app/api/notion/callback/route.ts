import { NextRequest, NextResponse } from 'next/server';
import { Client, APIResponseError } from '@notionhq/client';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/profile?notion=error&reason=${error || 'no_code'}`);
  }

  const clientId = process.env.NOTION_CLIENT_ID;
  const clientSecret = process.env.NOTION_CLIENT_SECRET;
  const redirectUri = process.env.NOTION_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(`${baseUrl}/profile?notion=error&reason=config`);
  }

  try {
    // 1. 코드를 access_token으로 교환
    const tokenRes = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      console.error('Notion token exchange failed:', await tokenRes.text());
      return NextResponse.redirect(`${baseUrl}/profile?notion=error&reason=token`);
    }

    const tokenData = await tokenRes.json();
    const accessToken: string = tokenData.access_token;

    // 2. 현재 유저 확인
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(`${baseUrl}/login?next=/profile`);
    }

    // 3. 기존 DB ID 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('notion_database_id')
      .eq('id', user.id)
      .single();

    const notion = new Client({ auth: accessToken });
    let databaseId = profile?.notion_database_id;

    // 4. 기존 DB 유효성 확인 또는 새 DB 생성
    if (databaseId) {
      try {
        await notion.databases.retrieve({ database_id: databaseId });
      } catch {
        databaseId = undefined;
      }
    }

    if (!databaseId) {
      // 접근 가능한 페이지 검색
      const searchResult = await notion.search({
        filter: { property: 'object', value: 'page' },
        page_size: 1,
      });

      if (searchResult.results.length === 0) {
        // 토큰은 저장하되 DB 없이 연동 완료 (추후 자동 생성)
        await supabase.from('profiles').update({
          notion_token: accessToken,
          notion_database_id: null,
        }).eq('id', user.id);
        return NextResponse.redirect(`${baseUrl}/profile?notion=success&setup=pending`);
      }

      const parentPageId = searchResult.results[0].id;

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
      databaseId = database.id;
    }

    // 5. Supabase에 저장
    await supabase.from('profiles').update({
      notion_token: accessToken,
      notion_database_id: databaseId,
    }).eq('id', user.id);

    return NextResponse.redirect(`${baseUrl}/profile?notion=success`);

  } catch (err) {
    console.error('Notion OAuth callback error:', err);
    if (err instanceof APIResponseError) {
      return NextResponse.redirect(`${baseUrl}/profile?notion=error&reason=${encodeURIComponent(err.message)}`);
    }
    return NextResponse.redirect(`${baseUrl}/profile?notion=error&reason=unknown`);
  }
}
