# Mathpix API 설정 가이드

이 프로젝트는 Mathpix API를 사용하여 이미지에서 수학 기호와 텍스트를 추출합니다.

## 1. Mathpix API 계정 설정

1. [Mathpix 웹사이트](https://mathpix.com/)에 접속합니다
2. 계정을 생성하거나 로그인합니다
3. [API 대시보드](https://accounts.mathpix.com/)로 이동합니다
4. 새 앱을 생성하고 `app_id`와 `app_key`를 받습니다

## 2. 환경 변수 설정

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하고 다음 내용을 추가합니다:

```bash
# Mathpix API Configuration
MATHPIX_APP_ID=your_actual_app_id_here
MATHPIX_APP_KEY=your_actual_app_key_here
```

**중요:** 실제 API 키 값으로 `your_actual_app_id_here`와 `your_actual_app_key_here`를 교체해야 합니다.

## 3. 기능 테스트

1. 개발 서버를 시작합니다:
   ```bash
   npm run dev
   ```

2. 브라우저에서 `http://localhost:3100/solve`로 이동합니다

3. 수학 문제가 포함된 이미지를 업로드하여 테스트합니다

## 4. API 사용량 및 제한사항

- Mathpix는 무료 플랜에서 월 1,000회 API 호출을 제공합니다
- 더 많은 사용량이 필요한 경우 유료 플랜을 고려해보세요
- 지원하는 이미지 형식: JPG, PNG, GIF (최대 10MB)

## 5. 문제 해결

### API 키가 설정되지 않은 경우
- 환경 변수가 없으면 개발용 목 데이터가 반환됩니다
- 콘솔에서 "Mathpix API 설정이 없습니다" 메시지를 확인할 수 있습니다

### 이미지 처리 실패 시
- 이미지가 선명한지 확인하세요
- 수식이나 텍스트가 명확하게 보이는지 확인하세요
- 파일 크기가 10MB를 초과하지 않는지 확인하세요

## 6. 개발자 정보

현재 구현된 기능:
- 이미지 업로드 (드래그 앤 드롭 지원)
- Mathpix API를 통한 텍스트/수식 추출
- LaTeX 형식의 수학 기호 지원
- 오류 처리 및 사용자 피드백

