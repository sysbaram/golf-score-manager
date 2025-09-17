/* Google Sheets API 클라이언트 사이드 연동 - Google Identity Services (GIS) */

class GoogleSheetsAPI {
    constructor() {
        this.isSignedIn = false;
        this.spreadsheetId = '1-8URFWExJVHp-V3bnB-zFtBaxMZUZ5QKvvEVo0CGz10';
        this.usersSheetId = '1-8URFWExJVHp-V3bnB-zFtBaxMZUZ5QKvvEVo0CGz10';
        // 웹 애플리케이션 유형 Client ID
        this.clientId = '38824619592-npt5ckpvnqjleo82j7onsrvqi7r39q0h.apps.googleusercontent.com';
        this.scope = 'https://www.googleapis.com/auth/spreadsheets';
        this.discoveryDocs = ['https://sheets.googleapis.com/$discovery/rest?version=v4'];
        
        // 현재 사용자 정보
        this.currentUser = null;
        this.accessToken = null;
        
        // GitHub Pages 환경 감지
        this.isGitHubPages = window.location.hostname === 'sysbaram.github.io' || 
                             window.location.hostname.includes('github.io');
        
        console.log('🌐 GoogleSheetsAPI 환경:', this.isGitHubPages ? 'GitHub Pages' : '로컬');
        console.log('🔑 Client ID:', this.clientId);
        
        // URL에서 토큰 확인 (리디렉션 후)
        this.checkUrlForToken();
    }

    // URL에서 OAuth 토큰 확인
    checkUrlForToken() {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        
        if (accessToken) {
            console.log('🎯 URL에서 액세스 토큰 발견');
            this.accessToken = accessToken;
            this.isSignedIn = true;
            
            // API 클라이언트에 토큰 설정
            if (window.gapi && window.gapi.client) {
                window.gapi.client.setToken({
                    access_token: this.accessToken
                });
            }
            
            // URL 정리 (토큰 제거)
            window.history.replaceState({}, document.title, window.location.pathname);
            
            console.log('✅ 리디렉션을 통한 로그인 성공');
            
            // 강제 UI 업데이트 (다중 시도)
            setTimeout(() => {
                console.log('🔄 1차 UI 업데이트 시도');
                this.triggerUIUpdate();
            }, 100);
            
            setTimeout(() => {
                console.log('🔄 2차 UI 업데이트 시도');
                this.triggerUIUpdate();
            }, 500);
            
            setTimeout(() => {
                console.log('🔄 3차 UI 업데이트 시도 (최종)');
                this.triggerUIUpdate();
            }, 1000);
        }
    }

