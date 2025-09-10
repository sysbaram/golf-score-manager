// 골프 스코어 관리 시스템 JavaScript

class GolfScoreApp {
    constructor() {
        this.currentTab = 'score-input';
        this.rounds = [];
        this.currentUser = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.generateHoleInputs();
        this.setupTabSwitching();
        this.setupScoreFormEventListeners(); // 초기 스코어 폼 이벤트 리스너 설정
        this.checkAuthStatus();
    }

    setupEventListeners() {
        // 스코어 폼 이벤트 리스너는 setupScoreFormEventListeners에서 처리

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

        // 로그인 관련 이벤트
        document.getElementById('login-btn').addEventListener('click', () => {
            this.showLoginModal();
        });

        document.getElementById('register-btn').addEventListener('click', () => {
            this.showRegisterModal();
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // 모달 이벤트
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // 모달 닫기
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.hideModal(e.target.closest('.modal'));
            });
        });

        // 모달 배경 클릭으로 닫기
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal);
                }
            });
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

    // ===== 인증 관련 메서드 =====
    
    async checkAuthStatus() {
        // 데모 모드: API 호출 없이 로그아웃 상태로 시작
        console.log('데모 모드: 인증 상태 확인 건너뛰기');
        this.updateUIForLoggedOutUser();
    }

    updateUIForLoggedInUser() {
        document.getElementById('user-info').style.display = 'flex';
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('username-display').textContent = this.currentUser.username;
        
        // 로그인한 사용자만 스코어 입력 가능
        this.loadRounds();
        
        // 스코어 입력 폼 복원
        this.restoreScoreInputForm();
        
        // 스코어 입력 화면으로 자동 이동
        this.switchToScoreInputTab();
    }

    updateUIForLoggedOutUser() {
        document.getElementById('user-info').style.display = 'none';
        document.getElementById('login-section').style.display = 'flex';
        this.currentUser = null;
        
        // 로그인하지 않은 사용자는 로그인 요구 메시지 표시
        this.showLoginRequiredMessage();
    }

    switchToScoreInputTab() {
        // 스코어 입력 탭으로 전환
        const tabs = document.querySelectorAll('.nav-tab');
        const contents = document.querySelectorAll('.tab-content');
        
        // 모든 탭 비활성화
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        
        // 스코어 입력 탭 활성화
        const scoreTab = document.querySelector('[data-tab="score-input"]');
        const scoreContent = document.getElementById('score-input');
        
        if (scoreTab && scoreContent) {
            scoreTab.classList.add('active');
            scoreContent.classList.add('active');
            this.currentTab = 'score-input';
        }
    }

    restoreScoreInputForm() {
        const scoreInput = document.getElementById('score-input');
        const existingMessage = document.getElementById('login-required-message');
        
        // 로그인 요구 메시지 제거
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // 스코어 입력 폼이 이미 있는지 확인
        const existingForm = scoreInput.querySelector('#score-form');
        if (!existingForm) {
            // 스코어 입력 폼 복원
            scoreInput.innerHTML = `
                <div class="card">
                    <h2><i class="fas fa-edit"></i> 새 라운드 기록</h2>
                    <form id="score-form">
                        <div class="form-group">
                            <label for="course-name">코스 이름</label>
                            <input type="text" id="course-name" name="course_name" required>
                        </div>
                        
                        <div class="scores-grid">
                            <h3>홀별 상세 스코어 입력</h3>
                            <div class="detailed-scores-container">
                                <div class="holes-row">
                                    <div class="hole-group">
                                        <h4>아웃코스 (1-9홀)</h4>
                                        <div class="holes" id="holes-out">
                                            <!-- 1-9홀 상세 입력 필드 -->
                                        </div>
                                    </div>
                                    <div class="hole-group">
                                        <h4>인코스 (10-18홀)</h4>
                                        <div class="holes" id="holes-in">
                                            <!-- 10-18홀 상세 입력 필드 -->
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" id="clear-scores" class="btn btn-secondary">
                                <i class="fas fa-eraser"></i> 초기화
                            </button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> 저장
                            </button>
                        </div>
                    </form>
                </div>
            `;
            
            // 이벤트 리스너 재설정
            this.setupScoreFormEventListeners();
            
            // 홀 입력 필드 재생성
            this.generateHoleInputs();
        }
    }

    setupScoreFormEventListeners() {
        // 폼 제출
        const scoreForm = document.getElementById('score-form');
        if (scoreForm) {
            scoreForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitScore();
            });
        }

        // 초기화 버튼
        const clearScoresBtn = document.getElementById('clear-scores');
        if (clearScoresBtn) {
            clearScoresBtn.addEventListener('click', () => {
                this.clearScores();
            });
        }
    }

    showLoginRequiredMessage() {
        const scoreInput = document.getElementById('score-input');
        const existingMessage = document.getElementById('login-required-message');
        
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const message = document.createElement('div');
        message.id = 'login-required-message';
        message.className = 'card';
        message.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-lock" style="font-size: 3rem; color: #6c757d; margin-bottom: 20px;"></i>
                <h3>로그인이 필요합니다</h3>
                <p>스코어를 입력하고 관리하려면 먼저 로그인해주세요.</p>
                <div style="margin-top: 20px;">
                    <button class="btn btn-primary" onclick="app.showLoginModal()">로그인</button>
                    <button class="btn btn-secondary" onclick="app.showRegisterModal()">회원가입</button>
                </div>
            </div>
        `;
        
        scoreInput.innerHTML = '';
        scoreInput.appendChild(message);
    }

    showLoginModal() {
        document.getElementById('login-modal').classList.add('show');
        document.getElementById('login-username').focus();
    }

    showRegisterModal() {
        document.getElementById('register-modal').classList.add('show');
        document.getElementById('register-username').focus();
    }

    hideModal(modal) {
        modal.classList.remove('show');
        // 폼 초기화
        modal.querySelector('form').reset();
    }

    async handleLogin() {
        const usernameOrEmail = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        if (!usernameOrEmail || !password) {
            this.showNotification('사용자명/이메일과 비밀번호를 입력해주세요.', 'error');
            return;
        }

        // 데모 모드 안내
        this.showNotification('🚧 데모 모드: 실제 로그인은 로컬 서버에서만 가능합니다. 데모용 가상 로그인을 진행합니다.', 'warning');
        
        // 데모용 가상 로그인 처리
        setTimeout(() => {
            this.currentUser = { username: usernameOrEmail, email: usernameOrEmail + '@demo.com' };
            this.updateUIForLoggedInUser();
            this.hideModal(document.getElementById('login-modal'));
            this.showNotification('데모 모드: 가상 로그인 완료! (실제 데이터는 저장되지 않습니다)', 'success');
            this.switchToScoreInputTab();
        }, 1500);
    }

    async handleRegister() {
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;

        if (!username || !email || !password || !passwordConfirm) {
            this.showNotification('모든 필드를 입력해주세요.', 'error');
            return;
        }

        if (password !== passwordConfirm) {
            this.showNotification('비밀번호가 일치하지 않습니다.', 'error');
            return;
        }

        if (password.length < 6) {
            this.showNotification('비밀번호는 6자 이상이어야 합니다.', 'error');
            return;
        }

        // 데모 모드 안내
        this.showNotification('🚧 데모 모드: 실제 회원가입은 로컬 서버에서만 가능합니다. 로컬에서 실행해보세요!', 'warning');
        
        // 데모용 가상 로그인 처리
        setTimeout(() => {
            this.currentUser = { username: username, email: email };
            this.updateUIForLoggedInUser();
            this.hideModal(document.getElementById('register-modal'));
            this.showNotification('데모 모드: 가상 로그인 완료! (실제 데이터는 저장되지 않습니다)', 'success');
        }, 1500);
    }

    async logout() {
        // 데모 모드: 가상 로그아웃 처리
        this.currentUser = null;
        this.updateUIForLoggedOutUser();
        this.showNotification('데모 모드: 가상 로그아웃 완료!', 'success');
    }

    // ===== 기존 메서드들 =====

    async submitScore() {
        if (!this.currentUser) {
            this.showNotification('로그인이 필요합니다.', 'error');
            this.showLoginModal();
            return;
        }

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

        // 데모 모드: 가상 저장 처리
        this.showNotification('🚧 데모 모드: 스코어가 가상으로 저장되었습니다! (실제 저장되지 않음)', 'warning');
        
        // 가상 저장 시뮬레이션
        setTimeout(() => {
            this.showNotification('데모 모드: 스코어 입력 완료! 실제 저장은 로컬 서버에서 가능합니다.', 'success');
            this.clearScores();
            this.loadRounds(); // 라운드 기록 새로고침
        }, 1500);
    }

    clearScores() {
        // 폼 초기화
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
        if (!this.currentUser) {
            return;
        }

        // 데모 모드: 가상 라운드 데이터 표시
        this.rounds = [
            {
                date: '2024-01-15',
                player_name: this.currentUser.username,
                course_name: '데모 골프장',
                total_score: 85,
                handicap: 12,
                scores: [4,5,3,4,5,4,3,4,5,4,5,3,4,5,4,3,4,5]
            },
            {
                date: '2024-01-10',
                player_name: this.currentUser.username,
                course_name: '샘플 코스',
                total_score: 92,
                handicap: 15,
                scores: [5,6,4,5,6,5,4,5,6,5,6,4,5,6,5,4,5,6]
            }
        ];
        this.displayRounds();
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


    async getPlayerStatistics() {
        if (!this.currentUser) {
            this.showNotification('로그인이 필요합니다.', 'error');
            this.showLoginModal();
            return;
        }

        // 데모 모드: 가상 통계 데이터 표시
        const demoStats = {
            total_rounds: 5,
            average_score: 88,
            best_score: 82,
            worst_score: 95,
            recent_5_rounds_avg: 86
        };
        
        this.displayStatistics(demoStats);
    }

    displayStatistics(stats) {
        const resultsDiv = document.getElementById('stats-results');
        
        if (stats.message) {
            resultsDiv.innerHTML = `<p style="text-align: center; color: #6c757d;">${stats.message}</p>`;
            return;
        }

        resultsDiv.innerHTML = `
            <h3>내 통계</h3>
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
