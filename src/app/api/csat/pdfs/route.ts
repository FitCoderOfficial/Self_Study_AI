import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const month = searchParams.get('month');

  try {
    const supabase = await createClient();

    const buildQuery = (select: string) => {
      let q = supabase
        .from('csat_pdfs')
        .select(select)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .order('subject');
      if (year) q = q.eq('year', parseInt(year));
      if (month) q = q.eq('month', parseInt(month));
      return q;
    };

    // zip_files 컬럼 포함 시도, 없으면 기본 컬럼만
    let { data, error } = await buildQuery(
      'year, month, subject, pdf_url, answer_url, zip_files, answer_zip_files'
    );

    if (error) {
      // zip_files 컬럼이 아직 없는 경우 fallback
      const fallback = await buildQuery('year, month, subject, pdf_url, answer_url');
      if (fallback.error) throw fallback.error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data = (fallback.data || []).map((r: any) => ({
        ...r,
        zip_files: null,
        answer_zip_files: null,
      })) as typeof data;
    }

    return NextResponse.json({ success: true, pdfs: data || [] });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg, pdfs: [] }, { status: 500 });
  }
}
