#!/bin/bash

# 작업 관리 스크립트
echo "=== Golf Score Manager 작업 관리 ==="
echo ""

case "$1" in
    "status")
        echo "📊 프로젝트 상태:"
        cat .taskmaster/tasks/project_status.md
        ;;
    "add")
        echo "➕ 새 작업 추가:"
        read -p "작업 제목: " title
        read -p "작업 설명: " description
        echo "- [ ] $title: $description" >> .taskmaster/tasks/todo.md
        echo "작업이 추가되었습니다."
        ;;
    "list")
        echo "�� 작업 목록:"
        if [ -f .taskmaster/tasks/todo.md ]; then
            cat .taskmaster/tasks/todo.md
        else
            echo "작업이 없습니다."
        fi
        ;;
    "help")
        echo "사용법:"
        echo "  ./manage_tasks.sh status  - 프로젝트 상태 확인"
        echo "  ./manage_tasks.sh add     - 새 작업 추가"
        echo "  ./manage_tasks.sh list    - 작업 목록 보기"
        echo "  ./manage_tasks.sh help    - 도움말"
        ;;
    *)
        echo "사용법: ./manage_tasks.sh [status|add|list|help]"
        ;;
esac
