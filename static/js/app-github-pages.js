// GitHub Pages용 골프 스코어 관리 시스템 JavaScript (Google Sheets API 연동)

class GolfScoreApp {
    constructor() {
        this.currentTab = 'score-input';
        this.rounds = [];
        this.currentUser = null;
        this.googleSheetsAPI = null;
        this.init();
    }

    async init() {
        try {
            // Google Sheets API 초기화
            this.googleSheetsAPI = window.googleSheetsAPI;
            await this.googleSheetsAPI.init();
            
            this.setupEventListeners();
            this.generateHoleInputs();
            this.setupTabSwitching();
            this.setupScoreFormEventListeners();
            this.checkAuthStatus();
            
            console.log('✅ Google Sheets API 초기화 완료');
        } catch (error) {
            console.error('❌ 초기화 실패:', error);
            this.showNotification('Google Sheets API 초기화에 실패했습니다. 페이지를 새로고침해주세요.', 'error');
            
            // 재시도 버튼 추가
            this.addRetryButton();
        }
    }

    addRetryButton() {
        const retryBtn = document.createElement('button');
        retryBtn.textContent = '재시도';
        retryBtn.className = 'btn btn-primary';
        retryBtn.style.marginTop = '1rem';
        retryBtn.onclick = () => {
            location.reload();
        };
        
        const notification = document.getElementById('notification');
        if (notification) {
            notification.appendChild(retryBtn);
        }
    }

    setupEventListeners() {
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
        this.setupModalEvents();
        
        // Google OAuth 버튼
        document.getElementById('google-login-btn').addEventListener('click', () => {
            this.handleGoogleLogin();
        });
    }

