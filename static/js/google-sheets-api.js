/* Google Sheets API 클라이언트 사이드 연동 */

class GoogleSheetsAPI {
    constructor() {
        this.gapi = null;
        this.isSignedIn = false;
        this.spreadsheetId = '1-8URFWExJVHp-V3bnB-zFtBaxMZUZ5QKvvEVo0CGz10';
        this.usersSheetId = '1-8URFWExJVHp-V3bnB-zFtBaxMZUZ5QKvvEVo0CGz10';
        this.clientId = '38824619592-jpqaqquvbkectvohfs0vnujvi4v7h0sb.apps.googleusercontent.com';
        this.scope = 'https://www.googleapis.com/auth/spreadsheets';
        this.discoveryDocs = ['https://sheets.googleapis.com/$discovery/rest?version=v4'];
        
        // GitHub Pages 환경 감지
        this.isGitHubPages = window.location.hostname === 'sysbaram.github.io' || 
                             window.location.hostname.includes('github.io');
        
        console.log('🌐 GoogleSheetsAPI 환경:', this.isGitHubPages ? 'GitHub Pages' : '로컬');
    }

    async init() {
        return new Promise((resolve, reject) => {
            console.log('🚀 Google Sheets API 초기화 시작...');
            
            // Google API가 이미 로드되었는지 확인
            if (window.gapi && window.gapi.load) {
                console.log('✅ Google API 이미 로드됨');
                this.gapi = window.gapi;
                this.loadClient().then(resolve).catch(reject);
            } else {
                console.log('⏳ Google API 로딩 대기 중...');
                // Google API 로딩 대기 (최대 20초)
                let attempts = 0;
                const maxAttempts = 200;
                const checkGapi = () => {
                    if (window.gapi && window.gapi.load) {
                        console.log('✅ Google API 로딩 완료');
                        this.gapi = window.gapi;
                        this.loadClient().then(resolve).catch(reject);
                    } else if (attempts < maxAttempts) {
                        attempts++;
                        if (attempts % 50 === 0) {
                            console.log(`⏳ Google API 로딩 대기 중... (${attempts}/${maxAttempts})`);
                        }
                        setTimeout(checkGapi, 100);
                    } else {
                        console.error('❌ Google API 로딩 시간 초과');
                        reject(new Error('Google API 로딩 시간 초과. 네트워크 연결을 확인하고 페이지를 새로고침해주세요.'));
                    }
                };
                checkGapi();
            }
        });
    }

    async loadClient() {
        return new Promise((resolve, reject) => {
            console.log('📡 Google API 클라이언트 로딩 중...');
            
            this.gapi.load('client:auth2', async () => {
                try {
                    console.log('🔧 Google API 클라이언트 초기화 중...');
                    
                    // GitHub Pages 환경에 최적화된 설정
                    const initConfig = {
                        clientId: this.clientId,
                        discoveryDocs: this.discoveryDocs,
                        scope: this.scope
                    };
                    
                    if (this.isGitHubPages) {
                        console.log('🔧 GitHub Pages 전용 설정 적용');
                        // GitHub Pages에서는 최소한의 설정만 사용
                        initConfig.ux_mode = 'redirect';
                        initConfig.redirect_uri = window.location.origin;
                        initConfig.prompt = 'select_account';
                        initConfig.fetch_basic_profile = true;
                        initConfig.include_granted_scopes = true;
                    } else {
                        // 로컬 환경에서는 popup 사용
                        initConfig.ux_mode = 'popup';
                        initConfig.redirect_uri = window.location.origin;
                    }
                    
                    await this.gapi.client.init(initConfig);
                    console.log('✅ Google API 초기화 성공');
                    resolve();
                } catch (error) {
                    console.error('❌ Google API 초기화 실패:', error);
                    
                    // 재시도 로직 (더 간단한 설정으로)
                    try {
                        console.log('🔄 Google API 재시도 중...');
                        await this.gapi.client.init({
                            clientId: this.clientId,
                            discoveryDocs: this.discoveryDocs,
                            scope: this.scope
                        });
                        console.log('✅ Google API 재시도 성공');
                        resolve();
                    } catch (retryError) {
                        console.error('❌ Google API 재시도 실패:', retryError);
                        
                        // 최종 재시도 (기본 설정만)
                        try {
                            console.log('🔄 Google API 최종 재시도 중...');
                            await this.gapi.client.init({
                                clientId: this.clientId,
                                scope: this.scope
                            });
                            console.log('✅ Google API 최종 재시도 성공');
                            resolve();
                        } catch (finalError) {
                            console.error('❌ Google API 최종 재시도 실패:', finalError);
                            reject(new Error(`Google API 초기화 실패: ${finalError.message}. 브라우저를 새로고침하거나 다른 브라우저를 시도해주세요.`));
                        }
                    }
                }
            });
        });
    }