    async init() {
        return new Promise((resolve, reject) => {
            console.log('🚀 Google API 초기화 시작...');
            
            try {
                // Google API 클라이언트 로딩 확인 (필수)
                if (!window.gapi) {
                    console.error('❌ Google API 클라이언트가 로드되지 않았습니다.');
                    reject(new Error('Google API 클라이언트 스크립트가 로드되지 않았습니다. 네트워크 연결을 확인하거나 페이지를 새로고침해주세요.'));
                    return;
                }

                // Google Identity Services 확인 (선택적)
                const hasGIS = window.google && window.google.accounts && window.google.accounts.oauth2;
                const hasLegacyAuth = window.gapi && window.gapi.auth2;
                
                console.log('🔍 인증 방식 확인:');
                console.log('  - Google Identity Services (GIS):', hasGIS ? '✅ (강제 비활성화)' : '❌');
                console.log('  - Legacy gapi.auth2:', hasLegacyAuth ? '✅' : '❌');
                
                // gapi.auth2가 없으면 강제 로딩 시도
                if (!hasLegacyAuth) {
                    console.warn('⚠️ gapi.auth2가 아직 로드되지 않음 - 강제 로딩 시도');
                    
                    // 강제 로딩 후 재시도
                    setTimeout(() => {
                        this.init().then(resolve).catch(reject);
                    }, 1000);
                    return;
                }

                console.log('✅ Google API 클라이언트 로드 완료');
                
                // 🚨 GitHub Pages CORS 문제로 인해 GIS 강제 비활성화
                this.useGIS = false;
                this.useLegacyAuth = true;
                console.log('🎯 GitHub Pages CORS 문제로 인해 Legacy gapi.auth2 방식 강제 사용');
                
                if (this.useGIS) {
                    console.log('🎯 Google Identity Services (GIS) 방식 사용');
                } else {
                    console.log('🎯 Legacy gapi.auth2 방식 사용');
                }
                
                // 🚨 강제로 auth2 포함하여 로딩
                console.log('🔄 강제로 client:auth2 로딩 시도...');
                
                window.gapi.load('client:auth2', async () => {
                    try {
                        console.log('🔧 Google API 클라이언트 초기화 중...');
                        
                        const initConfig = {
                            discoveryDocs: this.discoveryDocs,
                        };
                        
                        // Legacy 방식인 경우 clientId와 scope 추가
                        if (this.useLegacyAuth) {
                            initConfig.clientId = this.clientId;
                            initConfig.scope = this.scope;
                        }
                        
                        await window.gapi.client.init(initConfig);
                        
                        console.log('✅ Google API 클라이언트 초기화 완료');
                        
                        // 🚨 GitHub Pages CORS 문제로 인해 Legacy 방식만 사용
                        if (this.useLegacyAuth) {
                            // auth2가 로드되었는지 재확인
                            if (!window.gapi.auth2) {
                                console.error('❌ gapi.auth2가 여전히 로드되지 않음');
                                reject(new Error('Google 인증 라이브러리(gapi.auth2)를 로드할 수 없습니다. 네트워크 상태를 확인해주세요.'));
                                return;
                            }
                            
                            // Legacy 방식 - 인스턴스 획득
                            try {
                                this.authInstance = window.gapi.auth2.getAuthInstance();
                                
                                if (!this.authInstance) {
                                    console.error('❌ gapi.auth2 인스턴스 획득 실패');
                                    reject(new Error('Google 인증 인스턴스를 초기화할 수 없습니다.'));
                                    return;
                                }
                                
                                console.log('✅ Legacy gapi.auth2 인스턴스 획득 완료');
                                console.log('🔍 Auth 인스턴스 상태:', {
                                    isSignedIn: this.authInstance.isSignedIn.get(),
                                    currentUser: this.authInstance.currentUser.get()?.getBasicProfile()?.getName()
                                });
                            } catch (error) {
                                console.error('❌ gapi.auth2 인스턴스 오류:', error);
                                reject(new Error(`Google 인증 인스턴스 오류: ${error.message}`));
                                return;
                            }
                        }
                        
                        console.log('🎉 Google API 초기화 성공!');
                        resolve(true);
                        
                    } catch (error) {
                        console.error('❌ Google API 클라이언트 초기화 실패:', error);
                        reject(new Error(`Google API 클라이언트 초기화 실패: ${error.message}`));
                    }
                });
                
            } catch (error) {
                console.error('❌ Google Identity Services 초기화 실패:', error);
                reject(new Error(`Google Identity Services 초기화 실패: ${error.message}`));
            }
        });
    }

