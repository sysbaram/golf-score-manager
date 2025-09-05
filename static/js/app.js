// 골프 스코어 관리 시스템 JavaScript

class GolfScoreApp {
    constructor() {
        this.currentTab = 'score-input';
        this.rounds = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.generateHoleInputs();
        this.loadRounds();
        this.setupTabSwitching();
    }

    setupEventListeners() {
        // 폼 제출
        document.getElementById('score-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitScore();
        });

        // 초기화 버튼
        document.getElementById('clear-scores').addEventListener('click', () => {
            this.clearScores();
        });

        // 새로고침 버튼
        document.getElementById('refresh-rounds').addEventListener('click', () => {
            this.loadRounds();
        });

        // 통계 조회 버튼
        document.getElementById('get-stats').addEventListener('click', () => {
            this.getPlayerStatistics();
        });

        // 알림 닫기
        document.getElementById('notification-close').addEventListener('click', () => {
            this.hideNotification();
        });
    }

    setupTabSwitching() {
        const tabs = document.querySelectorAll('.nav-tab');
        const contents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');
                
                // 탭 활성화
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // 콘텐츠 표시
                contents.forEach(c => c.classList.remove('active'));
                document.getElementById(targetTab).classList.add('active');
                
                this.currentTab = targetTab;
                
                // 탭별 초기화
                if (targetTab === 'rounds-history') {
                    this.loadRounds();
                } else if (targetTab === 'statistics') {
                    this.loadPlayers();
                }
            });
        });
    }

    generateHoleInputs() {
        const holesOut = document.getElementById('holes-out');
        const holesIn = document.getElementById('holes-in');

        // 1-9홀 (아웃코스)
        for (let i = 1; i <= 9; i++) {
            const holeDiv = this.createDetailedHoleInput(i);
            holesOut.appendChild(holeDiv);
        }

        // 10-18홀 (인코스)
        for (let i = 10; i <= 18; i++) {
            const holeDiv = this.createDetailedHoleInput(i);
            holesIn.appendChild(holeDiv);
        }
    }

    createDetailedHoleInput(holeNumber) {
        const div = document.createElement('div');
        div.className = 'hole-detail';
        
        div.innerHTML = `
            <div class="hole-number">${holeNumber}홀</div>
            <div class="par-selector">
                <label for="hole-${holeNumber}-par">Par:</label>
                <select id="hole-${holeNumber}-par" onchange="app.updateParScore(${holeNumber})">
                    <option value="3">파3</option>
                    <option value="4" selected>파4</option>
                    <option value="5">파5</option>
                </select>
            </div>
            <div class="detail-inputs">
                <div class="detail-input">
                    <label for="hole-${holeNumber}-driver">Driver</label>
                    <select id="hole-${holeNumber}-driver" onchange="app.calculateHoleTotal(${holeNumber})">
                        <option value=""></option>
                        <option value="1">GS</option>
                        <option value="2">PA</option>
                        <option value="3">OB</option>
                    </select>
                </div>
                <div class="detail-input">
                    <label for="hole-${holeNumber}-wood">Wood/Util</label>
                    <select id="hole-${holeNumber}-wood" onchange="app.calculateHoleTotal(${holeNumber})">
                        <option value=""></option>
                        <option value="1">Util2</option>
                        <option value="2">PA</option>
                        <option value="3">OB</option>
                    </select>
                </div>
                <div class="detail-input iron-container">
                    <label for="hole-${holeNumber}-iron">Iron</label>
                    <select id="hole-${holeNumber}-iron" onchange="app.calculateHoleTotal(${holeNumber})">
                        <option value=""></option>
                        <option value="1">I3</option>
                        <option value="1">I4</option>
                        <option value="1">I5</option>
                        <option value="1">I6</option>
                        <option value="1">I7</option>
                        <option value="1">I8</option>
                        <option value="1">I9</option>
                        <option value="1">P</option>
                        <option value="1">52</option>
                        <option value="1">56</option>
                        <option value="2">PA</option>
                        <option value="3">OB</option>
                    </select>
                    <div class="iron-selections" id="hole-${holeNumber}-iron-selections">
                        <!-- 추가 Iron 선택들이 여기에 동적으로 추가됩니다 -->
                    </div>
                    <button type="button" class="add-iron-btn" onclick="app.addIronSelection(${holeNumber})">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="detail-input">
                    <label for="hole-${holeNumber}-putter">Putter</label>
                    <input type="number" id="hole-${holeNumber}-putter" 
                           min="0" max="10" value="" placeholder="0" onchange="app.calculateHoleTotal(${holeNumber})">
                </div>
            </div>
            <div class="hole-total">
                <label for="hole-${holeNumber}-total">총 스코어</label>
                <input type="number" id="hole-${holeNumber}-total" 
                       min="1" max="20" value="4" readonly>
            </div>
        `;
        
        return div;
    }

    updateParScore(holeNumber) {
        const par = parseInt(document.getElementById(`hole-${holeNumber}-par`).value);
        document.getElementById(`hole-${holeNumber}-total`).value = par;
    }

    addIronSelection(holeNumber) {
        const container = document.getElementById(`hole-${holeNumber}-iron-selections`);
        const ironCount = container.children.length;
        const ironId = `hole-${holeNumber}-iron-${ironCount}`;
        
        const ironDiv = document.createElement('div');
        ironDiv.className = 'iron-selection-item';
        ironDiv.innerHTML = `
            <select id="${ironId}" onchange="app.calculateHoleTotal(${holeNumber})">
                <option value=""></option>
                <option value="1">I3</option>
                <option value="1">I4</option>
                <option value="1">I5</option>
                <option value="1">I6</option>
                <option value="1">I7</option>
                <option value="1">I8</option>
                <option value="1">I9</option>
                <option value="1">P</option>
                <option value="1">52</option>
                <option value="1">56</option>
                <option value="2">PA</option>
                <option value="3">OB</option>
            </select>
            <button type="button" class="remove-iron-btn" onclick="app.removeIronSelection(${holeNumber}, this)">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(ironDiv);
        this.calculateHoleTotal(holeNumber);
    }

    removeIronSelection(holeNumber, button) {
        const ironItem = button.parentElement;
        const container = ironItem.parentElement;
        container.removeChild(ironItem);
        this.calculateHoleTotal(holeNumber);
    }

    calculateHoleTotal(holeNumber) {
        const driver = parseInt(document.getElementById(`hole-${holeNumber}-driver`).value) || 0;
        const wood = parseInt(document.getElementById(`hole-${holeNumber}-wood`).value) || 0;
        
        // 기본 Iron 선택
        const basicIron = parseInt(document.getElementById(`hole-${holeNumber}-iron`).value) || 0;
        
        // 추가 Iron 선택들의 총합 계산
        const ironSelections = document.querySelectorAll(`#hole-${holeNumber}-iron-selections select`);
        let additionalIronTotal = 0;
        ironSelections.forEach(select => {
            additionalIronTotal += parseInt(select.value) || 0;
        });
        
        const putter = parseInt(document.getElementById(`hole-${holeNumber}-putter`).value) || 0;
        
        const total = driver + wood + basicIron + additionalIronTotal + putter;
        document.getElementById(`hole-${holeNumber}-total`).value = total;
    }

    async submitScore() {
        const playerName = document.getElementById('player-name').value;
        const courseName = document.getElementById('course-name').value;
        const detailedScores = [];

        // 홀별 상세 스코어 수집
        for (let i = 1; i <= 18; i++) {
            const par = parseInt(document.getElementById(`hole-${i}-par`).value) || 4;
            const driver = parseInt(document.getElementById(`hole-${i}-driver`).value) || 0;
            const wood = parseInt(document.getElementById(`hole-${i}-wood`).value) || 0;
            
            // 기본 Iron 선택
            const basicIron = parseInt(document.getElementById(`hole-${i}-iron`).value) || 0;
            
            // 추가 Iron 선택들의 총합 계산
            const ironSelections = document.querySelectorAll(`#hole-${i}-iron-selections select`);
            let additionalIron = 0;
            ironSelections.forEach(select => {
                additionalIron += parseInt(select.value) || 0;
            });
            
            const putter = parseInt(document.getElementById(`hole-${i}-putter`).value) || 0;
            const total = parseInt(document.getElementById(`hole-${i}-total`).value) || par;
            
            if (total < 1) {
                this.showNotification(`${i}홀의 스코어를 올바르게 입력해주세요.`, 'error');
                return;
            }
            
            detailedScores.push({
                par: par,
                driver: driver,
                wood_util: wood,
                iron: basicIron + additionalIron,
                putter: putter,
                total: total
            });
        }

        this.showLoading(true);

        try {
            const response = await fetch('/api/rounds', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    player_name: playerName,
                    course_name: courseName,
                    detailed_scores: detailedScores
                })
            });

            const result = await response.json();

            if (response.ok) {
                this.showNotification('라운드가 성공적으로 저장되었습니다!', 'success');
                this.clearScores();
                this.loadRounds(); // 라운드 기록 새로고침
            } else {
                this.showNotification(result.error || '저장 중 오류가 발생했습니다.', 'error');
            }
        } catch (error) {
            this.showNotification('네트워크 오류가 발생했습니다.', 'error');
            console.error('Error:', error);
        } finally {
            this.showLoading(false);
        }
    }

    clearScores() {
        // 폼 초기화
        document.getElementById('player-name').value = '';
        document.getElementById('course-name').value = '';
        
        // 모든 홀 상세 스코어를 초기화
        for (let i = 1; i <= 18; i++) {
            document.getElementById(`hole-${i}-par`).value = '4';
            document.getElementById(`hole-${i}-driver`).value = '';
            document.getElementById(`hole-${i}-wood`).value = '';
            
            // 기본 Iron 선택 초기화
            document.getElementById(`hole-${i}-iron`).value = '';
            
            // 추가 Iron 선택들 초기화
            const ironContainer = document.getElementById(`hole-${i}-iron-selections`);
            ironContainer.innerHTML = '';
            
            document.getElementById(`hole-${i}-putter`).value = '';
            document.getElementById(`hole-${i}-total`).value = '4';
        }
    }

    async loadRounds() {
        this.showLoading(true);

        try {
            const response = await fetch('/api/rounds');
            const result = await response.json();

            if (response.ok) {
                this.rounds = result.rounds;
                this.displayRounds();
            } else {
                this.showNotification(result.error || '라운드 기록을 불러올 수 없습니다.', 'error');
            }
        } catch (error) {
            this.showNotification('네트워크 오류가 발생했습니다.', 'error');
            console.error('Error:', error);
        } finally {
            this.showLoading(false);
        }
    }

    displayRounds() {
        const tbody = document.getElementById('rounds-tbody');
        tbody.innerHTML = '';

        if (this.rounds.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #6c757d;">저장된 라운드 기록이 없습니다.</td></tr>';
            return;
        }

        this.rounds.forEach((round, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${round.date}</td>
                <td>${round.player_name}</td>
                <td>${round.course_name}</td>
                <td><strong>${round.total_score}타</strong></td>
                <td>${round.handicap}</td>
                <td>
                    <button class="btn btn-secondary" onclick="app.showRoundDetails(${index})">
                        <i class="fas fa-eye"></i> 상세
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    showRoundDetails(index) {
        const round = this.rounds[index];
        const scores = round.scores.map((score, i) => `${i+1}홀: ${score}타`).join(', ');
        
        alert(`라운드 상세 정보:\n\n` +
              `플레이어: ${round.player_name}\n` +
              `코스: ${round.course_name}\n` +
              `날짜: ${round.date}\n` +
              `총 스코어: ${round.total_score}타\n` +
              `핸디캡: ${round.handicap}\n\n` +
              `홀별 스코어:\n${scores}`);
    }

    async loadPlayers() {
        // 라운드 기록에서 고유한 플레이어 목록 추출
        const players = [...new Set(this.rounds.map(round => round.player_name))];
        const select = document.getElementById('stats-player');
        
        select.innerHTML = '<option value="">플레이어를 선택하세요</option>';
        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player;
            option.textContent = player;
            select.appendChild(option);
        });
    }

    async getPlayerStatistics() {
        const playerName = document.getElementById('stats-player').value;
        
        if (!playerName) {
            this.showNotification('플레이어를 선택해주세요.', 'warning');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch(`/api/statistics/${encodeURIComponent(playerName)}`);
            const result = await response.json();

            if (response.ok) {
                this.displayStatistics(result);
            } else {
                this.showNotification(result.error || '통계를 불러올 수 없습니다.', 'error');
            }
        } catch (error) {
            this.showNotification('네트워크 오류가 발생했습니다.', 'error');
            console.error('Error:', error);
        } finally {
            this.showLoading(false);
        }
    }

    displayStatistics(stats) {
        const resultsDiv = document.getElementById('stats-results');
        
        if (stats.message) {
            resultsDiv.innerHTML = `<p style="text-align: center; color: #6c757d;">${stats.message}</p>`;
            return;
        }

        resultsDiv.innerHTML = `
            <h3>${stats.player_name} 통계</h3>
            <div class="stat-item">
                <span class="stat-label">총 라운드 수</span>
                <span class="stat-value">${stats.total_rounds}회</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">평균 스코어</span>
                <span class="stat-value">${stats.average_score}타</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">최고 스코어</span>
                <span class="stat-value">${stats.best_score}타</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">최악 스코어</span>
                <span class="stat-value">${stats.worst_score}타</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">최근 5라운드 평균</span>
                <span class="stat-value">${stats.recent_5_rounds_avg}타</span>
            </div>
        `;
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (show) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const messageEl = document.getElementById('notification-message');
        
        messageEl.textContent = message;
        notification.className = `notification ${type} show`;
        
        // 3초 후 자동 숨김
        setTimeout(() => {
            this.hideNotification();
        }, 3000);
    }

    hideNotification() {
        const notification = document.getElementById('notification');
        notification.classList.remove('show');
    }
}

// 앱 초기화
const app = new GolfScoreApp();
