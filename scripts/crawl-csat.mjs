/**
 * 수능/모의평가 기출문제 PDF 크롤러
 * - 수능:    https://www.suneung.re.kr/boardCnts/list.do?boardID=1500234
 * - 모의평가: https://www.suneung.re.kr/boardCnts/list.do?boardID=1500236
 *
 * 사용법:
 *   node scripts/crawl-csat.mjs           ← 전체 (수능 + 모의평가)
 *   node scripts/crawl-csat.mjs suneung   ← 수능만
 *   node scripts/crawl-csat.mjs mock      ← 모의평가만
 *
 * 필요 환경변수 (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (권장, 없으면 ANON_KEY 사용)
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { load } from 'cheerio';
import { createClient } from '@supabase/supabase-js';

// ── .env.local 파싱 ──────────────────────────────────────────
const envPath = resolve(process.cwd(), '.env.local');
const env = {};
for (const line of readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
  const m = line.match(/^([^#=\s][^=]*)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 .env.local에 없습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── 상수 ─────────────────────────────────────────────────────
const BASE_URL   = 'https://www.suneung.re.kr';
const DELAY_MS   = 400;   // 요청 간 대기
const PAGE_SIZE  = 10;

const BOARDS = {
  suneung: {
    id:    '1500234',
    label: '수능',
    path:  '/boardCnts/list.do?type=default&boardID=1500234&m=0403&s=suneung',
    // 컬럼 순서: 번호(0) | 학년도(1) | 영역(2) | 제목(3) | 등록일(4) | 조회(5) | 파일(6)
    colYear:    1,
    colSubject: 2,
    colTitle:   3,
    colDate:    4,
    colMonth:   null,  // 월 컬럼 없음 → 날짜에서 추론
  },
  mock: {
    id:    '1500236',
    label: '모의평가',
    path:  '/boardCnts/list.do?type=default&boardID=1500236&m=0403&s=suneung',
    // 컬럼 순서: 번호(0) | 학년도(1) | 월(2) | 영역(3) | 제목(4) | 등록일(5)
    colYear:    1,
    colMonth:   2,   // "9월", "6월" 등 명시적 월 컬럼
    colSubject: 3,
    colTitle:   4,
    colDate:    5,
  },
};

const SUBJECT_MAP = {
  '국어': '국어', '수학': '수학', '영어': '영어', '한국사': '한국사',
  '사회': '사회탐구', '사회탐구': '사회탐구',
  '과학': '과학탐구', '과학탐구': '과학탐구',
  '직업탐구': '직업탐구', '제2외국어': '제2외국어', '한문': '제2외국어',
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) research-crawler/1.0',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'ko-KR,ko;q=0.9',
      'Referer': BASE_URL,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return load(await res.text());
}

/** 등록일 또는 월 컬럼 문자열에서 시험 월(숫자) 추출 */
function parseMonth(monthColText, dateText) {
  // 명시적 월 컬럼이 있을 때 (모의평가): "9월" → 9
  if (monthColText) {
    const m = monthColText.match(/(\d+)/);
    if (m) return parseInt(m[1]);
  }
  // 날짜로 추론 (수능): "2025-11-17" → 11
  const dm = dateText.match(/\d{4}-(\d{2})-\d{2}/);
  return dm ? parseInt(dm[1]) : 11;
}

/** 게시물 상세 페이지에서 파일 다운로드 링크 추출 */
async function extractFilesFromPost(postUrl) {
  try {
    const $ = await fetchPage(postUrl);
    const files = { pdf_url: null, answer_url: null };

    $('a[href*="fileDown"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      const full = href.startsWith('http') ? href : BASE_URL + href;

      if (text.includes('문제지') || text.endsWith('문제')) {
        if (!files.pdf_url) files.pdf_url = full;
      } else if (text.includes('정답') || text.includes('답안')) {
        if (!files.answer_url) files.answer_url = full;
      } else if (!files.pdf_url && !files.answer_url) {
        // 파일명으로 판단
        const fn = href.toLowerCase();
        if (fn.includes('문제'))       files.pdf_url    = full;
        else if (fn.includes('정답')) files.answer_url = full;
      }
    });

    return files;
  } catch (e) {
    console.warn(`    ⚠️  파일 링크 추출 실패: ${e.message}`);
    return { pdf_url: null, answer_url: null };
  }
}

