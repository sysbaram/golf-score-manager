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
    }

    async init() {
        return new Promise((resolve, reject) => {
            console.log('🚀 Google Identity Services (GIS) 초기화 시작...');
            
            try {
                // Google Identity Services 로딩 확인
                if (!window.google || !window.google.accounts) {
                    console.error('❌ Google Identity Services가 로드되지 않았습니다.');
                    reject(new Error('Google Identity Services 스크립트가 로드되지 않았습니다. 네트워크 연결을 확인하거나 페이지를 새로고침해주세요.'));
                    return;
                }

                // Google API 클라이언트 로딩 확인
                if (!window.gapi) {
                    console.error('❌ Google API 클라이언트가 로드되지 않았습니다.');
                    reject(new Error('Google API 클라이언트 스크립트가 로드되지 않았습니다. 네트워크 연결을 확인하거나 페이지를 새로고침해주세요.'));
                    return;
                }

                console.log('✅ Google Identity Services 및 API 클라이언트 로드 완료');
                
                // Google API 클라이언트 초기화
                window.gapi.load('client', async () => {
                    try {
                        console.log('🔧 Google API 클라이언트 초기화 중...');
                        
                        await window.gapi.client.init({
                            discoveryDocs: this.discoveryDocs,
                        });
                        
                        console.log('✅ Google API 클라이언트 초기화 완료');
                        
                        // OAuth 2.0 토큰 클라이언트 초기화
                        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
                            client_id: this.clientId,
                            scope: this.scope,
                            callback: (response) => {
                                console.log('🎯 OAuth 응답 받음:', response);
                                if (response.access_token) {
                                    this.accessToken = response.access_token;
                                    this.isSignedIn = true;
                                    console.log('✅ OAuth 토큰 획득 성공');
                                    
                                    // API 클라이언트에 토큰 설정
                                    window.gapi.client.setToken({
                                        access_token: this.accessToken
                                    });
                                    
                                    resolve(true);
                                } else if (response.error) {
                                    console.error('❌ OAuth 토큰 획득 실패:', response.error);
                                    reject(new Error(`OAuth 인증 실패: ${response.error}`));
                                }
                            },
                            error_callback: (error) => {
                                console.error('❌ OAuth 오류:', error);
                                reject(new Error(`OAuth 오류: ${error.message || error}`));
                            }
                        });
                        
                        console.log('✅ OAuth 토큰 클라이언트 초기화 완료');
                        console.log('🎉 Google Identity Services 초기화 성공!');
                        
                        // 토큰 요청 없이 초기화 완료로 처리
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
            
            if (!this.tokenClient) {
                console.error('❌ OAuth 토큰 클라이언트가 초기화되지 않았습니다.');
                reject(new Error('OAuth 토큰 클라이언트가 초기화되지 않았습니다.'));
                return;
            }

            // 기존 토큰이 있으면 확인
            if (this.accessToken) {
                console.log('✅ 기존 토큰 사용');
                resolve(true);
                return;
            }

            // 토큰 클라이언트 콜백 업데이트
            this.tokenClient.callback = (response) => {
                console.log('🎯 로그인 OAuth 응답:', response);
                if (response.access_token) {
                    this.accessToken = response.access_token;
                    this.isSignedIn = true;
                    console.log('✅ 로그인 성공');
                    
                    // API 클라이언트에 토큰 설정
                    window.gapi.client.setToken({
                        access_token: this.accessToken
                    });
                    
                    resolve(true);
                } else if (response.error) {
                    console.error('❌ 로그인 실패:', response.error);
                    reject(new Error(`로그인 실패: ${response.error}`));
                } else {
                    console.error('❌ 알 수 없는 로그인 오류');
                    reject(new Error('알 수 없는 로그인 오류가 발생했습니다.'));
                }
            };

            // 토큰 요청
            try {
                console.log('🚀 OAuth 토큰 요청 중...');
                this.tokenClient.requestAccessToken({
                    prompt: 'consent' // 항상 동의 화면 표시
                });
            } catch (error) {
                console.error('❌ 토큰 요청 실패:', error);
                reject(new Error(`토큰 요청 실패: ${error.message}`));
            }
        });
    }

    signOut() {
        console.log('🚪 Google OAuth 로그아웃...');
        
        if (this.accessToken) {
            // 토큰 폐기
            window.google.accounts.oauth2.revoke(this.accessToken, () => {
                console.log('✅ 토큰 폐기 완료');
            });
        }
        
        // 상태 초기화
        this.accessToken = null;
        this.isSignedIn = false;
        this.currentUser = null;
        
        // API 클라이언트 토큰 제거
        if (window.gapi && window.gapi.client) {
            window.gapi.client.setToken(null);
        }
        
        console.log('✅ 로그아웃 완료');
    }

    isUserSignedIn() {
        return this.isSignedIn && this.accessToken;
    }

    getCurrentUser() {
        return this.currentUser;
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