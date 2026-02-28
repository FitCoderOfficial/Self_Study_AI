"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import PDFViewer from '@/components/PDFViewer';
import {
  GraduationCap, Loader2, Download, FileText, AlertTriangle, RefreshCw,
} from 'lucide-react';

interface CsatPdf {
  year: number;
  month: number;
  subject: string;
  pdf_url: string | null;
  answer_url: string | null;
  zip_files: string[] | null;
  answer_zip_files: string[] | null;
}

const YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017];
const MONTHS: { label: string; value: number }[] = [
  { label: '수능 (11월)', value: 11 },
  { label: '9월 모의평가', value: 9 },
  { label: '6월 모의평가', value: 6 },
];

// 수능 시험 영역 구조 (표시 그룹)
const SUBJECT_GROUPS = [
  { label: '공통 영역', subjects: ['국어', '수학', '영어', '한국사'] },
  { label: '탐구 영역', subjects: ['사회탐구', '과학탐구', '직업탐구'] },
  { label: '제2외국어/한문', subjects: ['제2외국어'] },
] as const;

const SUBJECT_ORDER = ['국어', '수학', '영어', '한국사', '사회탐구', '과학탐구', '직업탐구', '제2외국어'];
function sortSubjects(pdfs: CsatPdf[]) {
  return [...pdfs].sort((a, b) => {
    const ai = SUBJECT_ORDER.indexOf(a.subject);
    const bi = SUBJECT_ORDER.indexOf(b.subject);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

// 선택과목 파일명 → 표시명 매핑
const SUBJECT_DISPLAY_MAP: [RegExp | string, string][] = [
  // 국어 선택과목 (2022 개정 수능)
  ['화법과작문', '화법과작문'],
  ['언어와매체', '언어와매체'],
  // 수학 선택과목 (2022 개정 수능)
  ['확률과통계', '확률과통계'],
  ['미적분', '미적분'],
  ['기하', '기하'],
  // 사회탐구
  ['생활과윤리', '생활과윤리'],
  ['윤리와사상', '윤리와사상'],
  ['한국지리', '한국지리'],
  ['세계지리', '세계지리'],
  ['동아시아사', '동아시아사'],
  ['세계사', '세계사'],
  ['상업경제', '상업경제'],  // '경제' 보다 먼저
  ['정치와법', '정치와법'],
  ['사회문화', '사회문화'],
  ['경제', '경제'],
  // 과학탐구 (Ⅱ 먼저 — Ⅰ과 중복 방지)
  [/물리(학)?[Ⅱ2]/, '물리학Ⅱ'],
  [/물리(학)?[Ⅰ1]/, '물리학Ⅰ'],
  [/화학[Ⅱ2]/, '화학Ⅱ'],
  [/화학[Ⅰ1]/, '화학Ⅰ'],
  [/생명과학[Ⅱ2]/, '생명과학Ⅱ'],
  [/생명과학[Ⅰ1]/, '생명과학Ⅰ'],
  [/지구과학[Ⅱ2]/, '지구과학Ⅱ'],
  [/지구과학[Ⅰ1]/, '지구과학Ⅰ'],
  // 직업탐구
  ['농업기초기술', '농업기초기술'],
  ['공업일반', '공업일반'],
  [/수산.?해운/, '수산·해운산업기초'],
  ['인간발달', '인간발달'],
  // 제2외국어/한문
  ['독일어', '독일어Ⅰ'],
  ['프랑스어', '프랑스어Ⅰ'],
  ['스페인어', '스페인어Ⅰ'],
  ['중국어', '중국어Ⅰ'],
  ['일본어', '일본어Ⅰ'],
  ['러시아어', '러시아어Ⅰ'],
  ['아랍어', '아랍어Ⅰ'],
  ['베트남어', '베트남어Ⅰ'],
  [/한문/, '한문Ⅰ'],
];

function getDisplayName(filename: string): string {
  const base = filename
    .replace(/\.pdf$/i, '')
    .replace(/[_\s]*(문제지|정답표|정답|답안)\s*$/i, '');

  for (const [pattern, name] of SUBJECT_DISPLAY_MAP) {
    if (typeof pattern === 'string' ? base.includes(pattern) : pattern.test(base)) {
      return name;
    }
  }

  const cleaned = base
    .replace(/^\d{4}[_\s]*(학년도)?[_\s]*/g, '')
    .replace(/^(사회탐구|과학탐구|직업탐구|제2외국어|한문|사탐|과탐|직탐)[_\s]*/g, '')
    .replace(/^[_\s]+|[_\s]+$/g, '');
  return cleaned || base;
}

function getSubOptionLabel(subject: string): string {
  if (subject === '국어') return '선택과목';
  if (subject === '수학') return '선택과목';
  if (subject === '사회탐구') return '사회탐구 선택과목';
  if (subject === '과학탐구') return '과학탐구 선택과목';
  if (subject === '직업탐구') return '직업탐구 선택과목';
  if (subject === '제2외국어') return '제2외국어/한문 선택과목';
  return '선택과목';
}

export default function CsatPage() {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(11);

  const [pdfs, setPdfs] = useState<CsatPdf[]>([]);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [selectedPdfSubject, setSelectedPdfSubject] = useState<string | null>(null);
  const [pdfType, setPdfType] = useState<'problem' | 'answer'>('problem');
  const [selectedZipFile, setSelectedZipFile] = useState<string | null>(null);

  // ZIP 파일 목록 동적 조회 (DB zip_files 없을 때 폴백)
  const [zipFetchedFiles, setZipFetchedFiles] = useState<Record<string, string[]>>({});
  const [isFetchingZipList, setIsFetchingZipList] = useState(false);
  const fetchedZipUrls = useRef<Set<string>>(new Set());

  const fetchPdfs = useCallback(async () => {
    setIsPdfLoading(true);
    setPdfError(null);
    try {
      const params = new URLSearchParams({
        year: selectedYear.toString(),
        month: selectedMonth.toString(),
      });
      const res = await fetch(`/api/csat/pdfs?${params}`);
      const data = await res.json();
      if (data.success) {
        setPdfs(data.pdfs);
      } else {
        setPdfError(data.error || '데이터를 불러오지 못했습니다.');
      }
    } catch {
      setPdfError('서버 연결 오류');
    } finally {
      setIsPdfLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => { fetchPdfs(); }, [fetchPdfs]);

  useEffect(() => {
    if (pdfs.length > 0) {
      setSelectedPdfSubject(sortSubjects(pdfs)[0].subject);
      setPdfType('problem');
      setSelectedZipFile(null);
    } else {
      setSelectedPdfSubject(null);
    }
  }, [pdfs]);

  useEffect(() => {
    setSelectedZipFile(null);
  }, [selectedPdfSubject, pdfType]);

  // ── 파생 값 ───────────────────────────────────────────────────
  const sorted = useMemo(() => sortSubjects(pdfs), [pdfs]);

  const current = useMemo(
    () => (sorted.length > 0 ? sorted.find(p => p.subject === selectedPdfSubject) ?? sorted[0] : null),
    [sorted, selectedPdfSubject]
  );

  const viewUrl    = pdfType === 'problem' ? (current?.pdf_url    ?? null) : (current?.answer_url       ?? null);
  const dbZipFiles = pdfType === 'problem' ? (current?.zip_files  ?? null) : (current?.answer_zip_files ?? null);
  const zipFiles   = dbZipFiles ?? (viewUrl ? (zipFetchedFiles[viewUrl] ?? null) : null);
  const isZip      = Array.isArray(zipFiles) && zipFiles.length > 0;
  // zipFiles가 빈 배열 = 프로브 완료, ZIP 아님(PDF 직접 스트리밍 가능)
  const isKnownPdf = Array.isArray(zipFiles) && zipFiles.length === 0 && dbZipFiles === null;

  const activeZipFile = isZip
    ? (selectedZipFile && zipFiles!.includes(selectedZipFile) ? selectedZipFile : zipFiles![0])
    : null;

  const proxyUrl = viewUrl
    ? isZip && activeZipFile
      ? `/api/csat/pdf-proxy?url=${encodeURIComponent(viewUrl)}&file=${encodeURIComponent(activeZipFile)}`
      : (dbZipFiles !== null && !isZip) || isKnownPdf
        ? `/api/csat/pdf-proxy?url=${encodeURIComponent(viewUrl)}` // PDF 직접 스트리밍
        : null  // 아직 로딩 중 or ZIP 선택 대기
    : null;

  // viewUrl이 바뀌면 프로브 실행 — URL 끝이 .zip이 아니어도 항상 실행
  // 프록시가 매직 바이트로 ZIP/PDF를 구분해서 { files: [...] } 반환
  useEffect(() => {
    if (!viewUrl) return;
    if (dbZipFiles !== null) return; // DB에 데이터 있으면 프로브 불필요
    if (fetchedZipUrls.current.has(viewUrl)) return; // 이미 프로브 완료

    fetchedZipUrls.current.add(viewUrl);
    setIsFetchingZipList(true);

    fetch(`/api/csat/pdf-proxy?url=${encodeURIComponent(viewUrl)}&list=true`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.files)) {
          setZipFetchedFiles(prev => ({ ...prev, [viewUrl]: data.files }));
        }
      })
      .catch(() => {
        setZipFetchedFiles(prev => ({ ...prev, [viewUrl]: [] }));
      })
      .finally(() => setIsFetchingZipList(false));
  }, [viewUrl, dbZipFiles]);

  const selectClass = "px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer";

  // 현재 선택 과목에 선택과목(zip)이 있는지
  const hasSubOptions = isZip;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium mb-4">
            <GraduationCap className="w-4 h-4 mr-2" />
            수능 기출 시험지
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            수능 기출 시험지 보기
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            역대 수능 · 모의평가 기출 시험지를 영역별로 바로 확인하세요
          </p>
        </div>

        {/* 필터 카드 */}
        <Card className="mb-6 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-5 pb-5">
            {/* 연도 + 시험 선택 */}
            <div className="flex flex-wrap items-center gap-4 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">연도</label>
                <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className={selectClass}>
                  {YEARS.map(y => <option key={y} value={y}>{y}년</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">시험</label>
                <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className={selectClass}>
                  {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>

            {/* 수능 영역 구조별 과목 버튼 */}
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">영역 선택</p>
              {isPdfLoading ? (
                <div className="flex gap-1.5">
                  {['국어', '수학', '영어', '한국사'].map(s => (
                    <div key={s} className="h-8 w-16 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  ))}
                </div>
              ) : sorted.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {SUBJECT_GROUPS.map(group => {
                    const groupPdfs = sorted.filter(p => (group.subjects as readonly string[]).includes(p.subject));
                    if (groupPdfs.length === 0) return null;
                    return (
                      <div key={group.label} className="flex flex-wrap items-start gap-3">
                        {/* 그룹 레이블 */}
                        <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide pt-1.5 w-[78px] shrink-0">
                          {group.label}
                        </span>
                        {/* 과목 버튼들 */}
                        <div className="flex gap-1.5 flex-wrap">
                          {groupPdfs.map(pdf => {
                            const isActive = selectedPdfSubject === pdf.subject;
                            const zipCount = pdf.zip_files?.length ?? 0;
                            return (
                              <button
                                key={pdf.subject}
                                onClick={() => { setSelectedPdfSubject(pdf.subject); setPdfType('problem'); }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                  isActive
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                              >
                                {pdf.subject}
                                {zipCount > 0 && (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                                    isActive
                                      ? 'bg-white/20 text-white'
                                      : 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400'
                                  }`}>
                                    {zipCount}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span className="text-xs text-gray-400 dark:text-gray-500">연도·시험을 선택하면 영역이 표시됩니다</span>
              )}
            </div>

            {/* ── 선택과목 태그 (필터 카드 내부) ── */}
            {!isPdfLoading && sorted.length > 0 && (isFetchingZipList || hasSubOptions) && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {isFetchingZipList ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    선택과목 목록 불러오는 중...
                  </div>
                ) : isZip && (
                  <>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2.5">
                      {current ? getSubOptionLabel(current.subject) : '선택과목'}
                      <span className="font-normal text-gray-400 dark:text-gray-500 ml-1.5">({zipFiles!.length}개)</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {zipFiles!.map(f => (
                        <button
                          key={f}
                          onClick={() => setSelectedZipFile(f)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            activeZipFile === f
                              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-200 dark:ring-blue-800'
                              : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
                          }`}
                        >
                          {getDisplayName(f)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 로딩 */}
        {isPdfLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mr-3" />
            <span className="text-gray-600 dark:text-gray-300">시험지 목록 불러오는 중...</span>
          </div>
        )}

        {/* 에러 */}
        {!isPdfLoading && pdfError && (
          <Card className="dark:bg-gray-800 dark:border-gray-700 text-center py-10">
            <CardContent>
              <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
              <p className="text-gray-700 dark:text-gray-200 font-medium mb-1">데이터를 불러올 수 없습니다</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{pdfError}</p>
            </CardContent>
          </Card>
        )}

        {/* 데이터 없을 때 */}
        {!isPdfLoading && !pdfError && pdfs.length === 0 && (
          <Card className="dark:bg-gray-800 dark:border-gray-700 text-center py-16">
            <CardContent>
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 dark:text-gray-200 text-lg font-medium mb-2">크롤링 데이터가 없습니다</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
                아래 명령어로 suneung.re.kr의 기출 PDF 링크를 수집하세요.
              </p>
              <div className="bg-gray-900 dark:bg-gray-950 text-green-400 font-mono text-sm px-5 py-3 rounded-lg inline-block">
                npm run crawl
              </div>
            </CardContent>
          </Card>
        )}

        {/* PDF 뷰어 */}
        {!isPdfLoading && !pdfError && pdfs.length > 0 && (
          <div className="space-y-3">
            {/* 문제지 / 정답표 토글 + 새로고침 + 다운로드 */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-0.5">
                <button
                  onClick={() => setPdfType('problem')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    pdfType === 'problem'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  문제지
                </button>
                {current?.answer_url && (
                  <button
                    onClick={() => setPdfType('answer')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                      pdfType === 'answer'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    정답표
                  </button>
                )}
              </div>

              <button
                onClick={fetchPdfs}
                disabled={isPdfLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                새로고침
              </button>

              {viewUrl && (
                <a
                  href={viewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  다운로드
                </a>
              )}
            </div>

            {/* PDF 뷰어 (PDF.js 캔버스 렌더링 + 드래그 선택) */}
            {proxyUrl ? (
              <PDFViewer
                key={proxyUrl}
                src={proxyUrl}
                defaultSubject={selectedPdfSubject ?? '기타'}
              />
            ) : !isFetchingZipList && (
              <Card className="dark:bg-gray-800 dark:border-gray-700 text-center py-10">
                <CardContent>
                  <FileText className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {zipFiles !== null && zipFiles.length === 0
                      ? 'ZIP 파일에서 PDF를 찾을 수 없습니다'
                      : `${pdfType === 'problem' ? '문제지' : '정답표'} PDF가 없습니다`}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
