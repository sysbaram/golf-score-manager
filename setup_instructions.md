# 골프 스코어 관리 프로그램 설정 가이드

## 1. Google Sheets API 설정

### 1.1 Google Cloud Console에서 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" > "라이브러리"로 이동
4. "Google Sheets API" 검색 후 활성화

### 1.2 서비스 계정 생성 및 인증 정보 다운로드
1. "API 및 서비스" > "사용자 인증 정보"로 이동
2. "사용자 인증 정보 만들기" > "OAuth 클라이언트 ID" 선택
3. 애플리케이션 유형: "데스크톱 애플리케이션" 선택
4. 인증 정보 다운로드 후 `credentials.json`으로 저장

### 1.3 Google Sheets 스프레드시트 생성
1. [Google Sheets](https://sheets.google.com/)에서 새 스프레드시트 생성
2. 스프레드시트 이름을 "Golf Score Manager"로 변경
3. 첫 번째 시트 이름을 "GolfScores"로 변경
4. 스프레드시트 URL에서 ID 복사 (예: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`)

## 2. 프로그램 설정

### 2.1 의존성 설치
```bash
pip install -r requirements.txt
```

### 2.2 스프레드시트 ID 설정
`golf_score_manager.py` 파일에서 다음 줄을 수정:
```python
SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'  # 실제 스프레드시트 ID로 변경
```

또는 프로그램 실행 시 직접 입력할 수 있습니다.

## 3. 프로그램 실행

```bash
python golf_score_manager.py
```

## 4. 주요 기능

### 4.1 새 라운드 기록
- 플레이어 이름, 코스 이름 입력
- 홀별 스코어 입력 (1-18홀)
- 자동 핸디캡 계산
- Google Sheets에 자동 저장

### 4.2 라운드 기록 조회
- 저장된 모든 라운드 기록 조회
- 최근 10개 라운드 표시

### 4.3 플레이어 통계
- 총 라운드 수
- 평균 스코어
- 최고/최악 스코어
- 최근 5라운드 평균

## 5. Google Sheets 데이터 구조

| 날짜 | 플레이어 | 코스 | 총 스코어 | 핸디캡 | 홀1 | 홀2 | ... | 홀18 |
|------|----------|------|-----------|--------|-----|-----|-----|------|
| 2024-01-15 | 홍길동 | ABC골프장 | 85 | 13 | 4 | 5 | ... | 4 |

## 6. 문제 해결

### 6.1 인증 오류
- `credentials.json` 파일이 올바른 위치에 있는지 확인
- Google Cloud Console에서 OAuth 클라이언트 ID가 올바르게 설정되었는지 확인

### 6.2 스프레드시트 접근 오류
- 스프레드시트 ID가 올바른지 확인
- 스프레드시트가 공유되어 있는지 확인 (필요시)

### 6.3 API 할당량 초과
- Google Cloud Console에서 API 할당량 확인
- 필요시 결제 계정 연결
