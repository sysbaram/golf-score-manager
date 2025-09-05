#!/usr/bin/env python3
"""
골프 스코어 관리 웹 애플리케이션
Golf Score Manager Web Application
"""

from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_cors import CORS
import os
from golf_score_manager import GolfScoreManager

app = Flask(__name__)
CORS(app)

# Google Sheets 스프레드시트 ID (환경변수에서 가져오기)
SPREADSHEET_ID = os.getenv('GOOGLE_SPREADSHEET_ID', '1-8URFWExJVHp-V3bnB-zFtBaxMZUZ5QKvvEVo0CGz10')

# GolfScoreManager 인스턴스 생성
golf_manager = None

def init_golf_manager():
    """GolfScoreManager 초기화"""
    global golf_manager
    try:
        golf_manager = GolfScoreManager(SPREADSHEET_ID)
        return True
    except Exception as e:
        print(f"GolfScoreManager 초기화 오류: {e}")
        return False

@app.route('/')
def index():
    """메인 페이지"""
    return render_template('index.html')

@app.route('/api/rounds', methods=['GET'])
def get_rounds():
    """저장된 라운드 기록 조회"""
    try:
        if not golf_manager:
            if not init_golf_manager():
                return jsonify({'error': 'GolfScoreManager 초기화 실패'}), 500
        
        rounds = golf_manager.load_from_sheets()
        return jsonify({'rounds': rounds})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/rounds', methods=['POST'])
def create_round():
    """새 라운드 기록 생성"""
    try:
        if not golf_manager:
            if not init_golf_manager():
                return jsonify({'error': 'GolfScoreManager 초기화 실패'}), 500
        
        data = request.get_json()
        player_name = data.get('player_name')
        course_name = data.get('course_name')
        detailed_scores = data.get('detailed_scores', [])
        
        if not player_name or not course_name or len(detailed_scores) != 18:
            return jsonify({'error': '필수 데이터가 누락되었습니다'}), 400
        
        # 라운드 데이터 생성
        round_data = golf_manager.create_golf_round(player_name, course_name)
        
        # 홀별 상세 스코어 입력
        for hole, detailed_score in enumerate(detailed_scores, 1):
            round_data = golf_manager.add_detailed_score(
                round_data, 
                hole, 
                detailed_score['par'],
                detailed_score['driver'],
                detailed_score['wood_util'],
                detailed_score['iron'],
                detailed_score['putter']
            )
        
        # 핸디캡 계산
        golf_manager.calculate_handicap(round_data)
        
        # Google Sheets에 저장
        golf_manager.save_to_sheets(round_data)
        
        return jsonify({
            'message': '라운드가 성공적으로 저장되었습니다',
            'round_data': round_data
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/statistics/<player_name>')
def get_player_statistics(player_name):
    """플레이어 통계 조회"""
    try:
        if not golf_manager:
            if not init_golf_manager():
                return jsonify({'error': 'GolfScoreManager 초기화 실패'}), 500
        
        stats = golf_manager.get_player_statistics(player_name)
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health')
def health_check():
    """헬스 체크"""
    try:
        if not golf_manager:
            if not init_golf_manager():
                return jsonify({'status': 'error', 'message': 'GolfScoreManager 초기화 실패'}), 500
        
        return jsonify({'status': 'ok', 'message': '서비스 정상 작동'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    # GolfScoreManager 초기화
    if init_golf_manager():
        print("✅ GolfScoreManager 초기화 완료")
    else:
        print("❌ GolfScoreManager 초기화 실패")
    
    # Flask 서버 실행
    print("🌐 웹 서버 시작: http://localhost:3000")
    app.run(debug=True, host='0.0.0.0', port=3000)
