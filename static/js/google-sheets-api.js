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
        
        // GIS 관련 객체들
        this.tokenClient = null;
        this.gapiInited = false;
        this.gisInited = false;
        
        console.log('🌐 GoogleSheetsAPI 초기화 시작');
        console.log('🔑 Client ID:', this.clientId);
    }

    // GAPI 초기화
    async initializeGapi() {
        return new Promise((resolve, reject) => {
            if (!window.gapi) {
                reject(new Error('Google API 클라이언트가 로드되지 않았습니다.'));
                return;
            }

            gapi.load('client', async () => {
                try {
                    await gapi.client.init({
                        discoveryDocs: this.discoveryDocs,
                    });
                    this.gapiInited = true;
                    console.log('✅ GAPI 초기화 완료');
                    resolve();
                } catch (error) {
                    console.error('❌ GAPI 초기화 실패:', error);
                    reject(error);
                }
            });
        });
    }

    // GIS 초기화
    initializeGis() {
        if (!window.google || !window.google.accounts) {
            throw new Error('Google Identity Services가 로드되지 않았습니다.');
        }

        this.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: this.clientId,
            scope: this.scope,
            callback: (tokenResponse) => {
                if (tokenResponse.access_token) {
                    console.log('✅ GIS 토큰 획득 성공');
                    this.accessToken = tokenResponse.access_token;
                    this.isSignedIn = true;
                    
                    // GAPI 클라이언트에 토큰 설정
                    gapi.client.setToken({
                        access_token: this.accessToken
                    });
                    
                    this.triggerUIUpdate();
                } else {
                    console.error('❌ 토큰 획득 실패:', tokenResponse);
                }
            },
        });

        this.gisInited = true;
        console.log('✅ GIS 초기화 완료');
    }

    async init() {
        try {
            console.log('🚀 Google API 초기화 시작...');
            
            // 1. GAPI 초기화
            await this.initializeGapi();
            
            // 2. GIS 초기화
            this.initializeGis();
            
            console.log('✅ Google Sheets API 초기화 완료');
            return true;
        } catch (error) {
            console.error('❌ Google API 초기화 실패:', error);
            throw error;
        }
    }

    // GIS 방식 로그인
    async signIn() {
        try {
            if (!this.gisInited || !this.tokenClient) {
                throw new Error('Google Identity Services가 초기화되지 않았습니다.');
            }

            console.log('🔐 GIS 로그인 시작...');
            
            // 기존 토큰이 있으면 확인
            if (gapi.client.getToken()) {
                console.log('✅ 기존 토큰 발견 - 이미 로그인됨');
                this.isSignedIn = true;
                this.triggerUIUpdate();
                return true;
            }

            // 새 토큰 요청
            this.tokenClient.requestAccessToken({
                prompt: 'consent', // 항상 동의 화면 표시
            });
            
            return true;
        } catch (error) {
            console.error('❌ GIS 로그인 실패:', error);
            throw error;
        }
    }

    // 로그아웃
    signOut() {
        if (this.accessToken) {
            google.accounts.oauth2.revoke(this.accessToken, () => {
                console.log('✅ 토큰 취소 완료');
            });
        }
        
        gapi.client.setToken(null);
        this.accessToken = null;
        this.isSignedIn = false;
        this.currentUser = null;
        
        console.log('✅ 로그아웃 완료');
        this.triggerUIUpdate();
    }

    // UI 업데이트 트리거
    triggerUIUpdate() {
        if (window.golfApp && typeof window.golfApp.updateUI === 'function') {
            window.golfApp.updateUI();
        }
        
        // 커스텀 이벤트 발생
        window.dispatchEvent(new CustomEvent('authStateChanged', {
            detail: { isSignedIn: this.isSignedIn }
        }));
    }

    // 사용자 등록
    async registerUser(userData) {
        try {
            console.log('📝 사용자 등록 시작:', userData);

            // 입력값 검증
            if (!userData.username || !userData.email || !userData.password) {
                throw new Error('사용자명, 이메일, 비밀번호는 필수 항목입니다.');
            }

            // 이메일 형식 검증
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(userData.email)) {
                throw new Error('올바른 이메일 형식을 입력해주세요.');
            }

            // 로그인 확인
            if (!this.isSignedIn) {
                console.log('🔐 로그인이 필요합니다. 자동 로그인 시도...');
                await this.signIn();
                
                // 로그인 완료까지 잠시 대기
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                if (!this.isSignedIn) {
                    throw new Error('Google 로그인이 필요합니다.');
                }
            }

            // 기존 사용자 확인
            const existingUsers = await this.getAllUsers();
            
            // 사용자명 중복 확인 (대소문자 구분 없음)
            const duplicateUsername = existingUsers.find(user => 
                user.username && user.username.toLowerCase() === userData.username.toLowerCase()
            );
            if (duplicateUsername) {
                throw new Error('이미 사용 중인 사용자명입니다.');
            }

            // 이메일 중복 확인 (대소문자 구분 없음)
            const duplicateEmail = existingUsers.find(user => 
                user.email && user.email.toLowerCase() === userData.email.toLowerCase()
            );
            if (duplicateEmail) {
                throw new Error('이미 등록된 이메일입니다.');
            }

            // 헤더 확인 및 생성
            await this.ensureHeaders();

            // 새 사용자 데이터 준비
            const newUser = [
                userData.username,
                userData.email,
                userData.password, // 실제 서비스에서는 해시화 필요
                new Date().toISOString(),
                'active'
            ];

            // Google Sheets에 데이터 추가
            const response = await gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: this.usersSheetId,
                range: 'Users!A:E',
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [newUser]
                }
            });

            console.log('✅ 사용자 등록 성공:', response);
            return {
                success: true,
                message: '회원가입이 완료되었습니다!',
                user: {
                    username: userData.username,
                    email: userData.email,
                    createdAt: newUser[3]
                }
            };

        } catch (error) {
            console.error('❌ 사용자 등록 실패:', error);
            throw new Error(`회원가입 실패: ${error.message}`);
        }
    }

    // 사용자 로그인
    async loginUser(email, password) {
        try {
            console.log('🔐 사용자 로그인 시도:', email);

            // Google OAuth 로그인 확인
            if (!this.isSignedIn) {
                await this.signIn();
                if (!this.isSignedIn) {
                    throw new Error('Google 로그인이 필요합니다.');
                }
            }

            // 모든 사용자 데이터 가져오기
            const users = await this.getAllUsers();
            
            // 이메일과 비밀번호로 사용자 찾기
            const user = users.find(u => 
                u.email && u.email.toLowerCase() === email.toLowerCase() &&
                u.password === password
            );

            if (!user) {
                throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
            }

            if (user.status !== 'active') {
                throw new Error('비활성화된 계정입니다.');
            }

            this.currentUser = user;
            console.log('✅ 로그인 성공:', user.username);
            
            return {
                success: true,
                message: '로그인 성공!',
                user: {
                    username: user.username,
                    email: user.email
                }
            };

        } catch (error) {
            console.error('❌ 로그인 실패:', error);
            throw error;
        }
    }

    // 모든 사용자 데이터 가져오기
    async getAllUsers() {
        try {
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.usersSheetId,
                range: 'Users!A:E'
            });

            const rows = response.result.values || [];
            if (rows.length <= 1) {
                return []; // 헤더만 있거나 데이터 없음
            }

            // 헤더 제외하고 사용자 데이터 변환
            const users = rows.slice(1).map(row => ({
                username: row[0] || '',
                email: row[1] || '',
                password: row[2] || '',
                createdAt: row[3] || '',
                status: row[4] || 'active'
            }));

            return users;
        } catch (error) {
            console.error('❌ 사용자 데이터 조회 실패:', error);
            return [];
        }
    }

    // Users 시트 헤더 확인 및 생성
    async ensureHeaders() {
        try {
            // 기존 데이터 확인
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.usersSheetId,
                range: 'Users!A1:E1'
            });

            const values = response.result.values;
            
            // 헤더가 없거나 불완전한 경우 생성/업데이트
            if (!values || values.length === 0 || values[0].length < 5) {
                console.log('📋 Users 시트 헤더 생성...');
                
                await gapi.client.sheets.spreadsheets.values.update({
                    spreadsheetId: this.usersSheetId,
                    range: 'Users!A1:E1',
                    valueInputOption: 'USER_ENTERED',
                    resource: {
                        values: [['Username', 'Email', 'Password', 'Created At', 'Status']]
                    }
                });

                console.log('✅ Users 시트 헤더 생성 완료');
            }
        } catch (error) {
            console.error('❌ 헤더 생성 실패:', error);
            throw error;
        }
    }

    // 스프레드시트에 데이터 추가
    async appendData(range, values) {
        try {
            const response = await gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: range,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: values
                }
            });
            return response;
        } catch (error) {
            console.error('❌ 데이터 추가 실패:', error);
            throw error;
        }
    }

    // 스프레드시트에서 데이터 읽기
    async readData(range) {
        try {
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: range
            });
            return response.result.values || [];
        } catch (error) {
            console.error('❌ 데이터 읽기 실패:', error);
            throw error;
        }
    }
}

// 전역 객체로 내보내기
window.GoogleSheetsAPI = GoogleSheetsAPI;