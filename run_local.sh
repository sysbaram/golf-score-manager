#!/bin/bash

# 골프 스코어 관리 시스템 로컬 실행 스크립트

echo "🚀 골프 스코어 관리 시스템 로컬 서버 시작..."

# 가상환경 활성화
source venv/bin/activate

# 환경변수 설정
# 실제 Google Sheets ID를 입력하세요 (GOOGLE_SHEETS_SETUP.md 참조)
export GOOGLE_SPREADSHEET_ID=${GOOGLE_SPREADSHEET_ID:-demo_score_sheet_id}
export GOOGLE_USERS_SHEET_ID=${GOOGLE_USERS_SHEET_ID:-demo_member_sheet_id}
export GOOGLE_CLIENT_ID=38824619592-jpqaqquvbkectvohfs0vnujvi4v7h0sb.apps.googleusercontent.com
export GOOGLE_CLIENT_SECRET=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
export FLASK_SECRET_KEY=${FLASK_SECRET_KEY:-demo_secret_key_12345}

echo "✅ 환경변수 설정 완료"
echo "🌐 서버 시작: http://localhost:8080"
echo "📱 GitHub Pages 데모: https://sysbaram.github.io/golf-score-manager/"
echo ""
echo "⚠️  데모 모드로 실행됩니다. 실제 Google Sheets 연동을 위해서는 유효한 API 키가 필요합니다."
echo "🛑 서버를 중지하려면 Ctrl+C를 누르세요."
echo ""

# Flask 서버 실행
python -c "
import sys
sys.path.append('.')
from app import app
app.run(host='0.0.0.0', port=8080, debug=True)
"
