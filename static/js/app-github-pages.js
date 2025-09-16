class GolfScoreApp {
    constructor() {
        this.currentUser = null;
        this.googleSheetsAPI = null;
        this.isInitialized = false;
        this.initializationAttempts = 0;
        this.maxInitializationAttempts = 5; // 5초 타임아웃
    }

    setupBasicUI() {
        console.log('🎨 기본 UI 설정 중...');
        
        try {
            // DOM 요소 확인
            const loginBtn = document.getElementById('login-btn');
            const registerBtn = document.getElementById('register-btn');
            console.log('🔍 DOM 요소 확인:');
            console.log('  - login-btn:', loginBtn ? '✅' : '❌');
            console.log('  - register-btn:', registerBtn ? '✅' : '❌');
            
            // 기본 이벤트 리스너 설정
            console.log('🔧 이벤트 리스너 설정 시작...');
            this.setupEventListeners();
            
            console.log('🕳️ 홀 입력 필드 생성 시작...');
            this.generateHoleInputs();
            
            console.log('📑 탭 전환 설정 시작...');
            this.setupTabSwitching();
            
            console.log('📝 스코어 폼 이벤트 설정 시작...');
            this.setupScoreFormEventListeners();
            
            console.log('👤 로그아웃 UI 업데이트 시작...');
            this.updateUIForLoggedOutUser();
            
            console.log('✅ 기본 UI 설정 완료');
            
        } catch (error) {
            console.error('❌ 기본 UI 설정 중 오류:', error);
            console.error('❌ 오류 스택:', error.stack);
            this.showNotification('UI 설정 중 오류가 발생했습니다: ' + error.message, 'error');
        }
    }

    showLoadingStatus(message, showRetry = false) {
        const loadingDiv = document.getElementById('loading-status');
        if (loadingDiv) {
            const buttonStyle = `
                padding: 0.5rem 1rem;
                margin: 0.25rem;
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 0.5rem;
                color: white;
                cursor: pointer;
                font-size: 0.9rem;
                transition: all 0.3s ease;
                margin-left: 0.5rem;
            `;
            
            // 메시지와 버튼을 포함한 내용 구성
            let buttonsHtml = '';
            
            if (showRetry) {
                buttonsHtml += `
                    <button id="retry-connection" style="${buttonStyle}"
                        onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'" 
                        onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'">
                        재시도
                    </button>
                `;
            }
            
            loadingDiv.innerHTML = `
                <span>${message}</span>
                <div style="display: flex; align-items: center;">
                    ${buttonsHtml}
                </div>
            `;
            
            // 재시도 버튼 이벤트 리스너
            const retryButton = document.getElementById('retry-connection');
            if (retryButton) {
                retryButton.addEventListener('click', () => {
                    console.log('🔄 사용자가 재시도 요청');
                    this.retryGoogleAPIConnection();
                });
            }
            
            loadingDiv.style.display = 'flex';
        }
    }

    hideLoadingStatus() {
        const loadingDiv = document.getElementById('loading-status');
        if (loadingDiv) {
            loadingDiv.style.display = 'none';
        }
    }

    async waitForGoogleAPIAndInit() {
        console.log('⏳ Google API 및 GoogleSheetsAPI 클래스 대기 중...');
        
        const checkAndInit = async () => {
            const gapiStatus = window.gapi ? '✅' : '❌';
            
            if (window.googleSheetsAPI && window.gapi) {
                console.log('✅ Google API 및 GoogleSheetsAPI 클래스 준비 완료');
                this.showLoadingStatus('Google Sheets API 연결 중...');
                await this.init();
            } else {
                this.initializationAttempts++;
                const apiClassStatus = window.googleSheetsAPI ? '✅' : '❌';
                console.log(`⏳ 대기 중... gapi: ${gapiStatus}, GoogleSheetsAPI: ${apiClassStatus} (${this.initializationAttempts}/${this.maxInitializationAttempts})`);
                
                if (this.initializationAttempts < this.maxInitializationAttempts) {
                    setTimeout(checkAndInit, 1000);
                } else {
                    console.log('❌ API 로딩 시간 초과, 재시도 옵션 제공');
                    this.showLoadingStatus('Google API 연결에 실패했습니다. 재시도해주세요.', true);
                }
            }
        };
        
        setTimeout(checkAndInit, 100);
    }

    async init() {
        console.log('🚀 init() 메서드 호출됨');
        console.log('📊 init() 시작 시 상태:');
        console.log('  - isInitialized:', this.isInitialized);
        console.log('  - window.gapi:', !!window.gapi);
        console.log('  - window.googleSheetsAPI:', !!window.googleSheetsAPI);
        
        if (this.isInitialized) {
            console.log('⚠️ 이미 초기화됨, 중복 초기화 방지');
            return;
        }

        try {
            console.log('🚀 Google Sheets API 초기화 시작...');

            // Google Sheets API 클래스 생성
            console.log('🔍 GoogleSheetsAPI 클래스 생성 중...');
            if (typeof GoogleSheetsAPI === 'undefined') {
                console.error('❌ GoogleSheetsAPI 클래스가 로드되지 않았습니다');
                throw new Error('GoogleSheetsAPI 클래스가 로드되지 않았습니다.');
            }
            this.googleSheetsAPI = new GoogleSheetsAPI();
            console.log('✅ GoogleSheetsAPI 클래스 생성 완료');

            // Google API 확인
            console.log('🔍 Google API (gapi) 확인 중...');
            if (!window.gapi) {
                console.error('❌ Google API (gapi)가 로드되지 않았습니다');
                throw new Error('Google API (gapi)가 로드되지 않았습니다.');
            }
            console.log('✅ Google API (gapi) 확인 완료');

            console.log('📡 Google Sheets API 초기화 시작...');
            await this.googleSheetsAPI.init();
            console.log('✅ Google Sheets API 초기화 완료');

            // Google API 관련 이벤트 리스너 추가
            console.log('🔧 Google API 이벤트 리스너 설정...');
            this.setupGoogleAPIEventListeners();
            
            console.log('🔐 인증 상태 확인...');
            this.checkAuthStatus();
            
            this.isInitialized = true;
            console.log('✅ 전체 초기화 완료! isInitialized =', this.isInitialized);
            
            // 로딩 상태 숨기기
            this.hideLoadingStatus();
            
            this.showNotification('Google Sheets API 연결이 완료되었습니다!', 'success');
            
        } catch (error) {
            console.error('❌ 초기화 실패:', error);
            console.error('❌ 에러 상세:', error.stack);
            
            // OAuth 관련 오류도 재시도 가능하도록 처리
            this.showLoadingStatus(`API 초기화 실패: ${error.message}`, true);
        }
    }

    // OAuth 설정 가이드 제거됨 - 직접 API 연동 시도

    async retryGoogleAPIConnection() {
        try {
            console.log('🔄 API 초기화 재시도 중...');
            this.showNotification('API 초기화를 재시도하고 있습니다...', 'info');
            
            this.isInitialized = false;
            this.initializationAttempts = 0;
            
            // 기존 Google Sheets API 인스턴스 제거
            this.googleSheetsAPI = null;
            
            await this.init();
            
            if (this.isInitialized && this.googleSheetsAPI) {
                this.showNotification('API 초기화가 성공적으로 완료되었습니다!', 'success');
                console.log('✅ API 재초기화 성공');
            } else {
                throw new Error('GoogleSheetsAPI가 초기화되지 않았습니다.');
            }
        } catch (error) {
            console.error('❌ API 재초기화 실패:', error);
            this.showNotification('API 재초기화에 실패했습니다. 페이지를 새로고침해주세요.', 'error');
        }
    }

    setupEventListeners() {
        console.log('🔧 이벤트 리스너 설정 시작...');
        
        try {
            // 새로고침 버튼
            const refreshBtn = document.getElementById('refresh-rounds');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    console.log('🔄 새로고침 버튼 클릭');
                    this.loadRounds();
                });
                console.log('✅ 새로고침 버튼 이벤트 리스너 설정 완료');
            } else {
                console.error('❌ refresh-rounds 버튼을 찾을 수 없습니다');
            }

            // 통계 조회 버튼
            const statsBtn = document.getElementById('get-stats');
            if (statsBtn) {
                statsBtn.addEventListener('click', () => {
                    console.log('📊 통계 조회 버튼 클릭');
                    this.getPlayerStatistics();
                });
                console.log('✅ 통계 조회 버튼 이벤트 리스너 설정 완료');
            } else {
                console.error('❌ get-stats 버튼을 찾을 수 없습니다');
            }

            // 알림 닫기 버튼
            const notificationClose = document.getElementById('notification-close');
            if (notificationClose) {
                notificationClose.addEventListener('click', () => {
                    console.log('🔔 알림 닫기 버튼 클릭');
                    this.hideNotification();
                });
                console.log('✅ 알림 닫기 버튼 이벤트 리스너 설정 완료');
            } else {
                console.error('❌ notification-close 버튼을 찾을 수 없습니다');
            }

            // 로그인 버튼
            const loginBtn = document.getElementById('login-btn');
            console.log('🔍 login-btn 요소 확인:', loginBtn);
            if (loginBtn) {
                console.log('✅ login-btn 요소 발견, 이벤트 리스너 설정 중...');
                loginBtn.addEventListener('click', (e) => {
                    console.log('🔐 로그인 버튼 클릭됨!');
                    console.log('📊 현재 상태:');
                    console.log('  - isInitialized:', this.isInitialized);
                    console.log('  - googleSheetsAPI:', !!this.googleSheetsAPI);
                    
                    e.preventDefault();
                    
                    if (this.isInitialized && this.googleSheetsAPI) {
                        console.log('✅ API 초기화 완료, 로그인 모달 표시');
                        this.showLoginModal();
                    } else {
                        console.log('❌ API 초기화되지 않음, 설정 가이드 표시');
                        this.showNotification('Google Sheets API가 초기화되지 않았습니다. 재시도 버튼을 클릭해주세요.', 'error');
                    }
                });
                console.log('✅ 로그인 버튼 이벤트 리스너 설정 완료');
            } else {
                console.error('❌ login-btn 버튼을 찾을 수 없습니다');
            }

            // 회원가입 버튼
            const registerBtn = document.getElementById('register-btn');
            console.log('🔍 register-btn 요소 확인:', registerBtn);
            if (registerBtn) {
                console.log('✅ register-btn 요소 발견, 이벤트 리스너 설정 중...');
                registerBtn.addEventListener('click', (e) => {
                    console.log('📝 회원가입 버튼 클릭됨!');
                    console.log('📊 현재 상태:');
                    console.log('  - isInitialized:', this.isInitialized);
                    console.log('  - googleSheetsAPI:', !!this.googleSheetsAPI);
                    
                    e.preventDefault();
                    
                    if (this.isInitialized && this.googleSheetsAPI) {
                        console.log('✅ API 초기화 완료, 회원가입 모달 표시');
                        this.showRegisterModal();
                    } else {
                        console.log('❌ API 초기화되지 않음, 설정 가이드 표시');
                        this.showNotification('Google Sheets API가 초기화되지 않았습니다. 재시도 버튼을 클릭해주세요.', 'error');
                    }
                });
                console.log('✅ 회원가입 버튼 이벤트 리스너 설정 완료');
            } else {
                console.error('❌ register-btn 버튼을 찾을 수 없습니다');
            }

            console.log('✅ 모든 이벤트 리스너 설정 완료');
            
        } catch (error) {
            console.error('❌ 이벤트 리스너 설정 중 오류:', error);
            console.error('❌ 오류 스택:', error.stack);
        }
    }

    setupGoogleAPIEventListeners() {
        console.log('🔧 Google API 이벤트 리스너 설정...');
        
        // 로그아웃 버튼
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                console.log('🚪 로그아웃 버튼 클릭');
                try {
                    await this.googleSheetsAPI.signOut();
                    this.currentUser = null;
                    this.updateUIForLoggedOutUser();
                    this.showNotification('로그아웃되었습니다.', 'info');
                    console.log('✅ 로그아웃 완료');
                } catch (error) {
                    console.error('❌ 로그아웃 실패:', error);
                    this.showNotification('로그아웃 중 오류가 발생했습니다.', 'error');
                }
            });
            console.log('✅ 로그아웃 버튼 이벤트 리스너 설정 완료');
        } else {
            console.log('ℹ️ logout-btn 버튼이 없음 (정상 - 로그아웃 상태)');
        }
    }

    async checkAuthStatus() {
        try {
            // Google Sheets API가 초기화되지 않은 경우 로그아웃 상태로 처리
            if (!this.googleSheetsAPI || !this.isInitialized || typeof this.googleSheetsAPI.isUserSignedIn !== 'function') {
                console.log('⚠️ Google Sheets API가 초기화되지 않음 - 로그아웃 상태로 처리');
                this.currentUser = null;
                this.updateUIForLoggedOutUser();
                return;
            }
            
            // Google Sheets API 사용 가능한 경우
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

    updateUIForLoggedInUser() {
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        
        const userInfo = document.getElementById('user-info');
        if (userInfo && this.currentUser) {
            userInfo.textContent = `안녕하세요, ${this.currentUser.username}님!`;
            userInfo.style.display = 'block';
        }
    }

    updateUIForLoggedOutUser() {
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (registerBtn) registerBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            userInfo.style.display = 'none';
        }
    }

    // 모달 관련 메서드들
    showLoginModal() {
        this.showModal(document.getElementById('login-modal'));
    }

    showRegisterModal() {
        this.showModal(document.getElementById('register-modal'));
    }

    showModal(modal) {
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    hideModal(modal) {
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    // 회원가입 처리
    async handleRegister() {
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value.trim();

        if (!username || !email || !password) {
            this.showNotification('모든 필드를 입력해주세요.', 'error');
            return;
        }

        // Google Sheets API가 초기화되지 않은 경우
        if (!this.googleSheetsAPI || !this.isInitialized) {
            console.error('❌ Google Sheets API가 초기화되지 않았습니다');
            this.showNotification('Google Sheets API가 초기화되지 않았습니다. 재시도 버튼을 클릭해주세요.', 'error');
            return;
        }

        try {
            // Google OAuth 로그인 먼저 수행
            console.log('🔐 Google OAuth 로그인 시도...');
            await this.googleSheetsAPI.signIn();
            console.log('✅ Google OAuth 로그인 성공');

            // Google 사용자 정보 가져오기
            console.log('👤 Google 사용자 정보 가져오기...');
            const googleUser = this.googleSheetsAPI.getCurrentUser();
            console.log('👤 Google 사용자 정보:', googleUser);
            
            if (!googleUser) {
                throw new Error('Google 사용자 정보를 가져올 수 없습니다. 로그인을 다시 시도해주세요.');
            }

            // 사용자 등록
            console.log('📝 Google Sheets에 사용자 등록 시도...');
            const result = await this.googleSheetsAPI.registerUser(username, email, password);
            console.log('📝 등록 결과:', result);
            
            if (!result) {
                throw new Error('등록 결과가 없습니다.');
            }
            
            if (result.success) {
                // 회원가입만 완료하고 로그인 상태로 설정하지 않음
                this.hideModal(document.getElementById('register-modal'));
                this.showNotification('회원가입이 완료되었습니다! 로그인 버튼을 클릭해서 로그인해주세요.', 'success');
                console.log('✅ 회원가입 완료:', result.user);
            } else {
                this.showNotification(result.error || '회원가입에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('❌ 회원가입 오류:', error);
            console.error('❌ 오류 상세:', error.stack);
            
            let errorMessage = '회원가입 중 오류가 발생했습니다.';
            
            // OAuth 관련 오류 처리
            if (error.message.includes('OAuth') || 
                error.message.includes('invalid_client') || 
                error.message.includes('unauthorized_client') ||
                error.message.includes('popup_closed_by_user') ||
                error.message.includes('access_denied') ||
                error.message.includes('Not a valid origin')) {
                errorMessage = 'Google OAuth 설정에 문제가 있습니다. 설정 가이드를 확인해주세요.';
                // OAuth 설정 가이드 제거됨
            } else if (error.message.includes('Google')) {
                errorMessage = 'Google 로그인에 실패했습니다. 팝업 차단을 해제하고 다시 시도해주세요.';
            } else if (error.message.includes('초기화')) {
                errorMessage = 'Google Sheets API가 초기화되지 않았습니다. 페이지를 새로고침해주세요.';
            } else if (error.message.includes('존재')) {
                errorMessage = error.message;
            }
            
            this.showNotification(errorMessage, 'error');
        }
    }

    // 로그인 처리
    async handleLogin() {
        const usernameOrEmail = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();

        if (!usernameOrEmail || !password) {
            this.showNotification('사용자명/이메일과 비밀번호를 입력해주세요.', 'error');
            return;
        }

        // Google Sheets API가 초기화되지 않은 경우
        if (!this.googleSheetsAPI || !this.isInitialized) {
            console.error('❌ Google Sheets API가 초기화되지 않았습니다');
            this.showNotification('Google Sheets API가 초기화되지 않았습니다. 재시도 버튼을 클릭해주세요.', 'error');
            return;
        }

        try {
            // Google OAuth 로그인 먼저 수행
            console.log('🔐 Google OAuth 로그인 시도...');
            await this.googleSheetsAPI.signIn();
            console.log('✅ Google OAuth 로그인 성공');

            // 사용자 로그인
            console.log('👤 Google Sheets에서 사용자 인증 시도...');
            const result = await this.googleSheetsAPI.loginUser(usernameOrEmail, password);
            console.log('👤 로그인 결과:', result);

            if (result.success) {
                this.currentUser = result.user;
                this.hideModal(document.getElementById('login-modal'));
                this.updateUIForLoggedInUser();
                this.loadRounds();
                this.showNotification(`안녕하세요, ${result.user.username}님!`, 'success');
                console.log('✅ 로그인 완료:', result.user);
            } else {
                this.showNotification(result.error || '로그인에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('❌ 로그인 오류:', error);
            
            let errorMessage = '로그인 중 오류가 발생했습니다.';
            
            // OAuth 관련 오류 처리
            if (error.message.includes('OAuth') || 
                error.message.includes('invalid_client') || 
                error.message.includes('unauthorized_client') ||
                error.message.includes('popup_closed_by_user') ||
                error.message.includes('access_denied') ||
                error.message.includes('Not a valid origin')) {
                errorMessage = 'Google OAuth 설정에 문제가 있습니다. 설정 가이드를 확인해주세요.';
                // OAuth 설정 가이드 제거됨
            } else if (error.message.includes('Google')) {
                errorMessage = 'Google 로그인에 실패했습니다. 팝업 차단을 해제하고 다시 시도해주세요.';
            }
            
            this.showNotification(errorMessage, 'error');
        }
    }

    // 알림 표시
    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.getElementById('notification');
        const notificationMessage = document.getElementById('notification-message');
        
        if (notification && notificationMessage) {
            notificationMessage.innerHTML = message;
            notification.className = `notification ${type}`;
            notification.style.display = 'block';
            
            if (duration > 0) {
                setTimeout(() => {
                    this.hideNotification();
                }, duration);
            }
        }
    }

    hideNotification() {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.style.display = 'none';
        }
    }

    // 기타 필수 메서드들 (골프 스코어 관련)
    generateHoleInputs() {
        // 홀 입력 필드 생성 로직
    }

    setupTabSwitching() {
        // 탭 전환 로직
    }

    setupScoreFormEventListeners() {
        // 스코어 폼 이벤트 리스너
    }

    async loadRounds() {
        // 라운드 로드 로직
    }

    async getPlayerStatistics() {
        // 통계 조회 로직
    }
}

// 클래스를 전역에 노출
window.GolfScoreApp = GolfScoreApp;
console.log('✅ GolfScoreApp 클래스 전역 노출 완료:', typeof window.GolfScoreApp);

// DOM 로드 완료 후 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM 로드 완료');
    
    // 기본 UI 먼저 설정
    window.golfApp = new GolfScoreApp();
    window.golfApp.setupBasicUI();
    
    // Google API 로딩 대기 후 초기화
    window.golfApp.waitForGoogleAPIAndInit();
});
