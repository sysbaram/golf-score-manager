#!/usr/bin/env python3
"""
골프 스코어 관리 프로그램 사용 예제
Example usage of Golf Score Manager
"""

from golf_score_manager import GolfScoreManager
from datetime import datetime

def example_usage():
    """프로그램 사용 예제"""
    
    # 스프레드시트 ID 설정 (실제 ID로 변경 필요)
    SPREADSHEET_ID = "YOUR_SPREADSHEET_ID"
    
    # GolfScoreManager 인스턴스 생성
    manager = GolfScoreManager(SPREADSHEET_ID)
    
    print("=== 골프 스코어 관리 프로그램 사용 예제 ===\n")
    
    # 예제 1: 새 라운드 생성 및 스코어 입력
    print("1. 새 라운드 생성")
    round_data = manager.create_golf_round(
        player_name="홍길동",
        course_name="ABC골프장",
        date="2024-01-15"
    )
    
    # 홀별 스코어 입력 (예제 데이터)
    example_scores = [4, 5, 3, 4, 6, 4, 5, 3, 4, 4, 5, 4, 3, 5, 4, 6, 4, 5]
    for hole, score in enumerate(example_scores, 1):
        round_data = manager.add_score(round_data, hole, score)
    
    # 핸디캡 계산
    handicap = manager.calculate_handicap(round_data)
    
    # 라운드 요약 출력
    manager.display_round_summary(round_data)
    
    # Google Sheets에 저장 (실제 스프레드시트 ID가 설정된 경우에만)
    if SPREADSHEET_ID != "YOUR_SPREADSHEET_ID":
        print("\n2. Google Sheets에 저장")
        manager.save_to_sheets(round_data)
        
        # 저장된 데이터 조회
        print("\n3. 저장된 라운드 조회")
        rounds = manager.load_from_sheets()
        print(f"총 {len(rounds)}개의 라운드가 저장되어 있습니다.")
        
        # 플레이어 통계 조회
        print("\n4. 플레이어 통계")
        stats = manager.get_player_statistics("홍길동")
        if 'message' not in stats:
            print(f"플레이어: {stats['player_name']}")
            print(f"총 라운드 수: {stats['total_rounds']}")
            print(f"평균 스코어: {stats['average_score']}")
            print(f"최고 스코어: {stats['best_score']}")
            print(f"최악 스코어: {stats['worst_score']}")
    else:
        print("\n실제 스프레드시트 ID를 설정한 후 다시 실행하세요.")

def batch_import_example():
    """여러 라운드를 한번에 가져오는 예제"""
    
    SPREADSHEET_ID = "YOUR_SPREADSHEET_ID"
    manager = GolfScoreManager(SPREADSHEET_ID)
    
    # 여러 라운드 데이터 생성
    rounds_data = [
        {
            'player_name': '홍길동',
            'course_name': 'ABC골프장',
            'date': '2024-01-15',
            'scores': [4, 5, 3, 4, 6, 4, 5, 3, 4, 4, 5, 4, 3, 5, 4, 6, 4, 5]
        },
        {
            'player_name': '홍길동',
            'course_name': 'XYZ골프장',
            'date': '2024-01-20',
            'scores': [3, 4, 5, 4, 4, 5, 3, 4, 5, 4, 4, 5, 4, 4, 5, 4, 4, 5]
        },
        {
            'player_name': '김철수',
            'course_name': 'ABC골프장',
            'date': '2024-01-15',
            'scores': [5, 4, 4, 5, 4, 5, 4, 4, 5, 4, 5, 4, 4, 5, 4, 5, 4, 5]
        }
    ]
    
    print("=== 여러 라운드 일괄 가져오기 예제 ===\n")
    
    for round_info in rounds_data:
        # 라운드 데이터 생성
        round_data = manager.create_golf_round(
            round_info['player_name'],
            round_info['course_name'],
            round_info['date']
        )
        
        # 스코어 입력
        for hole, score in enumerate(round_info['scores'], 1):
            round_data = manager.add_score(round_data, hole, score)
        
        # 핸디캡 계산
        manager.calculate_handicap(round_data)
        
        # Google Sheets에 저장
        if SPREADSHEET_ID != "YOUR_SPREADSHEET_ID":
            manager.save_to_sheets(round_data)
            print(f"{round_data['player_name']} - {round_data['course_name']} 라운드 저장 완료")
        else:
            print(f"{round_data['player_name']} - {round_data['course_name']} 라운드 준비 완료")

if __name__ == "__main__":
    # 기본 사용 예제 실행
    example_usage()
    
    print("\n" + "="*50 + "\n")
    
    # 일괄 가져오기 예제 실행
    batch_import_example()
