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
import { unzipSync } from 'fflate';

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
  // 구 명칭 (2011 이전)
  '언어': '국어', '언어영역': '국어',
  '수리': '수학', '수리영역': '수학',
  '외국어': '영어', '외국어영역': '영어',
  // 사회/과학탐구
  '사회': '사회탐구', '사회탐구': '사회탐구', '사회탐구영역': '사회탐구',
  '과학': '과학탐구', '과학탐구': '과학탐구', '과학탐구영역': '과학탐구',
  // 직업탐구
  '직업탐구': '직업탐구', '직업탐구영역': '직업탐구',
  // 제2외국어/한문
  '제2외국어': '제2외국어', '제2외국어/한문': '제2외국어', '한문': '제2외국어',
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/** ZIP URL에서 PDF 파일명 목록 추출 */
async function getZipPdfList(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) research-crawler/1.0',
        'Referer': BASE_URL,
      },
    });
    if (!res.ok) return null;
    const buffer = new Uint8Array(await res.arrayBuffer());
    const entries = unzipSync(buffer);
    const pdfNames = Object.keys(entries)
      .filter(f => f.toLowerCase().endsWith('.pdf'))
      .map(f => (f.includes('/') ? f.split('/').pop() : f))
      .filter(Boolean)
      .sort();
    return pdfNames.length ? pdfNames : null;
  } catch (e) {
    console.warn(`    ⚠️  ZIP 파싱 실패: ${e.message}`);
    return null;
  }
}

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
    const result = { pdf_url: null, answer_url: null, zip_files: null, answer_zip_files: null };

    $('a[href*="fileDown"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      const full = href.startsWith('http') ? href : BASE_URL + href;
      const isZip = /\.zip$/i.test(text);

      if (text.includes('문제지') || text.endsWith('문제')) {
        if (!result.pdf_url) { result.pdf_url = full; result._pdfIsZip = isZip; }
      } else if (text.includes('정답') || text.includes('답안')) {
        if (!result.answer_url) { result.answer_url = full; result._ansIsZip = isZip; }
      } else if (!result.pdf_url) {
        result.pdf_url = full; result._pdfIsZip = isZip;
      }
    });

    // ZIP 파일이면 내부 PDF 목록 추출
    if (result.pdf_url && result._pdfIsZip) {
      console.log(`         📦 문제지 ZIP → 파일 목록 추출 중...`);
      result.zip_files = await getZipPdfList(result.pdf_url);
      if (result.zip_files) {
        console.log(`         📄 ${result.zip_files.length}개: ${result.zip_files.join(', ')}`);
      }
      await sleep(DELAY_MS);
    }
    if (result.answer_url && result._ansIsZip) {
      result.answer_zip_files = await getZipPdfList(result.answer_url);
      await sleep(DELAY_MS);
    }

    return {
      pdf_url:           result.pdf_url,
      answer_url:        result.answer_url,
      zip_files:         result.zip_files,
      answer_zip_files:  result.answer_zip_files,
    };
  } catch (e) {
    console.warn(`    ⚠️  파일 링크 추출 실패: ${e.message}`);
    return { pdf_url: null, answer_url: null, zip_files: null, answer_zip_files: null };
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

      // boardSeq: 첫 번째 컬럼(번호)에 DB ID가 직접 표시됨 (e.g. 5093801)
      const boardSeq = cells.eq(0).text().trim().replace(/,/g, '');
      if (!/^\d{5,}$/.test(boardSeq)) {
        console.log(`      ⚠️  [${year}학년도 ${subject}] boardSeq 없음 (값: "${boardSeq}"), 건너뜀`);
        continue;
      }

      const postUrl = `${BASE_URL}/boardCnts/view.do?boardID=${board.id}&boardSeq=${boardSeq}&lev=0&m=0403&s=suneung`;

      console.log(`      ✏️  ${year}학년도 ${month}월 ${subject} (${dateText})`);

      const { pdf_url, answer_url, zip_files, answer_zip_files } = await extractFilesFromPost(postUrl);
      if (pdf_url || answer_url) {
        records.push({ year, month, subject, pdf_url, answer_url, zip_files, answer_zip_files, board_seq: boardSeq });
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

  // (year, month, subject) 기준 중복 제거 — 나중 항목 우선
  const dedupMap = new Map();
  for (const r of allRecords) {
    dedupMap.set(`${r.year}-${r.month}-${r.subject}`, r);
  }
  const records = [...dedupMap.values()];
  console.log(`\n💾 총 ${allRecords.length}개 수집 → 중복 제거 후 ${records.length}개 → Supabase 저장 중...`);

  // 1개씩 upsert (배치 내 중복 불가 이슈 방지)
  let saved = 0, failed = 0;
  let zipColMissing = false; // zip 컬럼 누락 여부 감지

  for (const record of records) {
    const { error } = await supabase
      .from('csat_pdfs')
      .upsert(record, { onConflict: 'year,month,subject' });

    if (error) {
      const isZipColError = error.message.includes('zip_files') || error.message.includes('answer_zip_files');

      if (isZipColError) {
        // zip 컬럼 없음 → 기본 필드만 재시도
        if (!zipColMissing) {
          zipColMissing = true;
          console.warn('\n   ⚠️  zip_files / answer_zip_files 컬럼이 없습니다. 기본 필드만 저장합니다.');
          console.warn('   👉 Supabase SQL Editor에서 아래 명령을 실행하세요:');
          console.warn('      ALTER TABLE public.csat_pdfs ADD COLUMN IF NOT EXISTS zip_files JSONB;');
          console.warn('      ALTER TABLE public.csat_pdfs ADD COLUMN IF NOT EXISTS answer_zip_files JSONB;\n');
        }
        const { zip_files, answer_zip_files, ...baseRecord } = record;
        const { error: fallbackError } = await supabase
          .from('csat_pdfs')
          .upsert(baseRecord, { onConflict: 'year,month,subject' });
        if (fallbackError) {
          console.error(`   ❌ ${record.year}년 ${record.month}월 ${record.subject} 저장 오류:`, fallbackError.message);
          failed++;
        } else {
          saved++;
        }
      } else {
        console.error(`   ❌ ${record.year}년 ${record.month}월 ${record.subject} 저장 오류:`, error.message);
        failed++;
      }
    } else {
      saved++;
    }
  }
  console.log(`   ✅ ${saved}개 저장 완료${failed ? ` / ❌ ${failed}개 실패` : ''}${zipColMissing ? ' (zip 컬럼 없어 기본 정보만 저장됨)' : ''}`);

  console.log('\n🎉 크롤링 완료!');
}

main().catch(err => { console.error('❌ 오류:', err); process.exit(1); });