/** 게시판 1개 크롤링 */
async function crawlBoard(board) {
  console.log(`\n📋 [${board.label}] 크롤링 시작`);

  const $first = await fetchPage(`${BASE_URL}${board.path}&page=1`);
  const totalMatch = $first('body').text().match(/전체\s*[\[\*]?(\d[\d,]+)[\]\*]?\s*건/);
  const total      = totalMatch ? parseInt(totalMatch[1].replace(',', '')) : 200;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  console.log(`   📊 총 ${total}건, ${totalPages}페이지`);

  const records = [];

  for (let page = 1; page <= totalPages; page++) {
    console.log(`   📄 페이지 ${page}/${totalPages}...`);
    const $page = await fetchPage(`${BASE_URL}${board.path}&page=${page}`);
    const rows  = $page('table tbody tr');
    if (!rows.length) { console.log('   행 없음, 중단'); break; }

    for (let i = 0; i < rows.length; i++) {
      const cells   = rows.eq(i).find('td');
      if (cells.length < 5) continue;

      const yearText    = cells.eq(board.colYear).text().trim();
      const monthText   = board.colMonth !== null ? cells.eq(board.colMonth).text().trim() : null;
      const subjectRaw  = cells.eq(board.colSubject).text().trim();
      const titleCell   = cells.eq(board.colTitle);
      const dateText    = cells.eq(board.colDate).text().trim();

      const year    = parseInt(yearText);
      if (isNaN(year) || year < 2005 || year > 2030) continue;

      const subject = SUBJECT_MAP[subjectRaw] || subjectRaw;
      const month   = parseMonth(monthText, dateText);

      let link = titleCell.find('a[href]').attr('href')
              || rows.eq(i).find('a[href*="boardSeq"]').attr('href')
              || '';
      if (!link) continue;

      const postUrl  = link.startsWith('http') ? link : BASE_URL + link;
      const seqMatch = postUrl.match(/boardSeq=([^&]+)/);
      const boardSeq = seqMatch ? seqMatch[1] : null;

      console.log(`      ✏️  ${year}학년도 ${month}월 ${subject} (${dateText})`);

      const { pdf_url, answer_url } = await extractFilesFromPost(postUrl);
      if (pdf_url || answer_url) {
        records.push({ year, month, subject, pdf_url, answer_url, board_seq: boardSeq });
        console.log(`         ✅ 문제지: ${pdf_url ? '있음' : '없음'} / 정답: ${answer_url ? '있음' : '없음'}`);
      } else {
        console.log(`         ⚠️  파일 없음`);
      }

      await sleep(DELAY_MS);
    }
    await sleep(DELAY_MS * 2);
  }

  return records;
}

/** 메인 */
async function main() {
  const arg = process.argv[2] || 'all';  // 'suneung' | 'mock' | 'all'

  let allRecords = [];

  if (arg === 'suneung' || arg === 'all') {
    allRecords = allRecords.concat(await crawlBoard(BOARDS.suneung));
  }
  if (arg === 'mock' || arg === 'all') {
    allRecords = allRecords.concat(await crawlBoard(BOARDS.mock));
  }

  if (!allRecords.length) {
    console.log('\n저장할 데이터가 없습니다.');
    return;
  }

  console.log(`\n💾 총 ${allRecords.length}개 → Supabase 저장 중...`);

  // 50개씩 배치 처리
  const BATCH = 50;
  for (let i = 0; i < allRecords.length; i += BATCH) {
    const chunk = allRecords.slice(i, i + BATCH);
    const { error } = await supabase
      .from('csat_pdfs')
      .upsert(chunk, { onConflict: 'year,month,subject' });
    if (error) console.error(`   ❌ 배치 ${i}~${i + BATCH} 저장 오류:`, error.message);
    else console.log(`   ✅ ${i + 1}~${Math.min(i + BATCH, allRecords.length)}번 저장 완료`);
  }

  console.log('\n🎉 크롤링 완료!');
}

main().catch(err => { console.error('❌ 오류:', err); process.exit(1); });