    setupModalEvents() {
        // 로그인 모달
        const loginModal = document.getElementById('login-modal');
        const loginForm = document.getElementById('login-form');
        
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // 회원가입 모달
        const registerModal = document.getElementById('register-modal');
        const registerForm = document.getElementById('register-form');
        
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // 모달 닫기
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.hideModal(modal);
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

    setupScoreFormEventListeners() {
        const scoreForm = document.getElementById('score-form');
        if (scoreForm) {
            scoreForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitScore();
            });
        }
    }

    setupTabSwitching() {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                this.switchTab(targetTab);
            });
        });
    }

    switchTab(tabName) {
        // 모든 탭과 콘텐츠 비활성화
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        // 선택된 탭과 콘텐츠 활성화
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-content`).classList.add('active');

        this.currentTab = tabName;

        // 탭별 특별 처리
        if (tabName === 'score-history') {
            this.loadRounds();
        } else if (tabName === 'statistics') {
            this.getPlayerStatistics();
        }
    }

    switchToScoreInputTab() {
        this.switchTab('score-input');
    }

    generateHoleInputs() {
        const container = document.getElementById('hole-inputs');
        if (!container) return;

        container.innerHTML = '';

        for (let i = 1; i <= 18; i++) {
            const holeDiv = document.createElement('div');
            holeDiv.className = 'hole-input';
            holeDiv.innerHTML = `
                <div class="hole-number">${i}홀</div>
                <div class="score-inputs">
                    <div class="input-group">
                        <label>Par</label>
                        <input type="number" id="par-${i}" min="3" max="5" value="4" class="par-input">
                    </div>
                    <div class="input-group">
                        <label>Driver</label>
                        <input type="number" id="driver-${i}" min="0" max="10" value="0" class="driver-input">
                    </div>
                    <div class="input-group">
                        <label>Wood/Util</label>
                        <input type="number" id="wood-${i}" min="0" max="10" value="0" class="wood-input">
                    </div>
                    <div class="input-group">
                        <label>Iron</label>
                        <input type="number" id="iron-${i}" min="0" max="10" value="0" class="iron-input">
                    </div>
                    <div class="input-group">
                        <label>Putter</label>
                        <input type="number" id="putter-${i}" min="0" max="10" value="0" class="putter-input">
                    </div>
                    <div class="input-group total-group">
                        <label>Total</label>
                        <input type="number" id="total-${i}" min="1" max="20" value="4" class="total-input" readonly>
                    </div>
                </div>
            `;
            container.appendChild(holeDiv);

            // 이벤트 리스너 추가
            this.setupHoleInputEvents(i);
        }
    }

    setupHoleInputEvents(holeNumber) {
        const inputs = [
            `driver-${holeNumber}`,
            `wood-${holeNumber}`,
            `iron-${holeNumber}`,
            `putter-${holeNumber}`
        ];

        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', () => {
                    this.calculateHoleTotal(holeNumber);
                });
            }
        });
    }

    calculateHoleTotal(holeNumber) {
        const driver = parseInt(document.getElementById(`driver-${holeNumber}`).value) || 0;
        const wood = parseInt(document.getElementById(`wood-${holeNumber}`).value) || 0;
        const iron = parseInt(document.getElementById(`iron-${holeNumber}`).value) || 0;
        const putter = parseInt(document.getElementById(`putter-${holeNumber}`).value) || 0;
        
        const total = driver + wood + iron + putter;
        document.getElementById(`total-${holeNumber}`).value = total;
    }

    async checkAuthStatus() {
        try {
            if (this.googleSheetsAPI.isUserSignedIn()) {
                this.currentUser = this.googleSheetsAPI.getCurrentUser();
                this.updateUIForLoggedInUser();
                this.loadRounds();
            } else {
                this.updateUIForLoggedOutUser();
            }
        } catch (error) {
            console.error('인증 상태 확인 실패:', error);
            this.updateUIForLoggedOutUser();
        }
    }

    async handleLogin() {
        try {
            const usernameOrEmail = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            if (!usernameOrEmail || !password) {
                this.showNotification('사용자명과 비밀번호를 입력해주세요.', 'error');
                return;
            }

            // 먼저 Google 계정으로 로그인
            await this.googleSheetsAPI.signIn();
            
            // 사용자 인증
            const result = await this.googleSheetsAPI.loginUser(usernameOrEmail, password);
            
            if (result.success) {
                this.currentUser = result.user;
                this.updateUIForLoggedInUser();
                this.hideModal(document.getElementById('login-modal'));
                this.showNotification('로그인 성공!', 'success');
                this.switchToScoreInputTab();
            } else {
                this.showNotification(result.error || '로그인에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('로그인 실패:', error);
            this.showNotification('로그인 중 오류가 발생했습니다.', 'error');
        }
    }

    async handleRegister() {
        try {
            const username = document.getElementById('register-username').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;

            if (!username || !email || !password || !confirmPassword) {
                this.showNotification('모든 필드를 입력해주세요.', 'error');
                return;
            }

            if (password !== confirmPassword) {
                this.showNotification('비밀번호가 일치하지 않습니다.', 'error');
                return;
            }

            // 먼저 Google 계정으로 로그인
            await this.googleSheetsAPI.signIn();
            
            // 사용자 등록
            const result = await this.googleSheetsAPI.registerUser(username, email, password);
            
            if (result.success) {
                this.currentUser = result.user;
                this.updateUIForLoggedInUser();
                this.hideModal(document.getElementById('register-modal'));
                this.showNotification('회원가입 성공!', 'success');
            } else {
                this.showNotification(result.error || '회원가입에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('회원가입 실패:', error);
            this.showNotification('회원가입 중 오류가 발생했습니다.', 'error');
        }
    }

    async handleGoogleLogin() {
        try {
            // Google 계정으로 로그인
            await this.googleSheetsAPI.signIn();
            
            // Google 사용자 정보 가져오기
            const googleUser = this.googleSheetsAPI.getCurrentUser();
            
            if (googleUser) {
                // Google 사용자 정보로 로그인 처리
                this.currentUser = {
                    user_id: googleUser.id,
                    username: googleUser.name,
                    email: googleUser.email
                };
                
                this.updateUIForLoggedInUser();
                this.hideModal(document.getElementById('login-modal'));
                this.showNotification('Google 로그인 성공!', 'success');
                this.switchToScoreInputTab();
            } else {
                this.showNotification('Google 로그인에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('Google 로그인 실패:', error);
            this.showNotification('Google 로그인 중 오류가 발생했습니다.', 'error');
        }
    }

    async logout() {
        try {
            await this.googleSheetsAPI.signOut();
            this.currentUser = null;
            this.updateUIForLoggedOutUser();
            this.showNotification('로그아웃되었습니다.', 'success');
        } catch (error) {
            console.error('로그아웃 실패:', error);
            this.showNotification('로그아웃 중 오류가 발생했습니다.', 'error');
        }
    }

    async submitScore() {
        try {
            if (!this.currentUser) {
                this.showNotification('로그인이 필요합니다.', 'error');
                return;
            }

            const courseName = document.getElementById('course-name').value;
            if (!courseName) {
                this.showNotification('코스명을 입력해주세요.', 'error');
                return;
            }

            const detailedScores = [];
            for (let i = 1; i <= 18; i++) {
                const par = parseInt(document.getElementById(`par-${i}`).value) || 4;
                const driver = parseInt(document.getElementById(`driver-${i}`).value) || 0;
                const wood = parseInt(document.getElementById(`wood-${i}`).value) || 0;
                const iron = parseInt(document.getElementById(`iron-${i}`).value) || 0;
                const putter = parseInt(document.getElementById(`putter-${i}`).value) || 0;
                const total = parseInt(document.getElementById(`total-${i}`).value) || 0;

                detailedScores.push({
                    par: par,
                    driver: driver,
                    wood_util: wood,
                    iron: iron,
                    putter: putter,
                    total: total
                });
            }

            const result = await this.googleSheetsAPI.saveScore(courseName, detailedScores);
            
            if (result.success) {
                this.showNotification(result.message, 'success');
                this.clearScoreForm();
                this.loadRounds();
            } else {
                this.showNotification(result.error || '스코어 저장에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('스코어 저장 실패:', error);
            this.showNotification('스코어 저장 중 오류가 발생했습니다.', 'error');
        }
    }

    async loadRounds() {
        try {
            if (!this.currentUser) {
                this.rounds = [];
                this.displayRounds();
                return;
            }

            this.rounds = await this.googleSheetsAPI.getScores();
            this.displayRounds();
        } catch (error) {
            console.error('라운드 조회 실패:', error);
            this.showNotification('라운드 조회 중 오류가 발생했습니다.', 'error');
        }
    }

    async getPlayerStatistics() {
        try {
            if (!this.currentUser) {
                this.showNotification('로그인이 필요합니다.', 'error');
                return;
            }

            const stats = await this.googleSheetsAPI.getStatistics();
            this.displayStatistics(stats);
        } catch (error) {
            console.error('통계 조회 실패:', error);
            this.showNotification('통계 조회 중 오류가 발생했습니다.', 'error');
        }
    }

    displayRounds() {
        const container = document.getElementById('rounds-list');
        if (!container) return;

        if (this.rounds.length === 0) {
            container.innerHTML = '<p class="no-data">저장된 라운드가 없습니다.</p>';
            return;
        }

        container.innerHTML = this.rounds.map(round => `
            <div class="round-item">
                <div class="round-header">
                    <h3>${round.course_name}</h3>
                    <span class="round-date">${round.date}</span>
                </div>
                <div class="round-score">
                    <span class="total-score">${round.total_score}타</span>
                    <span class="handicap">핸디캡: ${round.handicap}</span>
                </div>
                <div class="round-details">
                    <div class="hole-scores">
                        ${round.scores.map((score, index) => `
                            <span class="hole-score ${score < round.scores[Math.min(...round.scores.map((s, i) => s < 0 ? 999 : s))] ? 'birdie' : score > round.scores[Math.max(...round.scores.map((s, i) => s > 0 ? s : -999))] ? 'bogey' : ''}">
                                ${index + 1}홀: ${score}타
                            </span>
                        `).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    }

    displayStatistics(stats) {
        const container = document.getElementById('statistics-content');
        if (!container) return;

        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <h3>총 라운드</h3>
                    <p class="stat-value">${stats.totalRounds}</p>
                </div>
                <div class="stat-item">
                    <h3>평균 스코어</h3>
                    <p class="stat-value">${stats.averageScore}</p>
                </div>
                <div class="stat-item">
                    <h3>최고 스코어</h3>
                    <p class="stat-value">${stats.bestScore}</p>
                </div>
                <div class="stat-item">
                    <h3>최저 스코어</h3>
                    <p class="stat-value">${stats.worstScore}</p>
                </div>
            </div>
        `;
    }

    clearScoreForm() {
        document.getElementById('course-name').value = '';
        for (let i = 1; i <= 18; i++) {
            document.getElementById(`par-${i}`).value = 4;
            document.getElementById(`driver-${i}`).value = 0;
            document.getElementById(`wood-${i}`).value = 0;
            document.getElementById(`iron-${i}`).value = 0;
            document.getElementById(`putter-${i}`).value = 0;
            document.getElementById(`total-${i}`).value = 4;
        }
    }

    updateUIForLoggedInUser() {
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('register-btn').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'inline-block';
        
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            userInfo.textContent = `안녕하세요, ${this.currentUser.username}님!`;
            userInfo.style.display = 'block';
        }
    }

    updateUIForLoggedOutUser() {
        document.getElementById('login-btn').style.display = 'inline-block';
        document.getElementById('register-btn').style.display = 'inline-block';
        document.getElementById('logout-btn').style.display = 'none';
        
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            userInfo.style.display = 'none';
        }
    }

    showLoginModal() {
        document.getElementById('login-modal').style.display = 'flex';
    }

    showRegisterModal() {
        document.getElementById('register-modal').style.display = 'flex';
    }

    hideModal(modal) {
        modal.style.display = 'none';
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const messageEl = document.getElementById('notification-message');
        
        messageEl.textContent = message;
        notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            this.hideNotification();
        }, 5000);
    }

    hideNotification() {
        const notification = document.getElementById('notification');
        notification.classList.remove('show');
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.golfApp = new GolfScoreApp();
});
