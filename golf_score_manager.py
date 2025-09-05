#!/usr/bin/env python3
"""
골프 스코어 관리 프로그램 - Google Sheets 연동
Golf Score Manager with Google Sheets Integration
"""

import os
import json
from datetime import datetime
from typing import List, Dict, Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Google Sheets API 설정
SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'  # 실제 스프레드시트 ID로 변경 필요
RANGE_NAME = 'A1:Z1000'  # 데이터를 저장할 시트 범위

class GolfScoreManager:
    """골프 스코어 관리 클래스"""
    
    def __init__(self, spreadsheet_id: str = None):
        self.spreadsheet_id = spreadsheet_id or SPREADSHEET_ID
        self.service = None
        self.credentials = None
        self._authenticate()
    
    def _authenticate(self):
        """Google Sheets API 인증"""
        creds = None
        # token.json 파일이 있으면 기존 인증 정보 사용
        if os.path.exists('token.json'):
            creds = Credentials.from_authorized_user_file('token.json', SCOPES)
        
        # 유효한 인증 정보가 없으면 새로 인증
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    'credentials.json', SCOPES)
                creds = flow.run_local_server(port=0)
            
            # 인증 정보를 token.json에 저장
            with open('token.json', 'w') as token:
                token.write(creds.to_json())
        
        self.credentials = creds
        self.service = build('sheets', 'v4', credentials=creds)
    
    def create_golf_round(self, player_name: str, course_name: str, 
                         date: str = None, holes: int = 18) -> Dict:
        """새로운 골프 라운드 생성"""
        if date is None:
            date = datetime.now().strftime('%Y-%m-%d')
        
        # 홀별 상세 스코어 초기화 (Par, Driver, Wood/Util, Iron, Putter)
        detailed_scores = []
        for hole in range(holes):
            detailed_scores.append({
                'par': 4,  # 기본 파4
                'driver': 0,
                'wood_util': 0,
                'iron': 0,
                'putter': 0,
                'total': 4  # 기본값
            })
        
        round_data = {
            'player_name': player_name,
            'course_name': course_name,
            'date': date,
            'holes': holes,
            'scores': [0] * holes,
            'detailed_scores': detailed_scores,
            'total_score': 0,
            'par_scores': [4] * holes,  # 기본 파 스코어 (실제로는 코스별로 다름)
            'handicap': 0
        }
        
        return round_data
    
    def add_score(self, round_data: Dict, hole: int, score: int) -> Dict:
        """특정 홀의 스코어 추가"""
        if 1 <= hole <= round_data['holes']:
            round_data['scores'][hole - 1] = score
            round_data['total_score'] = sum(round_data['scores'])
        
        return round_data
    
    def add_detailed_score(self, round_data: Dict, hole: int, par: int, driver: int, wood_util: int, iron: int, putter: int) -> Dict:
        """특정 홀의 상세 스코어 추가"""
        if 1 <= hole <= round_data['holes']:
            total = driver + wood_util + iron + putter
            round_data['detailed_scores'][hole - 1] = {
                'par': par,
                'driver': driver,
                'wood_util': wood_util,
                'iron': iron,
                'putter': putter,
                'total': total
            }
            # 상세 스코어의 총합으로 일반 스코어도 업데이트
            round_data['scores'][hole - 1] = total
            round_data['total_score'] = sum(round_data['scores'])
        
        return round_data
    
    def calculate_handicap(self, round_data: Dict) -> int:
        """핸디캡 계산 (간단한 버전)"""
        total_score = round_data['total_score']
        total_par = sum(round_data['par_scores'])
        handicap = max(0, total_score - total_par)
        round_data['handicap'] = handicap
        return handicap
    
    def save_to_sheets(self, round_data: Dict):
        """라운드 데이터를 Google Sheets에 저장"""
        try:
            # 헤더 행이 있는지 확인하고 없으면 추가
            self._ensure_headers()
            
            # 데이터 행 준비
            values = [
                round_data['date'],
                round_data['player_name'],
                round_data['course_name'],
                round_data['total_score'],
                round_data['handicap']
            ]
            
            # 홀별 상세 스코어 추가
            for detailed_score in round_data['detailed_scores']:
                values.extend([
                    detailed_score['par'],
                    detailed_score['driver'],
                    detailed_score['wood_util'],
                    detailed_score['iron'],
                    detailed_score['putter'],
                    detailed_score['total']
                ])
            
            # 데이터 추가
            body = {'values': [values]}
            result = self.service.spreadsheets().values().append(
                spreadsheetId=self.spreadsheet_id,
                range=RANGE_NAME,
                valueInputOption='USER_ENTERED',
                body=body
            ).execute()
            
            print(f"데이터가 성공적으로 저장되었습니다. {result.get('updates', {}).get('updatedRows', 0)}행이 추가되었습니다.")
            
        except HttpError as error:
            print(f"Google Sheets API 오류: {error}")
    
    def _ensure_headers(self):
        """스프레드시트에 헤더가 있는지 확인하고 없으면 추가"""
        try:
            # 첫 번째 행 읽기
            result = self.service.spreadsheets().values().get(
                spreadsheetId=self.spreadsheet_id,
                range='A1:Z1'
            ).execute()
            
            values = result.get('values', [])
            
            # 헤더가 없으면 추가
            if not values or not values[0]:
                headers = [
                    '날짜', '플레이어', '코스', '총 스코어', '핸디캡'
                ]
                # 홀별 상세 스코어 헤더 추가
                for i in range(18):
                    hole_num = i + 1
                    headers.extend([
                        f'홀{hole_num}_Par', f'홀{hole_num}_Driver', f'홀{hole_num}_Wood/Util', 
                        f'홀{hole_num}_Iron', f'홀{hole_num}_Putter', f'홀{hole_num}_Total'
                    ])
                
                # 헤더 행의 범위를 정확히 계산 (총 113개 컬럼: 5 + 18*6)
                # Excel 컬럼 번호를 문자로 변환하는 함수
                def num_to_col_letters(num):
                    result = ""
                    while num > 0:
                        num -= 1
                        result = chr(65 + (num % 26)) + result
                        num //= 26
                    return result
                
                end_column = num_to_col_letters(len(headers))
                range_name = f'A1:{end_column}1'
                
                body = {'values': [headers]}
                self.service.spreadsheets().values().update(
                    spreadsheetId=self.spreadsheet_id,
                    range=range_name,
                    valueInputOption='USER_ENTERED',
                    body=body
                ).execute()
                print(f"헤더가 추가되었습니다. 범위: {range_name}")
                
        except HttpError as error:
            print(f"헤더 확인 중 오류: {error}")
    
    def load_from_sheets(self) -> List[Dict]:
        """Google Sheets에서 모든 라운드 데이터 로드"""
        try:
            result = self.service.spreadsheets().values().get(
                spreadsheetId=self.spreadsheet_id,
                range=RANGE_NAME
            ).execute()
            
            values = result.get('values', [])
            
            if not values:
                return []
            
            # 헤더 제거
            headers = values[0]
            data_rows = values[1:]
            
            rounds = []
            for row in data_rows:
                if len(row) >= 5:  # 최소 필수 데이터 확인
                    round_data = {
                        'date': row[0],
                        'player_name': row[1],
                        'course_name': row[2],
                        'total_score': int(row[3]) if row[3].isdigit() else 0,
                        'handicap': int(row[4]) if row[4].isdigit() else 0,
                        'scores': [int(score) if score.isdigit() else 0 for score in row[5:23]]  # 홀 1-18
                    }
                    rounds.append(round_data)
            
            return rounds
            
        except HttpError as error:
            print(f"데이터 로드 중 오류: {error}")
            return []
    
    def get_player_statistics(self, player_name: str) -> Dict:
        """특정 플레이어의 통계 계산"""
        rounds = self.load_from_sheets()
        player_rounds = [r for r in rounds if r['player_name'] == player_name]
        
        if not player_rounds:
            return {"message": f"{player_name}의 라운드 기록이 없습니다."}
        
        total_rounds = len(player_rounds)
        total_scores = [r['total_score'] for r in player_rounds]
        avg_score = sum(total_scores) / total_rounds
        best_score = min(total_scores)
        worst_score = max(total_scores)
        
        # 최근 5라운드 평균
        recent_rounds = player_rounds[-5:]
        recent_avg = sum([r['total_score'] for r in recent_rounds]) / len(recent_rounds)
        
        return {
            'player_name': player_name,
            'total_rounds': total_rounds,
            'average_score': round(avg_score, 1),
            'best_score': best_score,
            'worst_score': worst_score,
            'recent_5_rounds_avg': round(recent_avg, 1)
        }
    
    def display_round_summary(self, round_data: Dict):
        """라운드 요약 정보 출력"""
        print(f"\n=== 골프 라운드 요약 ===")
        print(f"플레이어: {round_data['player_name']}")
        print(f"코스: {round_data['course_name']}")
        print(f"날짜: {round_data['date']}")
        print(f"총 스코어: {round_data['total_score']}")
        print(f"핸디캡: {round_data['handicap']}")
        print(f"홀별 스코어: {round_data['scores']}")


