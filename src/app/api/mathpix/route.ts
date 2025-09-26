import { NextRequest, NextResponse } from 'next/server';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 환경변수 수동 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 없습니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 체크 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: '파일 크기는 10MB를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 이미지 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: '이미지 파일만 업로드 가능합니다.' },
        { status: 400 }
      );
    }

    // 환경변수 재로드 시도
    console.log('=== 환경변수 디버깅 시작 ===');
    console.log('현재 작업 디렉토리:', process.cwd());
    
    // .env.local 파일 존재 확인
    const fs = require('fs');
    const envPath = path.resolve(process.cwd(), '.env.local');
    const hasEnvFile = fs.existsSync(envPath);
    console.log('.env.local 파일 경로:', envPath);
    console.log('.env.local 파일 존재:', hasEnvFile);
    
    if (hasEnvFile) {
      try {
        // UTF-16으로 파일 읽기 시도
        console.log('UTF-16 인코딩으로 파일 읽기 시도...');
        const envContent = fs.readFileSync(envPath, 'utf16le');
        console.log('UTF-16 파일 내용 성공적으로 읽음');
        
        // 수동으로 환경변수 파싱
        const lines = envContent.split('\n');
        let manualAppId = '';
        let manualAppKey = '';
        
        console.log('UTF-16 파싱 시작:');
        lines.forEach((line, index) => {
          const trimmedLine = line.trim();
          if (trimmedLine && !trimmedLine.startsWith('#')) {
            console.log(`라인 ${index + 1}: "${trimmedLine}"`);
            const equalIndex = trimmedLine.indexOf('=');
            if (equalIndex > 0) {
              const key = trimmedLine.substring(0, equalIndex).trim();
              const value = trimmedLine.substring(equalIndex + 1).trim();
              console.log(`파싱된 키: "${key}", 값: "${value.substring(0, 10)}..."`);
              
              if (key === 'MATHPIX_APP_ID') {
                manualAppId = value;
                console.log('MATHPIX_APP_ID 설정됨');
              } else if (key === 'MATHPIX_APP_KEY') {
                manualAppKey = value;
                console.log('MATHPIX_APP_KEY 설정됨');
              }
            }
          }
        });
        
        console.log('UTF-16 파싱 결과:');
        console.log('manualAppId:', manualAppId ? `${manualAppId.substring(0, 8)}...` : 'undefined');
        console.log('manualAppKey:', manualAppKey ? `${manualAppKey.substring(0, 8)}...` : 'undefined');
        
        // 수동 파싱된 값이 있으면 사용
        if (manualAppId && manualAppKey) {
          console.log('UTF-16 파싱된 값으로 환경변수 설정');
          process.env.MATHPIX_APP_ID = manualAppId;
          process.env.MATHPIX_APP_KEY = manualAppKey;
        }
        
      } catch (error) {
        console.error('.env.local 파일 읽기 오류:', error);
      }
    }

    // 환경변수에서 Mathpix API 설정 가져오기
    let appId = process.env.MATHPIX_APP_ID;
    let appKey = process.env.MATHPIX_APP_KEY;
    
    console.log('초기 환경변수 로드:');
    console.log('MATHPIX_APP_ID:', appId ? `${appId.substring(0, 8)}...` : 'undefined');
    console.log('MATHPIX_APP_KEY:', appKey ? `${appKey.substring(0, 8)}...` : 'undefined');
    
    // 환경변수가 없으면 다시 로드 시도
    if (!appId || !appKey) {
      console.log('환경변수 재로드 시도...');
      dotenv.config({ path: envPath, override: true });
      appId = process.env.MATHPIX_APP_ID;
      appKey = process.env.MATHPIX_APP_KEY;
      console.log('재로드 후:');
      console.log('MATHPIX_APP_ID:', appId ? `${appId.substring(0, 8)}...` : 'undefined');
      console.log('MATHPIX_APP_KEY:', appKey ? `${appKey.substring(0, 8)}...` : 'undefined');
    }
    
    console.log('=== 환경변수 디버깅 끝 ===');

    // 디버깅: 환경변수 로드 상태 확인
    console.log('환경변수 확인:');
    console.log('MATHPIX_APP_ID 존재 여부:', !!appId);
    console.log('MATHPIX_APP_KEY 존재 여부:', !!appKey);
    console.log('MATHPIX_APP_ID 값:', appId ? appId.substring(0, 8) + '...' : 'undefined');
    console.log('MATHPIX_APP_KEY 값:', appKey ? appKey.substring(0, 8) + '...' : 'undefined');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('전체 환경변수 개수:', Object.keys(process.env).length);

    if (!appId || !appKey) {
      console.log('Mathpix API 환경변수가 설정되지 않음. Mock 데이터를 반환합니다.');
      console.log('설정하려면 .env.local 파일에 MATHPIX_APP_ID와 MATHPIX_APP_KEY를 추가하세요.');
      
      // 개발 중에는 mock 데이터 반환
      return NextResponse.json({
        success: true,
        data: {
          processedText: "28. 직육공간에 AB̄=8, BC̄=6, ∠ABC=π/2 인 직각삼각형 ABC 와 선분 AC 를 지름으로 하는 구 S 가 있다.<br><br>직선 AB 를 포함하고 평면 ABC 에 수직인 평면이 구 S 와 만나서 생기는 원을 O 라 하자.<br><br>원 O 위의 점 중에서 직선 AC 까지의 거리가 4 인 서로 다른 두 점을 P, Q 라 할 때, 선분 PQ 의 길이는?<br><br><strong>[4점]</strong><br><br>(1) √(43)<br><br>(2) √(47)<br><br>(3) √(51)<br><br>(4) √(55)<br><br>(5) √(59)"
        }
      });
    }

    // 파일을 base64로 변환
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    console.log('Mathpix API 호출 시작...');
    
    // Mathpix API 호출
    const mathpixResponse = await fetch('https://api.mathpix.com/v3/text', {
      method: 'POST',
      headers: {
        'app_id': appId,
        'app_key': appKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        src: `data:${file.type};base64,${base64}`,
        formats: ['text', 'latex_simplified', 'mathml'],
        ocr: ['math', 'text'],
        data_options: {
          include_asciimath: true,
          include_latex: true
        }
      })
    });

    console.log('Mathpix API 응답 상태:', mathpixResponse.status);

    if (!mathpixResponse.ok) {
      const errorText = await mathpixResponse.text();
      console.error('Mathpix API 오류:', errorText);
      return NextResponse.json(
        { success: false, error: 'Mathpix API 호출에 실패했습니다.' },
        { status: 500 }
      );
    }

    const mathpixData = await mathpixResponse.json();
    
    if (mathpixData.error) {
      console.error('Mathpix 처리 오류:', mathpixData.error);
      return NextResponse.json(
        { success: false, error: '이미지 처리에 실패했습니다.' },
        { status: 400 }
      );
    }

    console.log('Mathpix API 성공 응답:', {
      text: mathpixData.text?.substring(0, 100) + '...',
      latex: mathpixData.latex_simplified?.substring(0, 100) + '...',
      mathml: mathpixData.mathml ? 'mathml 포함됨' : 'mathml 없음'
    });

    // LaTeX를 Unicode로 변환하는 함수
    const convertLatexToUnicode = (text: string): string => {
      return text
        // 기본 LaTeX 명령어들을 Unicode로 변환
        .replace(/\\overline\{([^}]+)\}/g, '$1̄')
        .replace(/\\mathrm\{([^}]+)\}/g, '$1')
        .replace(/\\text\{([^}]+)\}/g, '$1')
        .replace(/\\angle/g, '∠')
        .replace(/\\theta/g, 'θ')
        .replace(/\\alpha/g, 'α')
        .replace(/\\beta/g, 'β')
        .replace(/\\gamma/g, 'γ')
        .replace(/\\delta/g, 'δ')
        .replace(/\\pi/g, 'π')
        .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
        .replace(/\\sqrt(\d+)/g, '√$1')
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
        .replace(/\\frac\{\\pi\}\{2\}/g, 'π/2')
        // 괄호 처리
        .replace(/\\left\(/g, '(')
        .replace(/\\right\)/g, ')')
        .replace(/\\left\[/g, '[')
        .replace(/\\right\]/g, ']')
        .replace(/\\left\{/g, '{')
        .replace(/\\right\}/g, '}')
        // 남은 LaTeX 명령어 제거
        .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1')
        .replace(/\\[a-zA-Z]+/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    // 최적의 텍스트 선택 및 변환
    let processedText = mathpixData.text || mathpixData.latex_simplified || mathpixData.mathml || '텍스트를 인식할 수 없습니다.';
    
    // LaTeX가 포함되어 있으면 변환
    if (processedText.includes('\\')) {
      processedText = convertLatexToUnicode(processedText);
    }

    // 성공적으로 처리된 텍스트 반환
    return NextResponse.json({
      success: true,
      data: {
        processedText: processedText
      }
    });

  } catch (error) {
    console.error('API 처리 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
