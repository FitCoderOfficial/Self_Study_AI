import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const month = searchParams.get('month');

  try {
    const supabase = await createClient();
    let query = supabase
      .from('csat_pdfs')
      .select('year, month, subject, pdf_url, answer_url')
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .order('subject');

    if (year) query = query.eq('year', parseInt(year));
    if (month) query = query.eq('month', parseInt(month));

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, pdfs: data || [] });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg, pdfs: [] }, { status: 500 });
  }
}
