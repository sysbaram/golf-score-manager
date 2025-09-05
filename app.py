#!/usr/bin/env python3
"""
골프 스코어 관리 웹 애플리케이션
Golf Score Manager Web Application
"""

from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_cors import CORS
import os
from golf_score_manager import GolfScoreManager
from user_manager import UserManager

app = Flask(__name__)
CORS(app, origins=['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'], 
     supports_credentials=True)

# 세션 보안을 위한 시크릿 키
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'your-secret-key-change-in-production')

# Google Sheets 스프레드시트 ID는 함수 내에서 가져오기

# Manager 인스턴스 생성
golf_manager = None
user_manager = None

def init_golf_manager():
    """GolfScoreManager 초기화"""
    global golf_manager
    try:
        # 환경변수에서 스프레드시트 ID 가져오기
        spreadsheet_id = os.getenv('GOOGLE_SPREADSHEET_ID')
        if not spreadsheet_id:
            print("❌ GOOGLE_SPREADSHEET_ID 환경변수가 설정되지 않았습니다.")
            return False
        
        golf_manager = GolfScoreManager(spreadsheet_id)
        return True
    except Exception as e:
        print(f"GolfScoreManager 초기화 오류: {e}")
        return False

def init_user_manager():
    """UserManager 초기화"""
    global user_manager
    try:
        # 환경변수 검증
        if not os.getenv('GOOGLE_USERS_SHEET_ID'):
            print("❌ GOOGLE_USERS_SHEET_ID 환경변수가 설정되지 않았습니다.")
            return False
        
        user_manager = UserManager()
        return True
    except Exception as e:
        print(f"❌ UserManager 초기화 오류: {e}")
        return False

def require_auth(f):
    """인증이 필요한 함수를 위한 데코레이터"""
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': '로그인이 필요합니다.'}), 401
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@app.route('/')
def index():
    """메인 페이지"""
    return render_template('index.html')

# ===== 사용자 인증 관련 라우트 =====

@app.route('/api/auth/register', methods=['POST'])
def register():
    """사용자 회원가입"""
    try:
        if not user_manager:
            if not init_user_manager():
                return jsonify({'error': 'UserManager 초기화 실패'}), 500
        
        data = request.get_json()
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        
        # 입력 검증
        if not username or not email or not password:
            return jsonify({'error': '모든 필드를 입력해주세요.'}), 400
        
        if len(password) < 6:
            return jsonify({'error': '비밀번호는 6자 이상이어야 합니다.'}), 400
        
        # 회원가입 처리
        result = user_manager.register_user(username, email, password)
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': f'회원가입 중 오류가 발생했습니다: {str(e)}'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """사용자 로그인"""
    try:
        if not user_manager:
            if not init_user_manager():
                return jsonify({'error': 'UserManager 초기화 실패'}), 500
        
        data = request.get_json()
        username_or_email = data.get('username', '').strip()
        password = data.get('password', '').strip()
        
        if not username_or_email or not password:
            return jsonify({'error': '사용자명/이메일과 비밀번호를 입력해주세요.'}), 400
        
        # 로그인 처리
        result = user_manager.authenticate_user(username_or_email, password)
        
        if result['success']:
            # 세션에 사용자 정보 저장
            session['user_id'] = result['user']['user_id']
            session['username'] = result['user']['username']
            session['email'] = result['user']['email']
            
            return jsonify({
                'success': True,
                'message': '로그인 성공',
                'user': result['user']
            })
        else:
            return jsonify(result), 401
            
    except Exception as e:
        return jsonify({'error': f'로그인 중 오류가 발생했습니다: {str(e)}'}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """사용자 로그아웃"""
    try:
        session.clear()
        return jsonify({'success': True, 'message': '로그아웃되었습니다.'})
    except Exception as e:
        return jsonify({'error': f'로그아웃 중 오류가 발생했습니다: {str(e)}'}), 500

@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    """현재 로그인한 사용자 정보 조회"""
    try:
        if 'user_id' not in session:
            return jsonify({'error': '로그인이 필요합니다.'}), 401
        
        return jsonify({
            'user_id': session['user_id'],
            'username': session['username'],
            'email': session['email']
        })
    except Exception as e:
        return jsonify({'error': f'사용자 정보 조회 중 오류가 발생했습니다: {str(e)}'}), 500

@app.route('/api/auth/check', methods=['GET'])
def check_auth():
    """로그인 상태 확인"""
    try:
        if 'user_id' in session:
            return jsonify({
                'authenticated': True,
                'user': {
                    'user_id': session['user_id'],
                    'username': session['username'],
                    'email': session['email']
                }
            })
        else:
            return jsonify({'authenticated': False})
    except Exception as e:
        return jsonify({'error': f'인증 상태 확인 중 오류가 발생했습니다: {str(e)}'}), 500

@app.route('/api/rounds', methods=['GET'])
@require_auth
def get_rounds():
    """저장된 라운드 기록 조회 (로그인 필요)"""
    try:
        if not golf_manager:
            if not init_golf_manager():
                return jsonify({'error': 'GolfScoreManager 초기화 실패'}), 500
        
        rounds = golf_manager.load_from_sheets()
        # 현재 사용자의 라운드만 필터링 (추후 구현)
        return jsonify({'rounds': rounds})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/rounds', methods=['POST'])
@require_auth
def create_round():
    """새 라운드 기록 생성 (로그인 필요)"""
    try:
        if not golf_manager:
            if not init_golf_manager():
                return jsonify({'error': 'GolfScoreManager 초기화 실패'}), 500
        
        data = request.get_json()
        course_name = data.get('course_name')
        detailed_scores = data.get('detailed_scores', [])
        
        # 로그인한 사용자명 사용
        player_name = session['username']
        
        if not course_name or len(detailed_scores) != 18:
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

@app.route('/api/statistics')
@require_auth
def get_player_statistics():
    """현재 사용자의 통계 조회 (로그인 필요)"""
    try:
        if not golf_manager:
            if not init_golf_manager():
                return jsonify({'error': 'GolfScoreManager 초기화 실패'}), 500
        
        # 현재 로그인한 사용자의 통계 조회
        player_name = session['username']
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
    # Manager 초기화
    golf_init_success = init_golf_manager()
    user_init_success = init_user_manager()
    
    if golf_init_success:
        print("✅ GolfScoreManager 초기화 완료")
    else:
        print("❌ GolfScoreManager 초기화 실패")
    
    if user_init_success:
        print("✅ UserManager 초기화 완료")
    else:
        print("❌ UserManager 초기화 실패")
    
    # Flask 서버 실행
    print("🌐 웹 서버 시작: http://localhost:3000")
    app.run(debug=True, host='0.0.0.0', port=3000)
