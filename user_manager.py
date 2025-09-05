#!/usr/bin/env python3
"""
사용자 관리 모듈
User Management Module
"""

import os
import json
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Google Sheets API 설정
SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
USERS_SHEET_ID = os.getenv('GOOGLE_USERS_SHEET_ID')  # 사용자 정보용 스프레드시트
USERS_RANGE = 'Member!A1:F1000'  # 사용자 데이터 범위

class UserManager:
    """사용자 관리 클래스"""
    
    def __init__(self):
        self.service = None
        
        # 환경변수 검증
        if not USERS_SHEET_ID:
            raise ValueError("GOOGLE_USERS_SHEET_ID 환경변수가 설정되지 않았습니다.")
        
        self._authenticate()
        self._ensure_users_headers()
    
    def _authenticate(self):
        """Google Sheets API 인증"""
        creds = None
        
        # 환경변수에서 인증 정보 확인
        if os.getenv('GOOGLE_CREDENTIALS_JSON'):
            creds_data = json.loads(os.getenv('GOOGLE_CREDENTIALS_JSON'))
            creds = Credentials.from_authorized_user_info(creds_data, SCOPES)
        elif os.path.exists('token.json'):
            creds = Credentials.from_authorized_user_file('token.json', SCOPES)
        
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                if os.getenv('GOOGLE_CLIENT_ID') and os.getenv('GOOGLE_CLIENT_SECRET'):
                    client_config = {
                        "installed": {
                            "client_id": os.getenv('GOOGLE_CLIENT_ID'),
                            "client_secret": os.getenv('GOOGLE_CLIENT_SECRET'),
                            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                            "token_uri": "https://oauth2.googleapis.com/token",
                            "redirect_uris": ["http://localhost"]
                        }
                    }
                    flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
                else:
                    flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
                creds = flow.run_local_server(port=0)
            
            if not os.getenv('GOOGLE_CREDENTIALS_JSON'):
                with open('token.json', 'w') as token:
                    token.write(creds.to_json())
        
        self.service = build('sheets', 'v4', credentials=creds)
    
    def _ensure_users_headers(self):
        """사용자 스프레드시트에 헤더가 있는지 확인하고 없으면 추가"""
        try:
            result = self.service.spreadsheets().values().get(
                spreadsheetId=USERS_SHEET_ID,
                range='Member!A1:F1'
            ).execute()
            
            values = result.get('values', [])
            
            if not values or not values[0]:
                headers = ['user_id', 'username', 'email', 'password_hash', 'created_at', 'last_login']
                
                body = {'values': [headers]}
                self.service.spreadsheets().values().update(
                    spreadsheetId=USERS_SHEET_ID,
                    range='Member!A1:F1',
                    valueInputOption='USER_ENTERED',
                    body=body
                ).execute()
                print("Member 시트에 사용자 헤더가 추가되었습니다.")
                
        except HttpError as error:
            print(f"사용자 헤더 확인 중 오류: {error}")
    
    def _hash_password(self, password: str) -> str:
        """비밀번호 해시화"""
        salt = secrets.token_hex(16)
        password_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return f"{salt}:{password_hash.hex()}"
    
    def _verify_password(self, password: str, password_hash: str) -> bool:
        """비밀번호 검증"""
        try:
            salt, hash_value = password_hash.split(':')
            password_hash_check = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
            return password_hash_check.hex() == hash_value
        except:
            return False
    
    def register_user(self, username: str, email: str, password: str) -> Dict:
        """사용자 회원가입"""
        try:
            # 기존 사용자 확인
            if self.get_user_by_username(username):
                return {'success': False, 'message': '이미 존재하는 사용자명입니다.'}
            
            if self.get_user_by_email(email):
                return {'success': False, 'message': '이미 존재하는 이메일입니다.'}
            
            # 새 사용자 생성
            user_id = secrets.token_hex(16)
            password_hash = self._hash_password(password)
            created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
            user_data = [user_id, username, email, password_hash, created_at, '']
            
            # Google Sheets에 저장
            body = {'values': [user_data]}
            result = self.service.spreadsheets().values().append(
                spreadsheetId=USERS_SHEET_ID,
                range=USERS_RANGE,
                valueInputOption='USER_ENTERED',
                body=body
            ).execute()
            
            return {
                'success': True, 
                'message': '회원가입이 완료되었습니다.',
                'user_id': user_id
            }
            
        except Exception as e:
            return {'success': False, 'message': f'회원가입 중 오류가 발생했습니다: {str(e)}'}
    
    def authenticate_user(self, username: str, password: str) -> Dict:
        """사용자 로그인 인증"""
        try:
            user = self.get_user_by_username(username)
            if not user:
                return {'success': False, 'message': '사용자명 또는 비밀번호가 올바르지 않습니다.'}
            
            if not self._verify_password(password, user['password_hash']):
                return {'success': False, 'message': '사용자명 또는 비밀번호가 올바르지 않습니다.'}
            
            # 마지막 로그인 시간 업데이트
            self.update_last_login(user['user_id'])
            
            return {
                'success': True,
                'message': '로그인 성공',
                'user': {
                    'user_id': user['user_id'],
                    'username': user['username'],
                    'email': user['email']
                }
            }
            
        except Exception as e:
            return {'success': False, 'message': f'로그인 중 오류가 발생했습니다: {str(e)}'}
    
    def get_user_by_username(self, username: str) -> Optional[Dict]:
        """사용자명으로 사용자 조회"""
        try:
            result = self.service.spreadsheets().values().get(
                spreadsheetId=USERS_SHEET_ID,
                range=USERS_RANGE
            ).execute()
            
            values = result.get('values', [])
            if not values:
                return None
            
            # 헤더 제거
            data_rows = values[1:]
            
            for row in data_rows:
                if len(row) >= 4 and row[1] == username:  # username은 B열 (인덱스 1)
                    return {
                        'user_id': row[0],
                        'username': row[1],
                        'email': row[2],
                        'password_hash': row[3],
                        'created_at': row[4] if len(row) > 4 else '',
                        'last_login': row[5] if len(row) > 5 else ''
                    }
            
            return None
            
        except Exception as e:
            print(f"사용자 조회 중 오류: {e}")
            return None
    
    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """이메일로 사용자 조회"""
        try:
            result = self.service.spreadsheets().values().get(
                spreadsheetId=USERS_SHEET_ID,
                range=USERS_RANGE
            ).execute()
            
            values = result.get('values', [])
            if not values:
                return None
            
            data_rows = values[1:]
            
            for row in data_rows:
                if len(row) >= 3 and row[2] == email:  # email은 C열 (인덱스 2)
                    return {
                        'user_id': row[0],
                        'username': row[1],
                        'email': row[2],
                        'password_hash': row[3],
                        'created_at': row[4] if len(row) > 4 else '',
                        'last_login': row[5] if len(row) > 5 else ''
                    }
            
            return None
            
        except Exception as e:
            print(f"사용자 조회 중 오류: {e}")
            return None
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        """사용자 ID로 사용자 조회"""
        try:
            result = self.service.spreadsheets().values().get(
                spreadsheetId=USERS_SHEET_ID,
                range=USERS_RANGE
            ).execute()
            
            values = result.get('values', [])
            if not values:
                return None
            
            data_rows = values[1:]
            
            for row in data_rows:
                if len(row) >= 1 and row[0] == user_id:  # user_id는 A열 (인덱스 0)
                    return {
                        'user_id': row[0],
                        'username': row[1],
                        'email': row[2],
                        'password_hash': row[3],
                        'created_at': row[4] if len(row) > 4 else '',
                        'last_login': row[5] if len(row) > 5 else ''
                    }
            
            return None
            
        except Exception as e:
            print(f"사용자 조회 중 오류: {e}")
            return None
    
    def update_last_login(self, user_id: str):
        """마지막 로그인 시간 업데이트"""
        try:
            # 모든 사용자 데이터 가져오기
            result = self.service.spreadsheets().values().get(
                spreadsheetId=USERS_SHEET_ID,
                range=USERS_RANGE
            ).execute()
            
            values = result.get('values', [])
            if not values:
                return
            
            # 사용자 찾아서 업데이트
            for i, row in enumerate(values[1:], start=2):  # 헤더 제외하고 2행부터 시작
                if len(row) >= 1 and row[0] == user_id:
                    # 마지막 로그인 시간 업데이트
                    last_login = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    
                    # 행 업데이트
                    update_range = f'F{i}'  # F열 (last_login)
                    body = {'values': [[last_login]]}
                    self.service.spreadsheets().values().update(
                        spreadsheetId=USERS_SHEET_ID,
                        range=update_range,
                        valueInputOption='USER_ENTERED',
                        body=body
                    ).execute()
                    break
                    
        except Exception as e:
            print(f"마지막 로그인 시간 업데이트 중 오류: {e}")
    
    def get_all_users(self) -> List[Dict]:
        """모든 사용자 조회 (관리자용)"""
        try:
            result = self.service.spreadsheets().values().get(
                spreadsheetId=USERS_SHEET_ID,
                range=USERS_RANGE
            ).execute()
            
            values = result.get('values', [])
            if not values:
                return []
            
            users = []
            for row in values[1:]:  # 헤더 제외
                if len(row) >= 4:
                    users.append({
                        'user_id': row[0],
                        'username': row[1],
                        'email': row[2],
                        'created_at': row[4] if len(row) > 4 else '',
                        'last_login': row[5] if len(row) > 5 else ''
                    })
            
            return users
            
        except Exception as e:
            print(f"사용자 목록 조회 중 오류: {e}")
            return []
