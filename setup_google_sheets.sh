#!/bin/bash

# Google Sheets 연동 설정 스크립트

echo "🔧 Google Sheets 연동 설정"
echo "================================"
echo ""

# Google Sheets ID 입력 받기
echo "📋 Google Sheets ID를 입력하세요:"
echo "   (Google Sheets URL에서 복사: https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit)"
read -p "스프레드시트 ID: " SPREADSHEET_ID

if [ -z "$SPREADSHEET_ID" ]; then
    echo "❌ 스프레드시트 ID가 입력되지 않았습니다."
    exit 1
fi

# 환경변수 설정
export GOOGLE_SPREADSHEET_ID=$SPREADSHEET_ID
export GOOGLE_USERS_SHEET_ID=$SPREADSHEET_ID
export GOOGLE_CLIENT_ID=38824619592-jpqaqquvbkectvohfs0vnujvi4v7h0sb.apps.googleusercontent.com
export GOOGLE_CLIENT_SECRET=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
export FLASK_SECRET_KEY=$(openssl rand -hex 32)

echo ""
echo "✅ 환경변수 설정 완료:"
echo "   GOOGLE_SPREADSHEET_ID: $GOOGLE_SPREADSHEET_ID"
echo "   GOOGLE_USERS_SHEET_ID: $GOOGLE_USERS_SHEET_ID"
echo "   GOOGLE_CLIENT_ID: $GOOGLE_CLIENT_ID"
echo "   FLASK_SECRET_KEY: [생성됨]"
echo ""

# .env 파일 생성
cat > .env << EOF
# Google Sheets API 설정
GOOGLE_SPREADSHEET_ID=$SPREADSHEET_ID
GOOGLE_USERS_SHEET_ID=$SPREADSHEET_ID

# Google OAuth 설정
GOOGLE_CLIENT_ID=38824619592-jpqaqquvbkectvohfs0vnujvi4v7h0sb.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Flask 보안 설정
FLASK_SECRET_KEY=$FLASK_SECRET_KEY

# 포트 설정
FLASK_RUN_PORT=8080
EOF

echo "📄 .env 파일이 생성되었습니다."
echo ""

# 서버 실행 여부 확인
read -p "🚀 서버를 지금 실행하시겠습니까? (y/n): " RUN_SERVER

if [ "$RUN_SERVER" = "y" ] || [ "$RUN_SERVER" = "Y" ]; then
    echo ""
    echo "🌐 서버 시작 중..."
    echo "   URL: http://localhost:8080"
    echo "   중지: Ctrl+C"
    echo ""
    
    # 가상환경 활성화 및 서버 실행
    source venv/bin/activate
    python -c "
import sys
sys.path.append('.')
from app import app
app.run(host='0.0.0.0', port=8080, debug=True)
"
else
    echo ""
    echo "📝 다음 명령어로 서버를 실행할 수 있습니다:"
    echo "   source venv/bin/activate"
    echo "   source .env"
    echo "   python app.py"
    echo ""
    echo "   또는 간편하게:"
    echo "   ./run_local.sh"
fi

echo ""
echo "✅ 설정 완료!"
echo "📖 자세한 내용은 GOOGLE_SHEETS_SETUP.md를 참조하세요."
