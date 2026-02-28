/**
 * 수능 기출문제 PDF 크롤러
 * suneung.re.kr 기출문제 게시판 → Supabase csat_pdfs 테이블에 저장
 *
 * 사용법:
 *   node scripts/crawl-csat.mjs
 *
 * 필요 환경변수 (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  (또는 SUPABASE_SERVICE_ROLE_KEY 권장)
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { load } from 'cheerio';
import { createClient } from '@supabase/supabase-js';

// ── .env.local 파싱 ──────────────────────────────────────────
const envPath = resolve(process.cwd(), '.env.local');
const envLines = readFileSync(envPath, 'utf-8').split(/\r?\n/);
const env = {};
for (const line of envLines) {
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
const BASE_URL = 'https://www.suneung.re.kr';
const LIST_PATH = '/boardCnts/list.do?type=default&boardID=1500234&m=0403&s=suneung';
const DELAY_MS = 400;    // 요청 간 대기 (서버 부하 방지)
const PAGE_SIZE = 10;    // 페이지당 항목 수

// 과목 정규화 매핑
const SUBJECT_MAP = {
  '국어': '국어', '수학': '수학', '영어': '영어',
  '한국사': '한국사', '사회': '사회탐구', '사회탐구': '사회탐구',
  '과학': '과학탐구', '과학탐구': '과학탐구', '직업탐구': '직업탐구',
  '제2외국어': '제2외국어', '한문': '제2외국어',
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/** HTML fetch → cheerio $ */
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
  const html = await res.text();
  return load(html);
}

/** 등록일 문자열에서 시험 월 추출 (11=수능, 9=9월모평, 6=6월모평) */
function inferMonth(dateStr, title = '') {
  const m = dateStr.match(/\d{4}-(\d{2})-\d{2}/);
  if (!m) return 11;
  const month = parseInt(m[1]);
  // 11월 → 수능, 9월 → 9월모평, 6월 → 6월모평
  if ([11, 9, 6].includes(month)) return month;
  // 날짜로 불분명하면 제목에서 추정
  if (title.includes('9월')) return 9;
  if (title.includes('6월')) return 6;
  return 11;
}

/** 게시물 상세 페이지에서 파일 다운로드 링크 추출 */
async function extractFilesFromPost(postUrl) {
  try {
    const $ = await fetchPage(postUrl);
    const files = { pdf_url: null, answer_url: null };

    // href에 fileDown 포함된 모든 링크 탐색
    $('a[href*="fileDown"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      const fullUrl = href.startsWith('http') ? href : BASE_URL + href;

      if (text.includes('문제지') || text.match(/문제[^지]/) || text.endsWith('문제')) {
        files.pdf_url = fullUrl;
      } else if (text.includes('정답') || text.includes('답안')) {
        files.answer_url = fullUrl;
      }

      // 파일명으로도 판단 (문제지/정답 텍스트가 없을 때)
      if (!files.pdf_url && !files.answer_url) {
        const fnMatch = href.match(/[^/=]+\.pdf/i);
        const fn = fnMatch ? fnMatch[0].toLowerCase() : '';
        if (fn.includes('문제')) files.pdf_url = fullUrl;
        else if (fn.includes('정답') || fn.includes('answer')) files.answer_url = fullUrl;
      }
    });

    return files;
  } catch (e) {
    console.warn(`    ⚠️ 파일 링크 추출 실패: ${e.message}`);
    return { pdf_url: null, answer_url: null };
  }
}

/** 전체 크롤링 메인 */
async function crawl() {
  console.log('🚀 수능 기출문제 PDF 크롤링 시작\n');

  // 1페이지로 총 건수 파악
  const $first = await fetchPage(`${BASE_URL}${LIST_PATH}&page=1`);
  const totalText = $first('body').text().match(/전체\s*[\*\[]?(\d[\d,]+)[\*\]]?\s*건/);
  const total = totalText ? parseInt(totalText[1].replace(',', '')) : 180;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  console.log(`📊 총 ${total}건, ${totalPages}페이지\n`);

  const records = [];

  for (let page = 1; page <= totalPages; page++) {
    console.log(`📄 페이지 ${page}/${totalPages} 처리 중...`);
    const $page = await fetchPage(`${BASE_URL}${LIST_PATH}&page=${page}`);

    const rows = $page('table tbody tr');
    if (rows.length === 0) {
      console.log('   행 없음, 중단');
      break;
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows.eq(i);
      const cells = row.find('td');
      if (cells.length < 5) continue;

      // 컬럼: 번호 | 학년도 | 영역 | 제목 | 등록일 | 조회 | 파일
      const yearText  = cells.eq(1).text().trim();
      const subjectRaw = cells.eq(2).text().trim();
      const titleCell  = cells.eq(3);
      const dateText   = cells.eq(4).text().trim();

      const year = parseInt(yearText);
      if (isNaN(year) || year < 2005 || year > 2030) continue;

      const subject = SUBJECT_MAP[subjectRaw] || subjectRaw;
      const title = titleCell.text().trim();
      const month = inferMonth(dateText, title);

      // 게시물 링크
      let link = titleCell.find('a[href]').attr('href') || '';
      if (!link) {
        link = row.find('a[href*="boardSeq"]').attr('href') || '';
      }
      if (!link) continue;

      const postUrl = link.startsWith('http') ? link : BASE_URL + link;

      // boardSeq 추출
      const seqMatch = postUrl.match(/boardSeq=([^&]+)/);
      const boardSeq = seqMatch ? seqMatch[1] : null;

      console.log(`   📝 ${year}학년도 ${month}월 ${subject} (${dateText})`);

      const { pdf_url, answer_url } = await extractFilesFromPost(postUrl);
      if (pdf_url || answer_url) {
        records.push({ year, month, subject, pdf_url, answer_url, board_seq: boardSeq });
        console.log(`      ✅ 문제지: ${pdf_url ? '있음' : '없음'}, 정답: ${answer_url ? '있음' : '없음'}`);
      } else {
        console.log(`      ⚠️ 파일 없음 — 건너뜀`);
      }

      await sleep(DELAY_MS);
    }

    await sleep(DELAY_MS * 2);
  }

  // Supabase 저장
  console.log(`\n💾 총 ${records.length}개 → Supabase 저장 중...`);
  if (records.length === 0) {
    console.log('저장할 데이터가 없습니다.');
    return;
  }

  const { error } = await supabase
    .from('csat_pdfs')
    .upsert(records, { onConflict: 'year,month,subject' });

  if (error) {
    console.error('❌ DB 저장 오류:', error.message);
  } else {
    console.log(`✅ 완료! ${records.length}개 저장됨.`);
  }
}

crawl().catch(err => {
  console.error('❌ 크롤링 오류:', err);
  process.exit(1);
});