    async signIn() {
        return new Promise((resolve, reject) => {
            console.log('🔐 Google OAuth 로그인 시작...');
            
            // 기존 토큰이 있으면 확인
            if (this.accessToken) {
                console.log('✅ 기존 토큰 사용');
                resolve(true);
                return;
            }

            // 🔍 인증 상태 재확인 및 강제 설정
            console.log('🔍 signIn에서 인증 상태 확인:');
            console.log('  - useLegacyAuth:', this.useLegacyAuth);
            console.log('  - authInstance:', !!this.authInstance);
            console.log('  - gapi.auth2:', !!window.gapi?.auth2);

            // gapi.auth2가 있으면 강제로 Legacy 방식 활성화
            if (!this.useLegacyAuth && window.gapi && window.gapi.auth2) {
                console.warn('⚠️ useLegacyAuth가 false지만 gapi.auth2가 존재 - 강제 활성화');
                this.useLegacyAuth = true;
                
                // authInstance도 없으면 다시 획득
                if (!this.authInstance) {
                    try {
                        this.authInstance = window.gapi.auth2.getAuthInstance();
                        console.log('✅ authInstance 강제 획득 완료');
                    } catch (error) {
                        console.error('❌ authInstance 강제 획득 실패:', error);
                    }
                }
            }

            // 🚨 GitHub Pages CORS 문제로 인해 Legacy 방식만 사용
            if (this.useLegacyAuth && this.authInstance) {
                console.log('✅ Legacy 인증 방식 사용 준비 완료');

                try {
                    console.log('🚀 Legacy auth2 로그인 중...');
                    
                    // CORS 문제 해결을 위한 옵션 설정
                    const signInOptions = {
                        prompt: 'select_account'
                    };
                    
                    this.authInstance.signIn(signInOptions).then((googleUser) => {
                        console.log('✅ Legacy 로그인 성공:', googleUser);
                        this.isSignedIn = true;
                        
                        // 토큰 획득
                        const authResponse = googleUser.getAuthResponse();
                        this.accessToken = authResponse.access_token;
                        
                        // API 클라이언트에 토큰 설정
                        window.gapi.client.setToken({
                            access_token: this.accessToken
                        });
                        
                        // UI 업데이트 트리거
                        this.triggerUIUpdate();
                        
                        resolve(true);
                    }).catch((error) => {
                        console.error('❌ Legacy 로그인 실패:', error);
                        
                        // CORS 오류인 경우 특별 처리
                        if (error.error === 'popup_blocked_by_browser' || 
                            error.error === 'popup_closed_by_user' ||
                            (error.message && error.message.includes('Cross-Origin'))) {
                            console.log('🔄 CORS 문제로 인한 팝업 차단 - 사용자에게 직접 링크 제공');
                            
                            // 직접 OAuth URL로 이동
                            const authUrl = `https://accounts.google.com/oauth/v2/auth?` +
                                `client_id=${this.clientId}&` +
                                `redirect_uri=${encodeURIComponent(window.location.origin + window.location.pathname)}&` +
                                `response_type=token&` +
                                `scope=${encodeURIComponent(this.scope)}&` +
                                `prompt=select_account`;
                            
                            window.location.href = authUrl;
                        } else {
                            reject(new Error(`Legacy 로그인 실패: ${error.error || error.message}`));
                        }
                    });
                } catch (error) {
                    console.error('❌ Legacy 로그인 오류:', error);
                    reject(new Error(`Legacy 로그인 오류: ${error.message}`));
                }
            } else {
                console.error('❌ 사용 가능한 인증 방식이 없습니다:');
                console.error('  - useLegacyAuth:', this.useLegacyAuth);
                console.error('  - authInstance:', !!this.authInstance);
                console.error('  - gapi:', !!window.gapi);
                console.error('  - gapi.auth2:', !!window.gapi?.auth2);
                
                let errorMessage = '사용 가능한 인증 방식이 없습니다.';
                
                if (!window.gapi) {
                    errorMessage = 'Google API 클라이언트가 로드되지 않았습니다.';
                } else if (!window.gapi.auth2) {
                    errorMessage = 'Google Auth2 라이브러리가 로드되지 않았습니다.';
                } else if (!this.useLegacyAuth) {
                    errorMessage = 'Legacy 인증 방식이 활성화되지 않았습니다.';
                } else if (!this.authInstance) {
                    errorMessage = 'Google Auth2 인스턴스를 찾을 수 없습니다.';
                }
                
                reject(new Error(errorMessage));
            }
        });
    }

    signOut() {
        console.log('🚪 Google OAuth 로그아웃...');
        
        // 🚨 GitHub Pages CORS 문제로 인해 Legacy 방식만 사용
        if (this.useLegacyAuth && this.authInstance) {
            // Legacy 방식 - 로그아웃
            try {
                this.authInstance.signOut();
                console.log('✅ Legacy 로그아웃 완료');
            } catch (error) {
                console.log('⚠️ Legacy 로그아웃 실패 (무시):', error);
            }
        }
        
        // 상태 초기화
        this.accessToken = null;
        this.isSignedIn = false;
        this.currentUser = null;
        
        // API 클라이언트 토큰 제거
        if (window.gapi && window.gapi.client) {
            window.gapi.client.setToken(null);
        }
        
        // UI 업데이트 트리거
        this.triggerUIUpdate();
        
        console.log('✅ 로그아웃 완료');
    }