    async signIn() {
        try {
            const authInstance = this.gapi.auth2.getAuthInstance();
            
            // GitHub Pages에서는 특별한 설정 적용
            if (this.isGitHubPages) {
                console.log('🔧 GitHub Pages 로그인 설정 적용');
                const options = {
                    prompt: 'select_account',
                    ux_mode: 'redirect',
                    redirect_uri: window.location.origin
                };
                const user = await authInstance.signIn(options);
                this.isSignedIn = true;
                return user;
            } else {
                const user = await authInstance.signIn();
                this.isSignedIn = true;
                return user;
            }
        } catch (error) {
            console.error('로그인 실패:', error);
            
            // GitHub Pages에서 특별한 에러 처리
            if (this.isGitHubPages) {
                if (error.error === 'popup_closed_by_user') {
                    throw new Error('로그인이 취소되었습니다. 다시 시도해주세요.');
                } else if (error.error === 'access_denied') {
                    throw new Error('Google 계정 접근이 거부되었습니다. 권한을 허용해주세요.');
                } else if (error.error === 'immediate_failed') {
                    throw new Error('자동 로그인에 실패했습니다. 수동으로 로그인해주세요.');
                }
            }
            
            throw error;
        }
    }

    async signOut() {
        try {
            const authInstance = this.gapi.auth2.getAuthInstance();
            await authInstance.signOut();
            this.isSignedIn = false;
        } catch (error) {
            console.error('로그아웃 실패:', error);
            throw error;
        }
    }

    isUserSignedIn() {
        const authInstance = this.gapi.auth2.getAuthInstance();
        return authInstance && authInstance.isSignedIn.get();
    }

    getCurrentUser() {
        if (this.isUserSignedIn()) {
            const authInstance = this.gapi.auth2.getAuthInstance();
            const user = authInstance.currentUser.get();
            return {
                id: user.getId(),
                name: user.getBasicProfile().getName(),
                email: user.getBasicProfile().getEmail()
            };
        }
        return null;
    }

    // 사용자 등록
    async registerUser(username, email, password) {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                throw new Error('Google 계정으로 로그인해주세요.');
            }

            // 먼저 사용자명 중복 확인
            const existingUsers = await this.getUsers();
            const isUsernameExists = existingUsers.some(u => u.username === username);
            const isEmailExists = existingUsers.some(u => u.email === email);

            if (isUsernameExists) {
                throw new Error('이미 존재하는 사용자명입니다.');
            }

            if (isEmailExists) {
                throw new Error('이미 존재하는 이메일입니다.');
            }

            const userData = {
                username: username,
                email: email,
                password: password,
                google_id: user.id,
                google_name: user.name,
                google_email: user.email,
                created_at: new Date().toISOString()
            };

