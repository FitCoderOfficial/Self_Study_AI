import { NextRequest, NextResponse } from 'next/server';
import { unzipSync } from 'fflate';

const ALLOWED_HOST = 'www.suneung.re.kr';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const file = request.nextUrl.searchParams.get('file'); // ZIP 내부 파일명 (선택과목)
  const list = request.nextUrl.searchParams.get('list'); // 'true'면 ZIP 파일 목록 JSON 반환

  if (!url) return new NextResponse('Missing url', { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse('Invalid url', { status: 400 });
  }
  if (parsed.hostname !== ALLOWED_HOST) {
    return new NextResponse('Forbidden host', { status: 403 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://www.suneung.re.kr',
        'Accept': 'application/pdf,application/zip,*/*',
      },
    });

    if (!res.ok) {
      return new NextResponse(`Upstream error: ${res.status}`, { status: 502 });
    }

    // ZIP 파일 목록 반환 모드 (?list=true)
    // URL이 .zip으로 끝나지 않아도 매직 바이트(PK)로 ZIP 여부를 감지
    if (list === 'true') {
      const buffer = new Uint8Array(await res.arrayBuffer());
      // ZIP 매직 바이트: 0x50 0x4B (PK header)
      const isZip = buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4B;
      if (!isZip) {
        // PDF 또는 기타 파일 → 선택과목 없음
        return NextResponse.json({ files: [] });
      }
      const entries = unzipSync(buffer);
      const pdfFiles = Object.keys(entries)
        .filter(f => f.toLowerCase().endsWith('.pdf'))
        .map(f => f.split(/[/\\]/).pop() || f)
        .filter(Boolean)
        .sort();
      return NextResponse.json({ files: pdfFiles });
    }

    // ZIP에서 특정 파일 추출 (?file=파일명)
    if (file) {
      const buffer = new Uint8Array(await res.arrayBuffer());
      const entries = unzipSync(buffer);

      // searchParams.get() 이 이미 URL 디코딩하므로 추가 decodeURIComponent 불필요
      const target = file;
      const targetLower = target.toLowerCase();

      const key = Object.keys(entries).find(k => {
        // basename만 추출 (/ 또는 \ 구분자)
        const kBase = (k.split(/[/\\]/).pop() || k).toLowerCase();
        return (
          k === target ||
          k.toLowerCase() === targetLower ||
          k.toLowerCase().endsWith('/' + targetLower) ||
          k.toLowerCase().endsWith('\\' + targetLower) ||
          kBase === targetLower
        );
      });

      if (!key) {
        return new NextResponse(`File "${target}" not found in ZIP`, { status: 404 });
      }

      return new NextResponse(Buffer.from(entries[key]), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // 일반 PDF 스트리밍
    return new NextResponse(res.body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new NextResponse(`Proxy error: ${msg}`, { status: 502 });
  }
}