def main():
    """메인 함수 - 사용자 인터페이스"""
    print("=== 골프 스코어 관리 프로그램 ===")
    print("Google Sheets와 연동하여 스코어를 관리합니다.")
    
    # 스프레드시트 ID 입력
    spreadsheet_id = input("Google Sheets 스프레드시트 ID를 입력하세요: ").strip()
    if not spreadsheet_id:
        print("스프레드시트 ID가 필요합니다.")
        return
    
    manager = GolfScoreManager(spreadsheet_id)
    
    while True:
        print("\n=== 메뉴 ===")
        print("1. 새 라운드 기록")
        print("2. 라운드 기록 조회")
        print("3. 플레이어 통계")
        print("4. 종료")
        
        choice = input("선택하세요 (1-4): ").strip()
        
        if choice == '1':
            # 새 라운드 기록
            player_name = input("플레이어 이름: ").strip()
            course_name = input("코스 이름: ").strip()
            
            round_data = manager.create_golf_round(player_name, course_name)
            
            # 홀별 스코어 입력
            print(f"\n{round_data['holes']}홀 스코어를 입력하세요:")
            for hole in range(1, round_data['holes'] + 1):
                while True:
                    try:
                        score = int(input(f"홀 {hole} 스코어: "))
                        if score > 0:
                            round_data = manager.add_score(round_data, hole, score)
                            break
                        else:
                            print("스코어는 1 이상이어야 합니다.")
                    except ValueError:
                        print("올바른 숫자를 입력하세요.")
            
            # 핸디캡 계산
            manager.calculate_handicap(round_data)
            
            # 요약 출력
            manager.display_round_summary(round_data)
            
            # Google Sheets에 저장
            save_choice = input("\nGoogle Sheets에 저장하시겠습니까? (y/n): ").strip().lower()
            if save_choice == 'y':
                manager.save_to_sheets(round_data)
                print("저장이 완료되었습니다!")
        
        elif choice == '2':
            # 라운드 기록 조회
            rounds = manager.load_from_sheets()
            if rounds:
                print(f"\n총 {len(rounds)}개의 라운드 기록:")
                for i, round_data in enumerate(rounds[-10:], 1):  # 최근 10개만 표시
                    print(f"{i}. {round_data['date']} - {round_data['player_name']} - {round_data['course_name']} - {round_data['total_score']}타")
            else:
                print("저장된 라운드 기록이 없습니다.")
        
        elif choice == '3':
            # 플레이어 통계
            player_name = input("통계를 조회할 플레이어 이름: ").strip()
            stats = manager.get_player_statistics(player_name)
            
            if 'message' in stats:
                print(stats['message'])
            else:
                print(f"\n=== {player_name} 통계 ===")
                print(f"총 라운드 수: {stats['total_rounds']}")
                print(f"평균 스코어: {stats['average_score']}")
                print(f"최고 스코어: {stats['best_score']}")
                print(f"최악 스코어: {stats['worst_score']}")
                print(f"최근 5라운드 평균: {stats['recent_5_rounds_avg']}")
        
        elif choice == '4':
            print("프로그램을 종료합니다.")
            break
        
        else:
            print("올바른 선택을 해주세요.")


if __name__ == "__main__":
    main()