            // Users 시트에 사용자 정보 추가
            const response = await this.gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: this.usersSheetId,
                range: 'Users!A:F',
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [[
                        userData.username,
                        userData.email,
                        userData.password,
                        userData.google_id,
                        userData.google_name,
                        userData.created_at
                    ]]
                }
            });

            return { success: true, user: userData };
        } catch (error) {
            console.error('사용자 등록 실패:', error);
            return { success: false, error: error.message };
        }
    }

    // 사용자 목록 조회
    async getUsers() {
        try {
            const response = await this.gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.usersSheetId,
                range: 'Users!A:F'
            });

            const users = response.result.values || [];
            // 헤더 행 제거 (첫 번째 행이 헤더인 경우)
            const dataRows = users.length > 1 ? users.slice(1) : users;
            
            return dataRows.map(row => ({
                username: row[0] || '',
                email: row[1] || '',
                password: row[2] || '',
                google_id: row[3] || '',
                google_name: row[4] || '',
                created_at: row[5] || ''
            }));
        } catch (error) {
            console.error('사용자 목록 조회 실패:', error);
            return [];
        }
    }

    // 사용자 로그인
    async loginUser(usernameOrEmail, password) {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                throw new Error('Google 계정으로 로그인해주세요.');
            }

            // Users 시트에서 사용자 정보 조회
            const users = await this.getUsers();
            const foundUser = users.find(u => 
                u.username === usernameOrEmail || u.email === usernameOrEmail
            );

            if (!foundUser) {
                throw new Error('사용자를 찾을 수 없습니다.');
            }

            if (foundUser.password !== password) {
                throw new Error('비밀번호가 올바르지 않습니다.');
            }

            return { 
                success: true, 
                user: {
                    user_id: foundUser.username,
                    username: foundUser.username,
                    email: foundUser.email
                }
            };
        } catch (error) {
            console.error('로그인 실패:', error);
            return { success: false, error: error.message };
        }
    }

    // 스코어 저장 (간단한 방식)
    async saveScore(scoreData) {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                throw new Error('Google 계정으로 로그인해주세요.');
            }

            const today = new Date().toISOString().split('T')[0];
            const username = user.name || 'Unknown User';
            const email = user.email || 'unknown@example.com';
            
            // 간단한 스코어 데이터 구성
            const scoreRow = [
                today,                                    // A: 날짜
                username,                                 // B: 사용자명
                email,                                    // C: 이메일
                scoreData.course || '',                   // D: 골프장명
                scoreData.total_score || 0,               // E: 총 스코어
                ...(scoreData.detailed_scores || Array(18).fill(0)) // F-W: 18홀 스코어
            ];

            // Score 시트에 데이터 추가
            const response = await this.gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'Score!A:W',
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [scoreRow]
                }
            });

            console.log('✅ 스코어 저장 성공:', response.result);
            return { success: true, message: '스코어가 성공적으로 저장되었습니다.' };
        } catch (error) {
            console.error('스코어 저장 실패:', error);
            return { success: false, error: error.message };
        }
    }

    // 스코어 조회 (간단한 방식)
    async getScores() {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                throw new Error('Google 계정으로 로그인해주세요.');
            }

            const response = await this.gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Score!A:W'
            });

            const rows = response.result.values || [];
            if (rows.length <= 1) return []; // 헤더만 있는 경우

            const scores = [];
            const dataRows = rows.slice(1); // 헤더 제거

            dataRows.forEach((row, index) => {
                if (row.length >= 5) {
                    const detailedScores = row.slice(5, 23) || []; // F-W 컬럼 (18홀 스코어)
                    
                    scores.push({
                        id: `score_${index + 1}`,
                        date: row[0] || '',
                        player_name: row[1] || '',
                        email: row[2] || '',
                        course_name: row[3] || '',
                        total_score: parseInt(row[4]) || 0,
                        detailed_scores: detailedScores.map(score => parseInt(score) || 0)
                    });
                }
            });

            console.log('✅ 스코어 조회 성공:', scores.length, '개');
            return scores;
        } catch (error) {
            console.error('스코어 조회 실패:', error);
            return [];
        }
    }

    // 통계 조회
    async getStatistics() {
        try {
            const scores = await this.getScores();
            if (scores.length === 0) {
                return {
                    totalRounds: 0,
                    averageScore: 0,
                    bestScore: 0,
                    worstScore: 0
                };
            }

            const totalScores = scores.map(s => s.total_score);
            const totalRounds = scores.length;
            const averageScore = Math.round(totalScores.reduce((a, b) => a + b, 0) / totalRounds);
            const bestScore = Math.min(...totalScores);
            const worstScore = Math.max(...totalScores);

            return {
                totalRounds,
                averageScore,
                bestScore,
                worstScore
            };
        } catch (error) {
            console.error('통계 조회 실패:', error);
            return {
                totalRounds: 0,
                averageScore: 0,
                bestScore: 0,
                worstScore: 0
            };
        }
    }
}

// 전역 인스턴스 생성
window.googleSheetsAPI = new GoogleSheetsAPI();
