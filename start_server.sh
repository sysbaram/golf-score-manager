#!/bin/bash

# 환경변수 설정
export GOOGLE_SPREADSHEET_ID="1-8URFWExJVHp-V3bnB-zFtBaxMZUZ5QKvvEVo0CGz10"
export GOOGLE_USERS_SHEET_ID="1-8URFWExJVHp-V3bnB-zFtBaxMZUZ5QKvvEVo0CGz10"
export FLASK_SECRET_KEY="your-secret-key-change-in-production-12345"

# 가상환경 활성화
source venv/bin/activate

# 서버 실행
python app.py
