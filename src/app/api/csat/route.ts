import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 수능 샘플 데이터 (Supabase 미설정 시 사용)
const SAMPLE_CSAT_PROBLEMS = [
  {
    id: 'sample-1',
    year: 2024,
    month: 11,
    subject: '수학',
    sub_subject: '공통',
    number: 1,
    content: '$(3\\sqrt{2})^2 \\div \\sqrt{6}$의 값은?',
    choices: ['$\\sqrt{6}$', '$2\\sqrt{6}$', '$3\\sqrt{6}$', '$4\\sqrt{6}$', '$5\\sqrt{6}$'],
    answer: 3,
    explanation: '$(3\\sqrt{2})^2 = 9 \\times 2 = 18$\n\n$18 \\div \\sqrt{6} = \\frac{18}{\\sqrt{6}} = \\frac{18\\sqrt{6}}{6} = 3\\sqrt{6}$\n\n정답: ③ $3\\sqrt{6}$',
    difficulty: 'easy',
    tags: ['지수', '근호'],
  },
  {
    id: 'sample-2',
    year: 2024,
    month: 11,
    subject: '수학',
    sub_subject: '공통',
    number: 2,
    content: '함수 $f(x) = x^3 - 3x^2 + 2$에서 $f\'(1)$의 값은?',
    choices: ['-3', '-1', '0', '1', '3'],
    answer: 1,
    explanation: "$f'(x) = 3x^2 - 6x$\n\n$f'(1) = 3(1)^2 - 6(1) = 3 - 6 = -3$\n\n정답: ① -3",
    difficulty: 'easy',
    tags: ['미분', '다항함수'],
  },
  {
    id: 'sample-3',
    year: 2024,
    month: 11,
    subject: '수학',
    sub_subject: '확률과통계',
    number: 23,
    content: '숫자 1, 2, 3, 4, 5가 하나씩 적힌 5장의 카드 중에서 임의로 3장을 뽑을 때, 가장 큰 수가 4일 확률은?',
    choices: ['$\\frac{1}{10}$', '$\\frac{3}{10}$', '$\\frac{1}{2}$', '$\\frac{3}{5}$', '$\\frac{7}{10}$'],
    answer: 2,
    explanation: '전체 경우의 수: $\\binom{5}{3} = 10$\n\n가장 큰 수가 4인 경우: 4를 반드시 포함하고 5를 제외한 나머지 3장(1,2,3) 중 2장 선택\n\n$\\binom{3}{2} = 3$\n\n확률: $\\frac{3}{10}$\n\n정답: ② $\\frac{3}{10}$',
    difficulty: 'medium',
    tags: ['확률', '조합'],
  },
  {
    id: 'sample-4',
    year: 2024,
    month: 11,
    subject: '영어',
    sub_subject: null,
    number: 18,
    content: 'What is the main purpose of this passage?\n\n"Technology has transformed the way we communicate. Social media platforms allow people to share information instantly across the globe, breaking down traditional barriers of distance and time."',
    choices: [
      'To criticize social media',
      'To describe how technology changed communication',
      'To explain technical aspects of platforms',
      'To compare old and new communication methods',
      'To promote a specific platform'
    ],
    answer: 2,
    explanation: "지문의 핵심: Technology → communication 변화\n\n'Technology has transformed the way we communicate'가 주제문\n\n정답: ② To describe how technology changed communication",
    difficulty: 'easy',
    tags: ['주제', '목적'],
  },
  {
    id: 'sample-5',
    year: 2023,
    month: 11,
    subject: '수학',
    sub_subject: '공통',
    number: 28,
    content: '실수 전체의 집합에서 연속인 함수 $f(x)$가 모든 실수 $x$에 대하여\n$$f(x+2) = f(x) + 2x + 3$$\n을 만족시킬 때, $f(10) - f(0)$의 값을 구하시오.',
    choices: null,
    answer: null,
    explanation: '$f(x+2) = f(x) + 2x + 3$\n\n$x = 0$: $f(2) = f(0) + 3$\n$x = 2$: $f(4) = f(2) + 7 = f(0) + 10$\n$x = 4$: $f(6) = f(4) + 11 = f(0) + 21$\n$x = 6$: $f(8) = f(6) + 15 = f(0) + 36$\n$x = 8$: $f(10) = f(8) + 19 = f(0) + 55$\n\n따라서 $f(10) - f(0) = 55$',
    difficulty: 'hard',
    tags: ['함수의 연속', '점화식'],
  },
  {
    id: 'sample-6',
    year: 2023,
    month: 6,
    subject: '국어',
    sub_subject: '문학',
    number: 34,
    content: '다음 시에서 화자의 태도로 가장 적절한 것은?\n\n"청산리 벽계수야 수이 감을 자랑 마라\n일도 창해하면 다시 오기 어려워라\n명월이 만공산하니 쉬어 간들 어떠리"\n- 황진이',
    choices: [
      '자연의 섭리에 순응하는 태도',
      '세월의 덧없음에 체념하는 태도',
      '현재의 즐거움을 누리자는 권유',
      '이상향을 향한 동경',
      '과거를 회상하며 그리워하는 태도'
    ],
    answer: 3,
    explanation: '청산리 벽계수에게 빨리 흘러가지 말고 달 밝은 밤에 쉬어가라고 권유\n→ 현재의 아름다운 순간을 즐기자는 메시지\n\n정답: ③ 현재의 즐거움을 누리자는 권유',
    difficulty: 'medium',
    tags: ['시조', '화자의 태도', '고전문학'],
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const month = searchParams.get('month');
  const subject = searchParams.get('subject');
  const search = searchParams.get('search');

  try {
    // Supabase에서 조회 시도
    const supabase = await createClient();
    let query = supabase.from('csat_problems').select('*').order('number');

    if (year) query = query.eq('year', parseInt(year));
    if (month) query = query.eq('month', parseInt(month));
    if (subject && subject !== '전체') query = query.eq('subject', subject);
    if (search) query = query.ilike('content', `%${search}%`);

    const { data, error } = await query.limit(50);

    if (!error && data && data.length > 0) {
      return NextResponse.json({ success: true, problems: data, source: 'database' });
    }
  } catch {
    // Supabase 미설정 시 샘플 데이터 반환
  }

  // 샘플 데이터 필터링
  let filtered = [...SAMPLE_CSAT_PROBLEMS];
  if (year) filtered = filtered.filter(p => p.year === parseInt(year));
  if (month) filtered = filtered.filter(p => p.month === parseInt(month));
  if (subject && subject !== '전체') filtered = filtered.filter(p => p.subject === subject);
  if (search) filtered = filtered.filter(p =>
    p.content.toLowerCase().includes(search.toLowerCase()) ||
    p.tags.some(t => t.includes(search))
  );

  return NextResponse.json({ success: true, problems: filtered, source: 'sample' });
}
