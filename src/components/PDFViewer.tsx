"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Scissors, CheckCircle, ZoomIn, ZoomOut, AlertTriangle } from 'lucide-react';

const SUBJECTS = ['기타', '국어', '수학', '영어', '사회', '과학'];

const SUBJECT_API_MAP: Record<string, string> = {
  '국어': '국어', '수학': '수학', '영어': '영어',
  '한국사': '기타', '사회탐구': '사회', '과학탐구': '과학',
  '직업탐구': '기타', '제2외국어': '기타',
};

type Point = { x: number; y: number };

interface PDFViewerProps {
  src: string;
  defaultSubject?: string; // CSAT 과목 (국어, 사회탐구 등)
}

export default function PDFViewer({ src, defaultSubject = '기타' }: PDFViewerProps) {
  const router = useRouter();

  // DOM refs
  const scrollRef  = useRef<HTMLDivElement>(null); // overflow:auto 스크롤 컨테이너
  const pagesRef   = useRef<HTMLDivElement>(null); // 페이지 캔버스들이 담긴 컨테이너
  const overlayRef = useRef<HTMLDivElement>(null); // 선택 모드 오버레이
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfDocRef  = useRef<any>(null);            // PDF.js document 객체
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  // PDF 상태
  const [numPages,      setNumPages]      = useState(0);
  const [renderedPages, setRenderedPages] = useState(0);
  const [scale,         setScale]         = useState(1.5);
  const [isLoading,     setIsLoading]     = useState(true);
  const [loadError,     setLoadError]     = useState<string | null>(null);

  // 선택 상태
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isSelecting,  setIsSelecting]  = useState(false);
  const [selStart,     setSelStart]     = useState<Point | null>(null);
  const [selEnd,       setSelEnd]       = useState<Point | null>(null);

  // 분석 상태
  const [subject,      setSubject]      = useState(SUBJECT_API_MAP[defaultSubject] ?? '기타');
  const [isAnalyzing,  setIsAnalyzing]  = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // defaultSubject 변경 시 과목 동기화
  useEffect(() => {
    setSubject(SUBJECT_API_MAP[defaultSubject] ?? '기타');
  }, [defaultSubject]);

  // ── Phase 1: PDF 문서 로드 ───────────────────────────────────
  useEffect(() => {
    if (!src) return;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      setNumPages(0);
      setRenderedPages(0);
      pdfDocRef.current = null;
      canvasRefs.current = [];

      try {
        const pdfjsLib = await import('pdfjs-dist');
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc =
            `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        }
        const pdf = await pdfjsLib.getDocument(src).promise;
        if (cancelled) return;

        pdfDocRef.current = pdf;
        canvasRefs.current = new Array(pdf.numPages).fill(null);
        setNumPages(pdf.numPages);
        setIsLoading(false);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'PDF 로드 실패');
          setIsLoading(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [src]);

  // ── Phase 2: 페이지 렌더링 (캔버스 DOM 생성 후) ─────────────
  useEffect(() => {
    const pdf = pdfDocRef.current;
    if (!pdf || numPages === 0) return;
    let cancelled = false;

    const renderAll = async () => {
      for (let i = 1; i <= numPages; i++) {
        if (cancelled) break;
        const canvas = canvasRefs.current[i - 1];
        if (!canvas) continue;
        try {
          const page     = await pdf.getPage(i);
          const viewport = page.getViewport({ scale });
          canvas.width  = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d')!;
          await page.render({ canvasContext: ctx, viewport }).promise;
          if (!cancelled) setRenderedPages(i);
        } catch { /* 개별 페이지 오류 무시 */ }
      }
    };

    renderAll();
    return () => { cancelled = true; };
  }, [numPages, scale]);

  // ── 마우스 포인터 → pagesRef 기준 좌표 변환 ─────────────────
  const getPos = useCallback((clientX: number, clientY: number): Point => {
    const pr = pagesRef.current!.getBoundingClientRect();
    return { x: clientX - pr.left, y: clientY - pr.top };
  }, []);

  // ── 마우스 선택 핸들러 ───────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isSelectMode) return;
    e.preventDefault();
    const p = getPos(e.clientX, e.clientY);
    setSelStart(p); setSelEnd(p); setIsSelecting(true); setAnalyzeError(null);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelectMode || !isSelecting) return;
    setSelEnd(getPos(e.clientX, e.clientY));
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isSelecting) return;
    setSelEnd(getPos(e.clientX, e.clientY));
    setIsSelecting(false);
  };

  // 창 밖으로 마우스가 나갔을 때 선택 완료
  useEffect(() => {
    if (!isSelecting) return;
    const up = (e: MouseEvent) => {
      const pr = pagesRef.current?.getBoundingClientRect();
      if (!pr) return;
      setSelEnd({ x: e.clientX - pr.left, y: e.clientY - pr.top });
      setIsSelecting(false);
    };
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, [isSelecting]);

  // ── 터치 선택 (non-passive: 스크롤 방지) ────────────────────
  useEffect(() => {
    const el = overlayRef.current;
    if (!el || !isSelectMode) return;

    const pr = () => pagesRef.current!.getBoundingClientRect();

    const onStart = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      const rect = pr();
      const p = { x: t.clientX - rect.left, y: t.clientY - rect.top };
      setSelStart(p); setSelEnd(p); setIsSelecting(true); setAnalyzeError(null);
    };
    const onMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      const rect = pr();
      setSelEnd({ x: t.clientX - rect.left, y: t.clientY - rect.top });
    };
    const onEnd = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      const rect = pr();
      setSelEnd({ x: t.clientX - rect.left, y: t.clientY - rect.top });
      setIsSelecting(false);
    };

    el.addEventListener('touchstart', onStart, { passive: false });
    el.addEventListener('touchmove',  onMove,  { passive: false });
    el.addEventListener('touchend',   onEnd,   { passive: false });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove',  onMove);
      el.removeEventListener('touchend',   onEnd);
    };
  }, [isSelectMode]);

  // ── 선택 영역을 캔버스에서 캡처 ─────────────────────────────
  const capture = useCallback((): string | null => {
    if (!selStart || !selEnd || !pagesRef.current) return null;

    const x = Math.min(selStart.x, selEnd.x);
    const y = Math.min(selStart.y, selEnd.y);
    const w = Math.abs(selEnd.x - selStart.x);
    const h = Math.abs(selEnd.y - selStart.y);
    if (w < 20 || h < 20) return null;

    const pagesRect = pagesRef.current.getBoundingClientRect();
    const out = document.createElement('canvas');
    out.width  = Math.round(w);
    out.height = Math.round(h);
    const ctx = out.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);

    canvasRefs.current.forEach(canvas => {
      if (!canvas) return;
      const cr  = canvas.getBoundingClientRect();
      const cl  = cr.left - pagesRect.left; // 캔버스 좌측 오프셋
      const ct  = cr.top  - pagesRect.top;  // 캔버스 상단 오프셋

      // 선택 영역과 캔버스의 겹치는 부분
      const ox  = Math.max(x, cl);
      const oy  = Math.max(y, ct);
      const ox2 = Math.min(x + w, cl + cr.width);
      const oy2 = Math.min(y + h, ct + cr.height);
      if (ox >= ox2 || oy >= oy2) return;

      // 캔버스 내부 픽셀 좌표 (CSS px → canvas px 변환)
      const scX = canvas.width  / cr.width;
      const scY = canvas.height / cr.height;
      ctx.drawImage(
        canvas,
        (ox - cl) * scX, (oy - ct) * scY, (ox2 - ox) * scX, (oy2 - oy) * scY,
        ox - x,          oy - y,          ox2 - ox,          oy2 - oy,
      );
    });

    return out.toDataURL('image/jpeg', 0.92);
  }, [selStart, selEnd]);

  // ── AI 분석 후 히스토리 저장 ─────────────────────────────────
  const handleAnalyze = async () => {
    const dataUrl = capture();
    if (!dataUrl) return;
    setIsAnalyzing(true);
    setAnalyzeError(null);

    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const form = new FormData();
      form.append('file', file);
      form.append('subject', subject);

      const res  = await fetch('/api/process-image', { method: 'POST', body: form });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || '분석 실패');

      const id = data.data.questionId || Date.now().toString();
      localStorage.setItem(`processedResult_${id}`, JSON.stringify({
        id, questionId: data.data.questionId,
        originalImage: dataUrl, fileName: file.name,
        ocrText: data.data.ocrText, formattedProblem: data.data.formattedProblem,
        explanation: data.data.explanation, subject: data.data.subject,
        score: data.data.score ?? null, problemNumber: data.data.problemNumber ?? null,
        problemArea: data.data.problemArea ?? '', timestamp: new Date().toISOString(),
        confidence: 95,
      }));
      router.push(`/new-question/${id}`);
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : '오류가 발생했습니다');
      setIsAnalyzing(false);
    }
  };

  const toggleSelect = () => {
    setIsSelectMode(m => !m);
    setSelStart(null); setSelEnd(null); setIsSelecting(false);
  };

  const selRect = selStart && selEnd ? {
    left:   Math.min(selStart.x, selEnd.x),
    top:    Math.min(selStart.y, selEnd.y),
    width:  Math.abs(selEnd.x - selStart.x),
    height: Math.abs(selEnd.y - selStart.y),
  } : null;

  const hasSelection = !isSelecting && selRect && selRect.width > 20 && selRect.height > 20;

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">

      {/* ── 툴바 ── */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-wrap">

        {/* 줌 컨트롤 */}
        <button
          onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-center tabular-nums">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale(s => Math.min(3, s + 0.25))}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />

        {/* 문제 선택 저장 버튼 */}
        <button
          onClick={toggleSelect}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isSelectMode
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          {isSelectMode ? '선택 취소' : '문제 선택 저장'}
        </button>

        {/* 과목 선택 (선택 모드일 때만) */}
        {isSelectMode && (
          <select
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}

        {/* 저장 & 분석 버튼 (선택 완료 후) */}
        {hasSelection && (
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold disabled:opacity-60 transition-colors ml-auto"
          >
            {isAnalyzing
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />분석 중...</>
              : <><CheckCircle className="w-3.5 h-3.5" />저장 &amp; 분석</>
            }
          </button>
        )}

        {analyzeError && (
          <p className="text-xs text-red-500 ml-auto">{analyzeError}</p>
        )}

        {/* 렌더링 진행 표시 */}
        {!isLoading && !loadError && renderedPages < numPages && (
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
            {renderedPages}/{numPages}p 렌더링 중
          </span>
        )}
      </div>

      {/* ── PDF 뷰어 ── */}
      <div
        ref={scrollRef}
        className="overflow-auto bg-gray-300 dark:bg-gray-950"
        style={{ height: '80vh' }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-7 h-7 text-blue-600 animate-spin mr-3" />
            <span className="text-gray-600 dark:text-gray-300 text-sm">PDF 불러오는 중...</span>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
            <AlertTriangle className="w-10 h-10 text-yellow-500" />
            <p className="text-gray-600 dark:text-gray-300 text-sm text-center">{loadError}</p>
          </div>
        ) : (
          /* 페이지 컨테이너 */
          <div ref={pagesRef} className="relative py-4">

            {/* 페이지별 캔버스 */}
            {Array.from({ length: numPages }, (_, i) => (
              <div key={i} className="flex justify-center mb-3">
                <canvas
                  ref={el => { canvasRefs.current[i] = el; }}
                  className="shadow-lg bg-white"
                  style={{ maxWidth: '100%' }}
                />
              </div>
            ))}

            {/* 선택 모드 오버레이 */}
            {isSelectMode && (
              <div
                ref={overlayRef}
                className="absolute inset-0"
                style={{ cursor: 'crosshair', userSelect: 'none', WebkitUserSelect: 'none' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                {/* 안내 메시지 (선택 전) */}
                {!selRect && (
                  <div className="sticky top-4 flex justify-center pointer-events-none">
                    <div className="bg-blue-600/90 backdrop-blur-sm text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg">
                      드래그하여 문제 영역을 선택하세요
                    </div>
                  </div>
                )}

                {/* 선택 사각형 + 주변 어둡게 */}
                {selRect && (
                  <div
                    className="absolute pointer-events-none border-2 border-blue-400"
                    style={{
                      left: selRect.left,
                      top: selRect.top,
                      width: selRect.width,
                      height: selRect.height,
                      boxShadow: '0 0 0 99999px rgba(0, 0, 0, 0.45)',
                    }}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
