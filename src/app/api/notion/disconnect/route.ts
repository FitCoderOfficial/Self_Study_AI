import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    await supabase
      .from('profiles')
      .update({ notion_token: null, notion_database_id: null })
      .eq('id', user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Notion disconnect error:', err);
    return NextResponse.json({ success: false, error: '연동 해제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
