# Google Sheets 연동 설정 가이드

## 📋 1단계: Google Sheets 생성

1. **Google Sheets 새 문서 생성**
   - [Google Sheets](https://sheets.google.com) 접속
   - "빈 스프레드시트" 클릭하여 새 문서 생성

2. **스프레드시트 ID 확인**
   - URL에서 스프레드시트 ID 복사
   - 예: `https://docs.google.com/spreadsheets/d/1ABC123...XYZ789/edit`
   - ID: `1ABC123...XYZ789`

## 📊 2단계: 시트 구조 설정

### Score 시트 (스코어 데이터용)
- 시트 이름: `Score`
- 자동으로 헤더가 생성됩니다

### Member 시트 (회원 정보용)  
- 시트 이름: `Member`
- 자동으로 헤더가 생성됩니다

## 🔧 3단계: 환경변수 설정

### 방법 1: 실행 스크립트 수정
`run_local.sh` 파일을 편집하여 실제 스프레드시트 ID를 입력:

```bash
# 실제 Google Sheets ID로 변경
export GOOGLE_SPREADSHEET_ID=your_actual_spreadsheet_id_here
export GOOGLE_USERS_SHEET_ID=your_actual_spreadsheet_id_here
```

### 방법 2: 환경변수 파일 생성
`.env` 파일 생성 (Git에 커밋하지 마세요):

```bash
# .env 파일
GOOGLE_SPREADSHEET_ID=your_actual_spreadsheet_id_here
GOOGLE_USERS_SHEET_ID=your_actual_spreadsheet_id_here
GOOGLE_CLIENT_ID=38824619592-jpqaqquvbkectvohfs0vnujvi4v7h0sb.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
FLASK_SECRET_KEY=your_secret_key_here
```

## 🚀 4단계: 서버 실행

```bash
# 실행 스크립트 사용
./run_local.sh

# 또는 수동 실행
source venv/bin/activate
export GOOGLE_SPREADSHEET_ID=your_actual_spreadsheet_id_here
export GOOGLE_USERS_SHEET_ID=your_actual_spreadsheet_id_here
export GOOGLE_CLIENT_ID=38824619592-jpqaqquvbkectvohfs0vnujvi4v7h0sb.apps.googleusercontent.com
export GOOGLE_CLIENT_SECRET=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
export FLASK_SECRET_KEY=your_secret_key_here
python app.py
```

## ✅ 5단계: 테스트

1. **회원가입**: 웹에서 새 계정 생성
2. **스코어 입력**: 골프 스코어 입력
3. **Google Sheets 확인**: 실제 데이터가 저장되었는지 확인

## 🔒 보안 주의사항

- `.env` 파일은 절대 Git에 커밋하지 마세요
- `token.json` 파일은 개인 인증 정보이므로 공유하지 마세요
- 프로덕션 환경에서는 환경변수로 관리하세요

## 🆘 문제 해결

### 인증 오류
- `token.json` 파일이 유효한지 확인
- Google Sheets API가 활성화되어 있는지 확인

### 권한 오류
- Google Sheets에 대한 편집 권한이 있는지 확인
- 스프레드시트 ID가 올바른지 확인

### 데이터 저장 오류
- 시트 이름이 `Score`, `Member`인지 확인
- 스프레드시트가 공유 설정되어 있는지 확인