    isUserSignedIn() {
        return this.isSignedIn && this.accessToken;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    // UI 업데이트 트리거
    triggerUIUpdate() {
        console.log('🔄 UI 업데이트 트리거');
        
        // GolfApp 인스턴스가 있으면 UI 업데이트 호출
        if (window.golfApp && typeof window.golfApp.updateUIForLoggedInUser === 'function') {
            console.log('✅ GolfApp UI 업데이트 호출');
            window.golfApp.updateUIForLoggedInUser();
            
            // 사용자 정보도 설정
            if (window.golfApp.currentUser) {
                window.golfApp.currentUser = this.currentUser;
            }
        } else {
            console.warn('⚠️ GolfApp 인스턴스 또는 updateUIForLoggedInUser 메서드를 찾을 수 없음');
            
            // 직접 UI 업데이트
            this.directUIUpdate();
        }
    }

    // 직접 UI 업데이트 (백업 방식)
    directUIUpdate() {
        console.log('🔧 직접 UI 업데이트 실행');
        console.log('🔍 현재 로그인 상태:', this.isSignedIn);
        console.log('🔍 현재 토큰:', !!this.accessToken);
        console.log('🔍 현재 사용자:', this.currentUser);
        
        try {
            const loginBtn = document.getElementById('login-btn');
            const registerBtn = document.getElementById('register-btn');
            const logoutBtn = document.getElementById('logout-btn');
            const userInfo = document.getElementById('user-info');
            const loginSection = document.getElementById('login-section');
            const usernameDisplay = document.getElementById('username-display');
            
            console.log('🔍 DOM 요소 확인:');
            console.log('  - loginBtn:', !!loginBtn);
            console.log('  - registerBtn:', !!registerBtn);
            console.log('  - logoutBtn:', !!logoutBtn);
            console.log('  - userInfo:', !!userInfo);
            console.log('  - loginSection:', !!loginSection);
            console.log('  - usernameDisplay:', !!usernameDisplay);
            
            if (this.isSignedIn) {
                console.log('🎯 로그인 상태 UI 업데이트 시작');
                
                // 로그인 상태 UI - 강제 적용
                if (loginBtn) {
                    loginBtn.style.display = 'none';
                    loginBtn.style.visibility = 'hidden';
                    console.log('✅ 로그인 버튼 숨김');
                }
                if (registerBtn) {
                    registerBtn.style.display = 'none';
                    registerBtn.style.visibility = 'hidden';
                    console.log('✅ 회원가입 버튼 숨김');
                }
                if (loginSection) {
                    loginSection.style.display = 'none';
                    loginSection.style.visibility = 'hidden';
                    console.log('✅ 로그인 섹션 숨김');
                }
                if (logoutBtn) {
                    logoutBtn.style.display = 'inline-block';
                    logoutBtn.style.visibility = 'visible';
                    console.log('✅ 로그아웃 버튼 표시');
                }
                
                // 사용자 정보 표시
                if (userInfo) {
                    userInfo.style.display = 'flex';
                    userInfo.style.visibility = 'visible';
                    console.log('✅ 사용자 정보 표시');
                    
                    if (usernameDisplay) {
                        const username = this.currentUser?.username || 'Google 사용자';
                        usernameDisplay.textContent = username;
                        console.log('✅ 사용자명 설정:', username);
                    }
                }
                
                // 메인 콘텐츠 표시 (로그인 후)
                this.showMainContent();
                
                console.log('✅ 로그인 상태 UI 업데이트 완료');
            } else {
                console.log('🔒 로그아웃 상태 UI 업데이트 시작');
                
                // 로그아웃 상태 UI
                if (loginBtn) {
                    loginBtn.style.display = 'inline-block';
                    loginBtn.style.visibility = 'visible';
                }
                if (registerBtn) {
                    registerBtn.style.display = 'inline-block';
                    registerBtn.style.visibility = 'visible';
                }
                if (loginSection) {
                    loginSection.style.display = 'flex';
                    loginSection.style.visibility = 'visible';
                }
                if (logoutBtn) {
                    logoutBtn.style.display = 'none';
                    logoutBtn.style.visibility = 'hidden';
                }
                
                if (userInfo) {
                    userInfo.style.display = 'none';
                    userInfo.style.visibility = 'hidden';
                }
                
                // 메인 콘텐츠 숨김 (로그아웃 후)
                this.hideMainContent();
                
                console.log('✅ 로그아웃 상태 UI 업데이트 완료');
            }
        } catch (error) {
            console.error('❌ 직접 UI 업데이트 실패:', error);
            console.error('❌ 오류 상세:', error.stack);
        }
    }

    // 메인 콘텐츠 표시
    showMainContent() {
        console.log('🎯 메인 콘텐츠 표시 시작');
        
        const navTabs = document.querySelector('.nav-tabs');
        const mainContent = document.querySelector('.main-content');
        const loginPrompt = document.getElementById('login-prompt');
        
        console.log('🔍 메인 콘텐츠 DOM 요소 확인:');
        console.log('  - navTabs:', !!navTabs);
        console.log('  - mainContent:', !!mainContent);
        console.log('  - loginPrompt:', !!loginPrompt);
        
        // 로그인 안내 메시지 강제 숨김
        if (loginPrompt) {
            loginPrompt.style.display = 'none';
            loginPrompt.style.visibility = 'hidden';
            loginPrompt.style.opacity = '0';
            console.log('✅ 로그인 안내 메시지 숨김');
        }
        
        // 네비게이션 강제 표시
        if (navTabs) {
            navTabs.style.display = 'flex';
            navTabs.style.visibility = 'visible';
            navTabs.style.opacity = '1';
            console.log('✅ 네비게이션 탭 표시');
        }
        
        // 메인 콘텐츠 강제 표시
        if (mainContent) {
            mainContent.style.display = 'block';
            mainContent.style.visibility = 'visible';
            mainContent.style.opacity = '1';
            console.log('✅ 메인 콘텐츠 표시');
        }
        
        // 스코어 입력 폼 활성화
        const scoreForm = document.getElementById('score-form');
        if (scoreForm) {
            const inputs = scoreForm.querySelectorAll('input, button');
            inputs.forEach(input => {
                input.disabled = false;
            });
            console.log('✅ 스코어 입력 폼 활성화:', inputs.length, '개 요소');
        }
        
        // 추가 강제 새로고침
        setTimeout(() => {
            if (loginPrompt) loginPrompt.style.display = 'none';
            if (navTabs) navTabs.style.display = 'flex';
            if (mainContent) mainContent.style.display = 'block';
            console.log('🔄 메인 콘텐츠 재확인 완료');
        }, 100);
        
        console.log('✅ 메인 콘텐츠 표시 완료');
    }

    // 메인 콘텐츠 숨김
    hideMainContent() {
        console.log('🔒 메인 콘텐츠 숨김');
        
        const navTabs = document.querySelector('.nav-tabs');
        const mainContent = document.querySelector('.main-content');
        const loginPrompt = document.getElementById('login-prompt');
        
        // 네비게이션과 메인 콘텐츠 숨김
        if (navTabs) {
            navTabs.style.display = 'none';
        }
        
        if (mainContent) {
            mainContent.style.display = 'none';
        }
        
        // 로그인 안내 메시지 표시
        if (loginPrompt) {
            loginPrompt.style.display = 'block';
        }
        
        console.log('✅ 메인 콘텐츠 숨김 완료');
    }

    // 사용자 등록
    async registerUser(username, email, password) {
        console.log('📝 사용자 등록 시작:', { username, email });
        
        try {
            // 먼저 로그인 확인
            if (!this.isUserSignedIn()) {
                console.log('🔐 로그인 필요, 자동 로그인 시도...');
                await this.signIn();
            }

            // 기존 사용자 확인
            const existingUsers = await this.getUsers();
            const existingUser = existingUsers.find(user => 
                user.username === username || user.email === email
            );

            if (existingUser) {
                console.log('❌ 이미 존재하는 사용자');
                return {
                    success: false,
                    error: existingUser.username === username ? 
                        '이미 존재하는 사용자명입니다.' : 
                        '이미 존재하는 이메일입니다.'
                };
            }

            // 새 사용자 추가
            const newUser = {
                username: username,
                email: email,
                password: password, // 실제 환경에서는 해시화 필요
                created_at: new Date().toISOString()
            };

            console.log('👤 새 사용자 정보:', newUser);

            // Google Sheets에 사용자 추가
            // 먼저 헤더가 있는지 확인하고 없으면 추가
            await this.ensureUsersHeader();
            
            const result = await this.appendToSheet('Users', [
                [newUser.username, newUser.email, newUser.password, newUser.created_at]
            ]);

            if (result) {
                console.log('✅ 사용자 등록 성공');
                // 등록 후 현재 사용자로 설정하지 않음 (로그인 별도 필요)
                return {
                    success: true,
                    user: newUser
                };
            } else {
                throw new Error('Google Sheets에 사용자 정보 저장 실패');
            }

        } catch (error) {
            console.error('❌ 사용자 등록 실패:', error);
            return {
                success: false,
                error: error.message || '사용자 등록 중 오류가 발생했습니다.'
            };
        }
    }

    // 사용자 로그인
    async loginUser(usernameOrEmail, password) {
        console.log('🔐 사용자 로그인 시도:', usernameOrEmail);
        
        try {
            // 먼저 Google OAuth 로그인
            if (!this.isUserSignedIn()) {
                console.log('🔐 Google OAuth 로그인 필요...');
                await this.signIn();
            }

            // 사용자 정보 확인
            const users = await this.getUsers();
            const user = users.find(u => 
                (u.username === usernameOrEmail || u.email === usernameOrEmail) && 
                u.password === password
            );

            if (user) {
                this.currentUser = user;
                console.log('✅ 로그인 성공:', user.username);
                return {
                    success: true,
                    user: user
                };
            } else {
                console.log('❌ 로그인 실패: 잘못된 자격증명');
                return {
                    success: false,
                    error: '사용자명/이메일 또는 비밀번호가 올바르지 않습니다.'
                };
            }

        } catch (error) {
            console.error('❌ 로그인 오류:', error);
            return {
                success: false,
                error: error.message || '로그인 중 오류가 발생했습니다.'
            };
        }
    }

    // 사용자 목록 가져오기
    async getUsers() {
        try {
            console.log('👥 사용자 목록 조회 중...');
            const response = await this.readFromSheet('Users', 'A2:D');
            
            if (!response || !response.length) {
                console.log('📝 사용자 없음');
                return [];
            }

            const users = response.map(row => ({
                username: row[0] || '',
                email: row[1] || '',
                password: row[2] || '',
                created_at: row[3] || ''
            })).filter(user => user.username); // 빈 행 제외

            console.log(`👥 사용자 ${users.length}명 조회 완료`);
            return users;

        } catch (error) {
            console.error('❌ 사용자 목록 조회 실패:', error);
            return [];
        }
    }

    // 골프 라운드 저장
    async saveRound(roundData) {
        console.log('⛳ 라운드 저장 시작:', roundData);
        
        try {
            if (!this.currentUser) {
                throw new Error('로그인이 필요합니다.');
            }

            const round = {
                username: this.currentUser.username,
                date: roundData.date,
                course: roundData.course,
                total_score: roundData.total_score,
                detailed_scores: JSON.stringify(roundData.detailed_scores),
                created_at: new Date().toISOString()
            };

            // Google Sheets에 라운드 저장
            // 먼저 헤더가 있는지 확인하고 없으면 추가
            await this.ensureScoresHeader();
            
            const result = await this.appendToSheet('Scores', [
                [round.username, round.date, round.course, round.total_score, round.detailed_scores, round.created_at]
            ]);

            if (result) {
                console.log('✅ 라운드 저장 성공');
                return { success: true, round: round };
            } else {
                throw new Error('Google Sheets에 라운드 저장 실패');
            }

        } catch (error) {
            console.error('❌ 라운드 저장 실패:', error);
            return {
                success: false,
                error: error.message || '라운드 저장 중 오류가 발생했습니다.'
            };
        }
    }

    // 골프 라운드 목록 가져오기
    async getRounds() {
        try {
            if (!this.currentUser) {
                throw new Error('로그인이 필요합니다.');
            }

            console.log('⛳ 라운드 목록 조회 중...');
            const response = await this.readFromSheet('Scores', 'A2:F');
            
            if (!response || !response.length) {
                console.log('📝 라운드 없음');
                return [];
            }

            const allRounds = response.map(row => ({
                username: row[0] || '',
                date: row[1] || '',
                course: row[2] || '',
                total_score: parseInt(row[3]) || 0,
                detailed_scores: row[4] ? JSON.parse(row[4]) : [],
                created_at: row[5] || ''
            })).filter(round => round.username); // 빈 행 제외

            // 현재 사용자의 라운드만 필터링
            const userRounds = allRounds.filter(round => round.username === this.currentUser.username);

            console.log(`⛳ 라운드 ${userRounds.length}개 조회 완료`);
            return userRounds;

        } catch (error) {
            console.error('❌ 라운드 목록 조회 실패:', error);
            return [];
        }
    }

    // Google Sheets에서 데이터 읽기
    async readFromSheet(sheetName, range) {
        try {
            console.log(`📖 시트 읽기: ${sheetName}!${range}`);
            
            const response = await window.gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${sheetName}!${range}`
            });

            console.log('📖 읽기 응답:', response);
            return response.result.values || [];

        } catch (error) {
            console.error(`❌ 시트 읽기 실패 (${sheetName}!${range}):`, error);
            throw error;
        }
    }

    // 사용자 헤더 확인 및 생성
    async ensureUsersHeader() {
        try {
            console.log('🔍 사용자 헤더 확인 중...');
            
            // 첫 번째 행 확인
            const firstRow = await this.readFromSheet('Users', 'A1:D1');
            
            if (!firstRow || !firstRow.length || firstRow[0].length === 0) {
                console.log('📝 사용자 헤더 추가 중...');
                
                // 헤더 추가
                await window.gapi.client.sheets.spreadsheets.values.update({
                    spreadsheetId: this.spreadsheetId,
                    range: 'Users!A1:D1',
                    valueInputOption: 'RAW',
                    resource: {
                        values: [['username', 'email', 'password', 'created_at']]
                    }
                });
                
                console.log('✅ 사용자 헤더 추가 완료');
            } else {
                console.log('✅ 사용자 헤더 이미 존재');
            }
            
        } catch (error) {
            console.warn('⚠️ 헤더 확인/추가 실패 (무시):', error);
        }
    }

    // 스코어 헤더 확인 및 생성
    async ensureScoresHeader() {
        try {
            console.log('🔍 스코어 헤더 확인 중...');
            
            // 첫 번째 행 확인
            const firstRow = await this.readFromSheet('Scores', 'A1:F1');
            
            if (!firstRow || !firstRow.length || firstRow[0].length === 0) {
                console.log('📝 스코어 헤더 추가 중...');
                
                // 헤더 추가
                await window.gapi.client.sheets.spreadsheets.values.update({
                    spreadsheetId: this.spreadsheetId,
                    range: 'Scores!A1:F1',
                    valueInputOption: 'RAW',
                    resource: {
                        values: [['username', 'date', 'course', 'total_score', 'detailed_scores', 'created_at']]
                    }
                });
                
                console.log('✅ 스코어 헤더 추가 완료');
            } else {
                console.log('✅ 스코어 헤더 이미 존재');
            }
            
        } catch (error) {
            console.warn('⚠️ 스코어 헤더 확인/추가 실패 (무시):', error);
        }
    }

    // Google Sheets에 데이터 추가
    async appendToSheet(sheetName, values) {
        try {
            console.log(`📝 시트 추가: ${sheetName}`, values);
            
            const response = await window.gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: `${sheetName}!A:Z`,
                valueInputOption: 'RAW',
                resource: {
                    values: values
                }
            });

            console.log('📝 추가 응답:', response);
            return response.result;

        } catch (error) {
            console.error(`❌ 시트 추가 실패 (${sheetName}):`, error);
            throw error;
        }
    }
}

// 클래스를 전역에 노출
window.GoogleSheetsAPI = GoogleSheetsAPI;

// 전역 인스턴스 생성
window.googleSheetsAPI = new GoogleSheetsAPI();

console.log('✅ GoogleSheetsAPI 클래스 및 인스턴스 전역 노출 완료 (GIS 버전)');
console.log('  - window.GoogleSheetsAPI:', typeof window.GoogleSheetsAPI);
console.log('  - window.googleSheetsAPI:', !!window.googleSheetsAPI);