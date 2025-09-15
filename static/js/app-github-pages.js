// GitHub Pages용 골프 스코어 관리 시스템 JavaScript (Google Sheets API 연동)

class GolfScoreApp {
    constructor() {
        this.currentTab = 'score-input';
        this.rounds = [];
        this.currentUser = null;
        this.googleSheetsAPI = null;
        this.isInitialized = false;
        this.initializationAttempts = 0;
        this.maxInitializationAttempts = 3; // 5초 → 3초로 단축
        
        // 기본 UI 설정만 먼저 수행
        this.setupBasicUI();
        
        // Google API가 준비될 때까지 대기 후 초기화
        this.waitForGoogleAPIAndInit();
    }

    setupBasicUI() {
        console.log('🎨 기본 UI 설정 중...');
        
        try {
            // 로딩 상태 표시
            this.showLoadingStatus('Google Sheets API 연결 중...');
            
            // DOM 요소 존재 확인
            const loginBtn = document.getElementById('login-btn');
            const registerBtn = document.getElementById('register-btn');
            console.log('🔍 DOM 요소 확인:');
            console.log('  - login-btn:', loginBtn ? '✅' : '❌');
            console.log('  - register-btn:', registerBtn ? '✅' : '❌');
            console.log('  - login-modal:', document.getElementById('login-modal') ? '✅' : '❌');
            console.log('  - register-modal:', document.getElementById('register-modal') ? '✅' : '❌');
            console.log('  - login-form:', document.getElementById('login-form') ? '✅' : '❌');
            console.log('  - register-form:', document.getElementById('register-form') ? '✅' : '❌');
            
            // 기본 이벤트 리스너 설정 (Google API 없이도 동작)
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

    showLoadingStatus(message) {
        // 로딩 상태를 헤더에 표시
        const header = document.querySelector('.header');
        if (header) {
            let loadingDiv = document.getElementById('loading-status');
            if (!loadingDiv) {
                loadingDiv = document.createElement('div');
                loadingDiv.id = 'loading-status';
                loadingDiv.style.cssText = `
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 0.5rem 1rem;
                    text-align: center;
                    font-size: 0.9rem;
                    border-radius: 0 0 10px 10px;
                    margin-bottom: 1rem;
                    animation: pulse 2s infinite;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                `;
                header.appendChild(loadingDiv);
            }
            
            // 메시지와 버튼을 포함한 내용 구성
            loadingDiv.innerHTML = `
                <span>${message}</span>
                <button id="skip-to-offline" style="
                    background: rgba(255, 255, 255, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    padding: 0.3rem 0.8rem;
                    border-radius: 5px;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                " onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'" 
                   onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'">
                    오프라인 모드로 계속
                </button>
            `;
            
            // 오프라인 모드 버튼 이벤트 리스너
            const skipButton = document.getElementById('skip-to-offline');
            if (skipButton) {
                skipButton.addEventListener('click', () => {
                    console.log('🔄 사용자가 수동으로 오프라인 모드 선택');
                    this.enableFallbackMode();
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
            this.initializationAttempts++;
            
            if (window.googleSheetsAPI && window.gapi) {
                console.log('✅ Google API 및 GoogleSheetsAPI 클래스 준비 완료');
                this.showLoadingStatus('Google Sheets API 연결 중...');
                await this.init();
            } else {
                const gapiStatus = window.gapi ? '✅' : '❌';
                const apiClassStatus = window.googleSheetsAPI ? '✅' : '❌';
                console.log(`⏳ 대기 중... gapi: ${gapiStatus}, GoogleSheetsAPI: ${apiClassStatus} (${this.initializationAttempts}/${this.maxInitializationAttempts})`);
                
                if (this.initializationAttempts < this.maxInitializationAttempts) {
                    this.showLoadingStatus(`API 로딩 중... gapi: ${gapiStatus}, API클래스: ${apiClassStatus} (${this.initializationAttempts}/${this.maxInitializationAttempts})`);
                    setTimeout(checkAndInit, 1000);
                } else {
                    console.log('❌ API 로딩 시간 초과, 오프라인 모드 활성화');
                    this.showLoadingStatus('API 연결 실패, 오프라인 모드로 전환 중...');
                    setTimeout(() => {
                        this.enableFallbackMode();
                    }, 500);
                }
            }
        };
        
        // 즉시 확인 후 대기
        setTimeout(checkAndInit, 100); // 더 빠른 초기 확인
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

            // Google Sheets API 클래스 확인
            console.log('🔍 GoogleSheetsAPI 클래스 확인 중...');
            this.googleSheetsAPI = window.googleSheetsAPI;
            if (!this.googleSheetsAPI) {
                console.error('❌ GoogleSheetsAPI 클래스가 로드되지 않았습니다');
                throw new Error('GoogleSheetsAPI 클래스가 로드되지 않았습니다.');
            }
            console.log('✅ GoogleSheetsAPI 클래스 확인 완료');

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
            
            // 초기화 성공 알림
            this.showNotification('Google Sheets API 연결 완료!', 'success');
            
        } catch (error) {
            console.error('❌ 초기화 실패:', error);
            console.error('❌ 에러 상세:', error.stack);
            console.log('📊 실패 시 상태:');
            console.log('  - isInitialized:', this.isInitialized);
            console.log('  - window.gapi:', !!window.gapi);
            console.log('  - window.googleSheetsAPI:', !!window.googleSheetsAPI);

            let errorMessage = 'Google Sheets API 초기화에 실패했습니다.';
            
            // GitHub Pages 환경 감지
            const isGitHubPages = window.location.hostname === 'sysbaram.github.io' || 
                                  window.location.hostname.includes('github.io');
            
            if (isGitHubPages) {
                if (error.message.includes('iframe')) {
                    errorMessage = 'GitHub Pages에서 iframe 보안 정책으로 인해 Google API를 로드할 수 없습니다. 브라우저를 새로고침하거나 다른 브라우저를 시도해주세요.';
                } else if (error.message.includes('network')) {
                    errorMessage = 'GitHub Pages에서 네트워크 연결 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
                } else if (error.message.includes('timeout')) {
                    errorMessage = 'GitHub Pages에서 Google API 로딩 시간이 초과되었습니다. 페이지를 새로고침해주세요.';
                } else if (error.message.includes('gapi')) {
                    errorMessage = 'GitHub Pages에서 Google API를 로드할 수 없습니다. 브라우저를 새로고침하거나 다른 브라우저를 시도해주세요.';
                } else if (error.message.includes('GoogleSheetsAPI')) {
                    errorMessage = 'GitHub Pages에서 Google Sheets API 클래스를 로드할 수 없습니다. 페이지를 새로고침해주세요.';
                } else if (error.message.includes('CORS')) {
                    errorMessage = 'GitHub Pages CORS 정책으로 인해 Google API에 접근할 수 없습니다. 오프라인 모드로 전환합니다.';
                    // CORS 오류 시 자동으로 오프라인 모드 전환
                    setTimeout(() => {
                        this.enableFallbackMode();
                    }, 1000);
                } else {
                    errorMessage = 'GitHub Pages에서 Google Sheets API 초기화에 실패했습니다. 브라우저를 새로고침하거나 다른 브라우저를 시도해주세요.';
                }
            } else {
                if (error.message.includes('iframe')) {
                    errorMessage = '브라우저 보안 설정으로 인해 Google API를 로드할 수 없습니다. 팝업 차단을 해제하고 다시 시도해주세요.';
                } else if (error.message.includes('network')) {
                    errorMessage = '네트워크 연결을 확인하고 다시 시도해주세요.';
                } else if (error.message.includes('timeout')) {
                    errorMessage = 'Google API 로딩 시간이 초과되었습니다. 페이지를 새로고침해주세요.';
                } else if (error.message.includes('GoogleSheetsAPI')) {
                    errorMessage = 'Google Sheets API 클래스를 로드할 수 없습니다. 페이지를 새로고침해주세요.';
                }
            }
            
            this.showNotification(errorMessage, 'error');
            
            // 재시도 버튼 추가
            this.addRetryButton();
        }
    }

    addRetryButton() {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.marginTop = '1rem';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '0.5rem';
        buttonContainer.style.justifyContent = 'center';
        
        const retryBtn = document.createElement('button');
        retryBtn.textContent = '재시도';
        retryBtn.className = 'btn btn-primary';
        retryBtn.onclick = () => {
            this.retryInitialization();
        };
        
        const fallbackBtn = document.createElement('button');
        fallbackBtn.textContent = '오프라인 모드';
        fallbackBtn.className = 'btn btn-secondary';
        fallbackBtn.onclick = () => {
            this.enableFallbackMode();
        };
        
        buttonContainer.appendChild(retryBtn);
        buttonContainer.appendChild(fallbackBtn);
        
        const notification = document.getElementById('notification');
        if (notification) {
            notification.appendChild(buttonContainer);
        }
    }

    async retryInitialization() {
        try {
            console.log('🔄 API 초기화 재시도 중...');
            this.showNotification('API 초기화를 재시도하고 있습니다...', 'info');
            
            // Google Sheets API 재초기화
            if (this.googleSheetsAPI) {
                await this.googleSheetsAPI.init();
                this.setupEventListeners();
                this.generateHoleInputs();
                this.setupTabSwitching();
                this.setupScoreFormEventListeners();
                this.checkAuthStatus();
                
                this.showNotification('API 초기화가 성공적으로 완료되었습니다!', 'success');
                console.log('✅ API 재초기화 성공');
            } else {
                throw new Error('GoogleSheetsAPI가 초기화되지 않았습니다.');
            }
        } catch (error) {
            console.error('❌ API 재초기화 실패:', error);
            this.showNotification('API 재초기화에 실패했습니다. 데모 모드를 사용하거나 페이지를 새로고침해주세요.', 'error');
        }
    }

    enableFallbackMode() {
        console.log('🔄 오프라인 모드 활성화...');
        this.showNotification('오프라인 모드로 전환합니다. 데이터는 로컬에 저장됩니다.', 'info');
        
        // 오프라인 모드 플래그 설정
        this.isDemoMode = true;
        this.isOfflineMode = true;
        
        // 로컬 스토리지 키
        this.storageKey = 'golf_score_manager_data';
        
        // Google Sheets API 대신 로컬 스토리지 API 사용
        this.googleSheetsAPI = {
            init: () => Promise.resolve(),
            signIn: () => Promise.resolve({ id: 'offline', name: '오프라인 사용자', email: 'offline@example.com' }),
            signOut: () => Promise.resolve(),
            getCurrentUser: () => ({ id: 'offline', name: '오프라인 사용자', email: 'offline@example.com' }),
            registerUser: (username, email, password) => {
                const users = this.getLocalData('users') || [];
                const newUser = { username, email, password, created_at: new Date().toISOString() };
                users.push(newUser);
                this.saveLocalData('users', users);
                return Promise.resolve({ success: true, user: newUser });
            },
            loginUser: (usernameOrEmail, password) => {
                const users = this.getLocalData('users') || [];
                const user = users.find(u => u.username === usernameOrEmail || u.email === usernameOrEmail);
                if (user && user.password === password) {
                    return Promise.resolve({ success: true, user: { username: user.username, email: user.email } });
                }
                return Promise.resolve({ success: false, error: '사용자를 찾을 수 없습니다.' });
            },
            saveScore: (scoreData) => {
                console.log('📊 오프라인 모드: 스코어 저장', scoreData);
                const scores = this.getLocalData('scores') || [];
                const newScore = {
                    id: 'score_' + Date.now(),
                    ...scoreData,
                    saved_at: new Date().toISOString()
                };
                scores.push(newScore);
                this.saveLocalData('scores', scores);
                return Promise.resolve({ success: true });
            },
            loadRounds: () => {
                console.log('📊 오프라인 모드: 라운드 목록 로드');
                const scores = this.getLocalData('scores') || [];
                return Promise.resolve(scores);
            },
            getPlayerStatistics: () => {
                console.log('📊 오프라인 모드: 통계 계산');
                const scores = this.getLocalData('scores') || [];
                if (scores.length === 0) {
                    return Promise.resolve({
                        total_rounds: 0,
                        average_score: 0,
                        best_score: 0,
                        worst_score: 0
                    });
                }
                
                const totalScores = scores.map(s => s.total_score).filter(s => s > 0);
                const totalRounds = totalScores.length;
                const averageScore = totalRounds > 0 ? Math.round(totalScores.reduce((a, b) => a + b, 0) / totalRounds) : 0;
                const bestScore = totalRounds > 0 ? Math.min(...totalScores) : 0;
                const worstScore = totalRounds > 0 ? Math.max(...totalScores) : 0;
                
                return Promise.resolve({
                    total_rounds: totalRounds,
                    average_score: averageScore,
                    best_score: bestScore,
                    worst_score: worstScore
                });
            }
        };
        
        // 앱 초기화
        this.setupEventListeners();
        this.generateHoleInputs();
        this.setupTabSwitching();
        this.setupScoreFormEventListeners();
        this.checkAuthStatus();
        
        // 오프라인 사용자로 자동 로그인
        this.currentUser = { username: 'offline', email: 'offline@example.com' };
        this.updateUIForLoggedInUser();
        
        console.log('✅ 오프라인 모드 활성화 완료');
        
        // 로딩 상태 숨기기
        this.hideLoadingStatus();
        
        this.showNotification('오프라인 모드로 전환되었습니다. 모든 기능을 정상적으로 사용할 수 있습니다!', 'success');
    }
    
    // 로컬 스토리지 헬퍼 메서드
    getLocalData(key) {
        try {
            const data = localStorage.getItem(`${this.storageKey}_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('로컬 데이터 읽기 실패:', error);
            return null;
        }
    }
    
    saveLocalData(key, data) {
        try {
            localStorage.setItem(`${this.storageKey}_${key}`, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('로컬 데이터 저장 실패:', error);
            return false;
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

            // 알림 닫기
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
            if (loginBtn) {
                loginBtn.addEventListener('click', (e) => {
                    console.log('🔐 로그인 버튼 클릭');
                    console.log('📊 현재 상태:');
                    console.log('  - isInitialized:', this.isInitialized);
                    console.log('  - googleSheetsAPI:', !!this.googleSheetsAPI);
                    console.log('  - window.gapi:', !!window.gapi);
                    console.log('  - window.googleSheetsAPI:', !!window.googleSheetsAPI);
                    console.log('  - initializationAttempts:', this.initializationAttempts);
                    console.log('  - maxInitializationAttempts:', this.maxInitializationAttempts);
                    
                    e.preventDefault();
                    try {
                        if (this.isInitialized) {
                            console.log('✅ API 초기화 완료, 로그인 모달 표시');
                            this.showLoginModal();
                        } else {
                            console.log('⏳ API 초기화 중, 대기 메시지 표시');
                            console.log('🔄 강제로 초기화 재시도...');
                            this.waitForGoogleAPIAndInit(); // 강제 재시도
                            this.showNotification('Google Sheets API 연결 중입니다. 잠시만 기다려주세요.', 'info');
                        }
                    } catch (error) {
                        console.error('❌ 로그인 버튼 클릭 처리 중 오류:', error);
                        this.showNotification('로그인 버튼 처리 중 오류가 발생했습니다: ' + error.message, 'error');
                    }
                });
                console.log('✅ 로그인 버튼 이벤트 리스너 설정 완료');
            } else {
                console.error('❌ login-btn 버튼을 찾을 수 없습니다');
            }

            // 회원가입 버튼
            const registerBtn = document.getElementById('register-btn');
            if (registerBtn) {
                registerBtn.addEventListener('click', (e) => {
                    console.log('📝 회원가입 버튼 클릭, isInitialized:', this.isInitialized);
                    e.preventDefault();
                    try {
                        if (this.isInitialized) {
                            console.log('✅ API 초기화 완료, 회원가입 모달 표시');
                            this.showRegisterModal();
                        } else {
                            console.log('⏳ API 초기화 중, 대기 메시지 표시');
                            this.showNotification('Google Sheets API 연결 중입니다. 잠시만 기다려주세요.', 'info');
                        }
                    } catch (error) {
                        console.error('❌ 회원가입 버튼 클릭 처리 중 오류:', error);
                        this.showNotification('회원가입 버튼 처리 중 오류가 발생했습니다: ' + error.message, 'error');
                    }
                });
                console.log('✅ 회원가입 버튼 이벤트 리스너 설정 완료');
            } else {
                console.error('❌ register-btn 버튼을 찾을 수 없습니다');
            }

            // 로그아웃 버튼
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    console.log('🚪 로그아웃 버튼 클릭');
                    e.preventDefault();
                    try {
                        this.logout();
                    } catch (error) {
                        console.error('❌ 로그아웃 처리 중 오류:', error);
                        this.showNotification('로그아웃 처리 중 오류가 발생했습니다: ' + error.message, 'error');
                    }
                });
                console.log('✅ 로그아웃 버튼 이벤트 리스너 설정 완료');
            } else {
                console.error('❌ logout-btn 버튼을 찾을 수 없습니다');
            }

            // 모달 이벤트
            this.setupModalEvents();
            
            // Google OAuth 버튼
            const googleLoginBtn = document.getElementById('google-login-btn');
            if (googleLoginBtn) {
                googleLoginBtn.addEventListener('click', (e) => {
                    console.log('🌐 Google 로그인 버튼 클릭');
                    e.preventDefault();
                    try {
                        this.handleGoogleLogin();
                    } catch (error) {
                        console.error('❌ Google 로그인 처리 중 오류:', error);
                        this.showNotification('Google 로그인 처리 중 오류가 발생했습니다: ' + error.message, 'error');
                    }
                });
                console.log('✅ Google 로그인 버튼 이벤트 리스너 설정 완료');
            } else {
                console.error('❌ google-login-btn 버튼을 찾을 수 없습니다');
            }
            
            console.log('✅ 모든 이벤트 리스너 설정 완료');
            
        } catch (error) {
            console.error('❌ 이벤트 리스너 설정 중 전체 오류:', error);
            console.error('❌ 오류 스택:', error.stack);
        }
    }

    setupModalEvents() {
        console.log('🔧 모달 이벤트 리스너 설정 시작...');
        
        try {
            // 로그인 모달
            const loginModal = document.getElementById('login-modal');
            const loginForm = document.getElementById('login-form');
            
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => {
                    console.log('📝 로그인 폼 제출');
                    e.preventDefault();
                    try {
                        this.handleLogin();
                    } catch (error) {
                        console.error('❌ 로그인 처리 중 오류:', error);
                        this.showNotification('로그인 처리 중 오류가 발생했습니다: ' + error.message, 'error');
                    }
                });
                console.log('✅ 로그인 폼 이벤트 리스너 설정 완료');
            } else {
                console.error('❌ login-form을 찾을 수 없습니다');
            }

            // 회원가입 모달
            const registerModal = document.getElementById('register-modal');
            const registerForm = document.getElementById('register-form');
            
            if (registerForm) {
                registerForm.addEventListener('submit', (e) => {
                    console.log('📝 회원가입 폼 제출');
                    e.preventDefault();
                    try {
                        this.handleRegister();
                    } catch (error) {
                        console.error('❌ 회원가입 처리 중 오류:', error);
                        this.showNotification('회원가입 처리 중 오류가 발생했습니다: ' + error.message, 'error');
                    }
                });
                console.log('✅ 회원가입 폼 이벤트 리스너 설정 완료');
            } else {
                console.error('❌ register-form을 찾을 수 없습니다');
            }

            // 모달 닫기 버튼들
            const modalCloseButtons = document.querySelectorAll('.modal-close');
            console.log(`🔍 모달 닫기 버튼 ${modalCloseButtons.length}개 발견`);
            modalCloseButtons.forEach((btn, index) => {
                btn.addEventListener('click', (e) => {
                    console.log(`🚪 모달 닫기 버튼 ${index + 1} 클릭`);
                    try {
                        const modal = e.target.closest('.modal');
                        if (modal) {
                            this.hideModal(modal);
                        } else {
                            console.error('❌ 상위 모달을 찾을 수 없습니다');
                        }
                    } catch (error) {
                        console.error('❌ 모달 닫기 처리 중 오류:', error);
                    }
                });
            });

            // 모달 배경 클릭으로 닫기
            const modals = document.querySelectorAll('.modal');
            console.log(`🔍 모달 ${modals.length}개 발견`);
            modals.forEach((modal, index) => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        console.log(`🚪 모달 ${index + 1} 배경 클릭으로 닫기`);
                        try {
                            this.hideModal(modal);
                        } catch (error) {
                            console.error('❌ 모달 배경 클릭 처리 중 오류:', error);
                        }
                    }
                });
            });
            
            console.log('✅ 모든 모달 이벤트 리스너 설정 완료');
            
        } catch (error) {
            console.error('❌ 모달 이벤트 리스너 설정 중 전체 오류:', error);
            console.error('❌ 오류 스택:', error.stack);
        }
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
                        <input type="number" id="par-${i}" min="3" max="5" value="4" class="par-input" autocomplete="off">
                    </div>
                    <div class="input-group">
                        <label>Driver</label>
                        <input type="number" id="driver-${i}" min="0" max="10" value="0" class="driver-input" autocomplete="off">
                    </div>
                    <div class="input-group">
                        <label>Wood/Util</label>
                        <input type="number" id="wood-${i}" min="0" max="10" value="0" class="wood-input" autocomplete="off">
                    </div>
                    <div class="input-group">
                        <label>Iron</label>
                        <input type="number" id="iron-${i}" min="0" max="10" value="0" class="iron-input" autocomplete="off">
                    </div>
                    <div class="input-group">
                        <label>Putter</label>
                        <input type="number" id="putter-${i}" min="0" max="10" value="0" class="putter-input" autocomplete="off">
                    </div>
                    <div class="input-group total-group">
                        <label>Total</label>
                        <input type="number" id="total-${i}" min="1" max="20" value="4" class="total-input" autocomplete="off" readonly>
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
            const usernameOrEmail = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value;

            if (!usernameOrEmail || !password) {
                this.showNotification('사용자명과 비밀번호를 입력해주세요.', 'error');
                return;
            }

            console.log('🔐 로그인 시작:', usernameOrEmail);
            this.showNotification('로그인 중...', 'info');

            // Google Sheets API가 초기화되었는지 확인
            if (!this.googleSheetsAPI) {
                throw new Error('Google Sheets API가 초기화되지 않았습니다.');
            }

            // Google 계정으로 로그인
            console.log('📡 Google 계정 로그인 시도...');
            await this.googleSheetsAPI.signIn();
            
            // Google 사용자 정보 가져오기
            const googleUser = this.googleSheetsAPI.getCurrentUser();
            console.log('👤 Google 사용자 정보:', googleUser);
            
            if (!googleUser) {
                throw new Error('Google 로그인에 실패했습니다.');
            }

            // 사용자 인증 (Google Sheets에서 확인)
            console.log('🔍 사용자 인증 확인 중...');
            const result = await this.googleSheetsAPI.loginUser(usernameOrEmail, password);
            console.log('🔍 인증 결과:', result);
            
            if (result.success) {
                this.currentUser = result.user;
                this.updateUIForLoggedInUser();
                this.hideModal(document.getElementById('login-modal'));
                this.showNotification('로그인 성공!', 'success');
                this.switchToScoreInputTab();
                console.log('✅ 로그인 완료:', this.currentUser);
            } else {
                this.showNotification(result.error || '로그인에 실패했습니다.', 'error');
                console.error('❌ 로그인 실패:', result.error);
            }
        } catch (error) {
            console.error('❌ 로그인 오류:', error);
            console.error('❌ 오류 상세:', error.stack);
            
            let errorMessage = '로그인 중 오류가 발생했습니다.';
            if (error.message.includes('Google')) {
                errorMessage = 'Google 로그인에 실패했습니다. 팝업 차단을 해제하고 다시 시도해주세요.';
            } else if (error.message.includes('초기화')) {
                errorMessage = 'Google Sheets API가 초기화되지 않았습니다. 페이지를 새로고침해주세요.';
            } else if (error.message.includes('사용자')) {
                errorMessage = error.message;
            } else if (error.message.includes('비밀번호')) {
                errorMessage = error.message;
            }
            
            this.showNotification(errorMessage, 'error');
        }
    }

    async handleRegister() {
        try {
            const username = document.getElementById('register-username').value.trim();
            const email = document.getElementById('register-email').value.trim();
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

            console.log('📝 회원가입 시작:', username, email);
            this.showNotification('회원가입 중...', 'info');

            // Google Sheets API가 초기화되었는지 확인
            if (!this.googleSheetsAPI) {
                throw new Error('Google Sheets API가 초기화되지 않았습니다.');
            }

            // Google 계정으로 로그인
            console.log('📡 Google 계정 로그인 시도...');
            await this.googleSheetsAPI.signIn();

            // Google 사용자 정보 가져오기
            const googleUser = this.googleSheetsAPI.getCurrentUser();
            console.log('👤 Google 사용자 정보:', googleUser);
            
            if (!googleUser) {
                throw new Error('Google 로그인에 실패했습니다.');
            }

            // 사용자 등록
            console.log('📝 사용자 등록 시도...');
            const result = await this.googleSheetsAPI.registerUser(username, email, password);
            console.log('📝 등록 결과:', result);

            if (result.success) {
                this.currentUser = result.user;
                this.updateUIForLoggedInUser();
                this.hideModal(document.getElementById('register-modal'));
                this.showNotification('회원가입 성공!', 'success');
                console.log('✅ 회원가입 완료:', this.currentUser);
            } else {
                this.showNotification(result.error || '회원가입에 실패했습니다.', 'error');
                console.error('❌ 회원가입 실패:', result.error);
            }
        } catch (error) {
            console.error('❌ 회원가입 오류:', error);
            console.error('❌ 오류 상세:', error.stack);
            
            let errorMessage = '회원가입 중 오류가 발생했습니다.';
            if (error.message.includes('Google')) {
                errorMessage = 'Google 로그인에 실패했습니다. 팝업 차단을 해제하고 다시 시도해주세요.';
            } else if (error.message.includes('초기화')) {
                errorMessage = 'Google Sheets API가 초기화되지 않았습니다. 페이지를 새로고침해주세요.';
            } else if (error.message.includes('존재')) {
                errorMessage = error.message;
            }
            
            this.showNotification(errorMessage, 'error');
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

            // 총 스코어 계산
            const totalScore = detailedScores.reduce((sum, score) => sum + score.total, 0);
            
            // Google Sheets API 형식에 맞게 데이터 구성
            const scoreData = {
                course: courseName,
                total_score: totalScore,
                detailed_scores: detailedScores.map(score => score.total)
            };

            const result = await this.googleSheetsAPI.saveScore(scoreData);
            
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
                    <h3>${round.course_name || 'Unknown Course'}</h3>
                    <span class="round-date">${round.date || 'Unknown Date'}</span>
                </div>
                <div class="round-score">
                    <span class="total-score">${round.total_score || 0}타</span>
                    <span class="handicap">핸디캡: ${round.handicap || 0}</span>
                </div>
                <div class="round-details">
                    <div class="hole-scores">
                        ${(round.detailed_scores || []).map((score, index) => `
                            <span class="hole-score">
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
    console.log('DOM 로드 완료, 앱 초기화 시작...');
    window.golfApp = new GolfScoreApp();
});

// Google API 로딩 완료 후 재초기화 시도
window.addEventListener('load', () => {
    if (window.googleApiLoaded && window.golfApp) {
        console.log('Google API 로딩 완료 후 앱 재초기화...');
        setTimeout(() => {
            window.golfApp.init();
        }, 500);
    }
});
