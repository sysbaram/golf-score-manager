# 골프 스코어 관리 시스템 (Golf Score Management System)

Google Sheets와 연동하는 스마트 골프 스코어 관리 웹 애플리케이션입니다.

## 🏌️ 주요 기능

### 스코어 입력
- **홀별 상세 스코어**: Driver, Wood/Util, Iron, Putter 4가지 항목
- **Iron 다중 선택**: + 버튼으로 여러 Iron 선택 가능
- **Par 선택**: 각 홀별 Par3, Par4, Par5 선택
- **자동 계산**: 선택 시 자동으로 총점 계산
- **반응형 디자인**: 모바일과 데스크톱 최적화

### 세부 스코어 항목
- **Driver**: GS, PA, OB (1점, 2점, 3점)
- **Wood/Util**: Util2, PA, OB (1점, 2점, 3점)
- **Iron**: I3~I9, P, 52, 56, PA, OB (1점, 1점, 1점, 1점, 1점, 1점, 1점, 1점, 1점, 1점, 2점, 3점)
- **Putter**: 숫자 입력 (0-10)

### Google Sheets 연동
- **자동 저장**: 스코어를 Google Sheets에 자동 저장
- **시트 분리**: Score 시트(스코어 데이터), Member 시트(회원 정보) 분리
- **헤더 관리**: 각 시트의 첫 번째 행에 상세 항목 헤더 자동 생성
- **데이터 구조**: 18홀 × 6개 항목 (Par, Driver, Wood/Util, Iron, Putter, Total)

## 🚀 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/sysbaram/golf-score-manager.git
cd golf-score-manager
```

### 2. 가상환경 설정
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 3. 의존성 설치
```bash
pip install -r requirements.txt
```

### 4. Google Sheets API 설정
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **API 및 서비스** → **사용자 인증 정보**
4. **OAuth 2.0 클라이언트 ID** 생성 (데스크톱 애플리케이션)
5. **OAuth 동의 화면** 설정
6. **범위**: `https://www.googleapis.com/auth/spreadsheets` 추가
7. **테스트 사용자**: 본인 이메일 추가
8. **Google Sheets API** 활성화
9. `credentials.json` 파일을 프로젝트 루트에 다운로드

### 5. 환경변수 설정 (선택사항)
```bash
# 로컬 개발용
export GOOGLE_SPREADSHEET_ID="your_score_sheet_id"      # Score 시트용
export GOOGLE_USERS_SHEET_ID="your_member_sheet_id"     # Member 시트용
export GOOGLE_CLIENT_ID="your_client_id"
export GOOGLE_CLIENT_SECRET="your_client_secret"
export FLASK_SECRET_KEY="your_secret_key"
```

### 6. 애플리케이션 실행

#### 방법 1: 환경변수 설정 스크립트 사용 (권장)
```bash
./start_server.sh
```

#### 방법 2: 수동 환경변수 설정
```bash
export GOOGLE_SPREADSHEET_ID="1-8URFWExJVHp-V3bnB-zFtBaxMZUZ5QKvvEVo0CGz10"
export GOOGLE_USERS_SHEET_ID="1-8URFWExJVHp-V3bnB-zFtBaxMZUZ5QKvvEVo0CGz10"
export FLASK_SECRET_KEY="your-secret-key-change-in-production-12345"
python app.py
```

#### 방법 3: 환경변수 없이 실행 (credentials.json 사용)
```bash
python app.py
```

### 7. 웹 브라우저에서 접속
```
http://localhost:3000
```

## 🌐 배포 (Render)

