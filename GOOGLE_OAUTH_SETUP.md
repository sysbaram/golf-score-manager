# Google OAuth 도메인 등록 가이드

## 🎯 문제 상황
```
Client ID: 38824619592-jpqaqquvbkectvohfs0vnujvi4v7h0sb.apps.googleusercontent.com
도메인: https://sysbaram.github.io
오류: "Not a valid origin for the client"
```

## 🔧 해결 방법

### 1단계: Google Cloud Console 접속
1. [Google Cloud Console](https://console.developers.google.com/) 접속
2. 해당 프로젝트 선택

### 2단계: OAuth 2.0 클라이언트 ID 설정
1. **API 및 서비스** → **사용자 인증 정보** 메뉴 선택
2. **OAuth 2.0 클라이언트 ID** 중에서 `38824619592-jpqaqquvbkectvohfs0vnujvi4v7h0sb.apps.googleusercontent.com` 선택
3. **승인된 JavaScript 원본** 섹션에 다음 도메인 추가:
   ```
   https://sysbaram.github.io
   ```
4. **승인된 리디렉션 URI** 섹션에 다음 URI 추가:
   ```
   https://sysbaram.github.io/golf-score-manager/
   https://sysbaram.github.io/golf-score-manager/index.html
   ```

### 3단계: 변경사항 저장
1. **저장** 버튼 클릭
2. 변경사항이 적용될 때까지 5-10분 대기

### 4단계: 테스트
1. 브라우저에서 GitHub Pages 페이지 새로고침
2. Google Sheets API 연동 정상 작동 확인

## ⚠️ 주의사항
- 도메인 등록 후 변경사항이 적용되는데 최대 10분이 소요될 수 있습니다.
- 정확한 도메인 형식을 사용해야 합니다 (https:// 포함, 끝에 슬래시 없음)

## 🎉 완료 후 기대 효과
- GitHub Pages에서 Google Sheets API 정상 연동
- 실제 Google Sheets에 사용자 데이터 저장
- 오프라인 모드 대신 실시간 클라우드 연동