### 1. Render 계정 생성
1. [Render.com](https://render.com) 접속
2. GitHub 계정으로 로그인

### 2. 새 웹 서비스 생성
1. **New** → **Web Service**
2. GitHub 저장소 연결: `sysbaram/golf-score-manager`
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `gunicorn app:app`

### 3. 환경변수 설정
Render 대시보드에서 다음 환경변수 설정:
```
GOOGLE_SPREADSHEET_ID=1-8URFWExJVHp-V3bnB-zFtBaxMZUZ5QKvvEVo0CGz10
GOOGLE_USERS_SHEET_ID=1-8URFWExJVHp-V3bnB-zFtBaxMZUZ5QKvvEVo0CGz10
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
FLASK_SECRET_KEY=your-secret-key-change-in-production-12345
```

**⚠️ 중요**: 
- `GOOGLE_CLIENT_ID`와 `GOOGLE_CLIENT_SECRET`은 Google Cloud Console에서 생성한 OAuth 2.0 클라이언트 정보입니다
- `FLASK_SECRET_KEY`는 프로덕션 환경에서 강력한 랜덤 키로 변경하세요

### 4. 배포 완료
- 자동으로 배포가 시작됩니다
- 배포 완료 후 제공되는 URL로 접속 가능

## 🔒 보안 설정

### ⚠️ 중요: 보안 주의사항
- **Public 저장소**: 이 저장소는 공개되어 있으므로 민감한 정보를 코드에 포함하지 마세요
- **환경변수 필수**: 모든 민감한 정보는 환경변수로 관리하세요
- **Private 저장소 권장**: 프로덕션 환경에서는 Private 저장소 사용을 권장합니다

### 환경변수 사용
- **로컬 개발**: `credentials.json`, `token.json` 파일 사용
- **배포 환경**: 환경변수 사용 (보안 강화)
- **필수 환경변수**: `GOOGLE_SPREADSHEET_ID`, `GOOGLE_USERS_SHEET_ID`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FLASK_SECRET_KEY`

### 보안 파일 제외
- `credentials.json`: Google API 클라이언트 정보
- `token.json`: OAuth 인증 토큰
- `.env`: 환경변수 파일
- **절대 커밋하지 말 것**: 민감한 정보가 포함된 파일들

## 📁 프로젝트 구조

```
golf-score-manager/
├── app.py                 # Flask 웹 애플리케이션
├── golf_score_manager.py  # 골프 스코어 관리 핵심 로직
├── requirements.txt       # Python 의존성
├── example_usage.py       # 사용 예제
├── templates/
│   └── index.html         # 웹 페이지 템플릿
├── static/
│   ├── css/
│   │   └── style.css      # 스타일시트
│   └── js/
│       └── app.js         # 클라이언트 사이드 JavaScript
├── .gitignore            # Git 무시 파일
└── README.md             # 프로젝트 설명서
```

## 🛠️ 기술 스택

- **Backend**: Python, Flask
- **Frontend**: HTML, CSS, JavaScript
- **API**: Google Sheets API
- **인증**: OAuth 2.0
- **스타일**: Font Awesome, 반응형 CSS

## 📱 모바일 최적화

- **터치 친화적**: 터치하기 쉬운 버튼 크기
- **반응형 레이아웃**: 다양한 화면 크기 지원
- **모바일 메타 태그**: iOS/Android 최적화
- **세로 배치**: 모바일에서 Iron 선택 세로 배치

## 🔧 주요 기능 상세

### Iron 다중 선택
- **기본 선택**: 첫 번째 Iron을 기본 드롭다운에서 선택
- **추가 선택**: + 버튼으로 추가 Iron 선택
- **개별 삭제**: X 버튼으로 추가 Iron 선택 삭제
- **자동 계산**: 모든 Iron 선택의 총합 자동 계산

### Google Sheets 데이터 구조

#### Score 시트 (스코어 데이터)
```
A열: 날짜
B열: 플레이어 이름
C열: 코스 이름
D열: 총 스코어
E열: 핸디캡
F열: 홀1_Par
G열: 홀1_Driver
H열: 홀1_Wood/Util
I열: 홀1_Iron
J열: 홀1_Putter
K열: 홀1_Total
... (18홀 × 6개 항목)
```

#### Member 시트 (회원 정보)
```
A열: user_id
B열: username
C열: email
D열: password_hash
E열: created_at
F열: last_login
```

## 📄 라이선스

MIT License

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요.

---

**골프 스코어 관리 시스템**으로 더 정확하고 편리한 골프 스코어 관리가 가능합니다! 🏌️‍♂️
