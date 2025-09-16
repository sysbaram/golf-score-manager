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
            
            // Google API 로딩 상태 확인
            if (!window.gapi) {
                console.error('❌ Google API 스크립트가 로드되지 않았습니다.');
                reject(new Error('Google API 스크립트가 로드되지 않았습니다. 네트워크 연결을 확인하거나 페이지를 새로고침해주세요.'));
                return;
            }
            
            // Google API가 이미 로드되었는지 확인
            if (window.gapi && window.gapi.load) {
                console.log('✅ Google API 이미 로드됨');
                this.gapi = window.gapi;
                this.loadClient().then(resolve).catch(reject);
            } else {
                console.log('⏳ Google API 로딩 대기 중...');
                // Google API 로딩 대기 (최대 5초로 단축)
                let attempts = 0;
                const maxAttempts = 50;
                const checkGapi = () => {
                    if (window.gapi && window.gapi.load) {
                        console.log('✅ Google API 로딩 완료');
                        this.gapi = window.gapi;
                        this.loadClient().then(resolve).catch(reject);
                    } else if (attempts < maxAttempts) {
                        attempts++;
                        if (attempts % 10 === 0) {
                            console.log(`⏳ Google API 로딩 대기 중... (${attempts}/${maxAttempts})`);
                        }
                        setTimeout(checkGapi, 100);
                    } else {
                        console.error('❌ Google API 로딩 시간 초과');
                        reject(new Error('Google API 로딩 시간 초과. 네트워크 연결을 확인하거나 페이지를 새로고침해주세요.'));
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
                    
                    // 간단한 기본 설정만 사용
                    const initConfig = {
                        clientId: this.clientId,
                        scope: this.scope
                    };
                    
                    console.log('🔧 초기화 설정:', initConfig);
                    await this.gapi.client.init(initConfig);
                    
                    // Sheets API 로드 시도 (오류 발생 시 무시)
                    try {
                        console.log('📊 Sheets API 로드 중...');
                        await this.gapi.client.load('sheets', 'v4');
                        console.log('✅ Sheets API 로드 성공');
                    } catch (sheetsError) {
                        console.warn('⚠️ Sheets API 로드 실패 (계속 진행):', sheetsError.message);
                        // Sheets API 로드 실패해도 계속 진행
                    }
                    
                    console.log('✅ Google API 초기화 성공');
                    resolve();
                    
                } catch (error) {
                    console.error('❌ Google API 초기화 실패:', error);
                    
                    // 오류 분석
                    const errorMessage = error.message || error.toString();
                    console.error('❌ 오류 분석:', {
                        message: errorMessage,
                        status: error.status,
                        code: error.code
                    });
                    
                    // CORS 관련 오류 감지
                    if (errorMessage.includes('CORS') || 
                        errorMessage.includes('Cross-Origin') ||
                        errorMessage.includes('blocked') ||
                        errorMessage.includes('response header') ||
                        error.status === 0) {
                        console.error('🚫 CORS 오류 감지 - 오프라인 모드 권장');
                        reject(new Error('CORS 오류: GitHub Pages에서 Google API 접근이 제한됩니다. 오프라인 모드를 사용해주세요.'));
                        return;
                    }
                    
                    // 네트워크 오류 감지
                    if (errorMessage.includes('network') || 
                        errorMessage.includes('fetch') ||
                        errorMessage.includes('timeout')) {
                        console.error('🌐 네트워크 오류 감지');
                        reject(new Error('네트워크 연결 문제입니다. 인터넷 연결을 확인하고 다시 시도해주세요.'));
                        return;
                    }
                    
                    // 기타 오류 - 재시도 없이 바로 실패 처리
                    console.error('❌ Google API 초기화 완전 실패');
                    reject(new Error(`Google API 초기화 실패: ${errorMessage}. 오프라인 모드를 사용해주세요.`));
                }
            });
        });
    }

    async signIn() {
        try {
            const authInstance = this.gapi.auth2.getAuthInstance();
            
            // GitHub Pages에서는 popup 모드 사용 (redirect_uri 문제 해결)
            if (this.isGitHubPages) {
                console.log('🔧 GitHub Pages popup 로그인 설정 적용');
                
                const options = {
                    prompt: 'select_account'
                };
                console.log('🔧 로그인 옵션:', options);
                
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
            console.error('오류 상세 정보:', {
                error: error.error,
                details: error.details,
                message: error.message,
                status: error.status
            });
            
            // OAuth 관련 오류들을 더 포괄적으로 처리
            const errorStr = JSON.stringify(error) + ' ' + (error.message || '') + ' ' + (error.error || '');
            
            if (errorStr.includes('invalid_client') || 
                errorStr.includes('unauthorized_client') ||
                errorStr.includes('401') ||
                errorStr.includes('no registered origin') ||
                errorStr.includes('popup_closed_by_user') ||
                errorStr.includes('access_denied')) {
                
                console.error('🚫 OAuth 인증 오류 감지 - 상세 정보:', errorStr);
                throw new Error('OAuth 인증 오류: ' + (error.message || error.error || 'invalid_client'));
            }
            
            // GitHub Pages에서 특별한 에러 처리
            if (this.isGitHubPages) {
                if (error.error === 'popup_closed_by_user') {
                    throw new Error('OAuth 인증 오류: 로그인이 취소되었습니다.');
                } else if (error.error === 'access_denied') {
                    throw new Error('OAuth 인증 오류: Google 계정 접근이 거부되었습니다.');
                } else if (error.error === 'immediate_failed') {
                    throw new Error('OAuth 인증 오류: 자동 로그인에 실패했습니다.');
                }
            }
            
            throw new Error('OAuth 인증 오류: ' + (error.message || error.error || '알 수 없는 오류'));
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
            console.log('📝 registerUser 시작:', { username, email });
            
            const user = this.getCurrentUser();
            if (!user) {
                throw new Error('Google 계정으로 로그인해주세요.');
            }
            console.log('👤 현재 Google 사용자:', user);

            // 먼저 사용자명 중복 확인
            console.log('🔍 기존 사용자 확인 중...');
            const existingUsers = await this.getUsers();
            console.log('📊 기존 사용자 수:', existingUsers.length);
            
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
            console.log('📝 Google Sheets에 사용자 정보 추가 중...');
            console.log('📊 Spreadsheet ID:', this.usersSheetId);
            console.log('📊 사용자 데이터:', userData);
            
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

            console.log('✅ Google Sheets 응답:', response);
            return { success: true, user: userData };
        } catch (error) {
            console.error('사용자 등록 실패:', error);
            return { success: false, error: error.message };
        }
    }

    // 사용자 목록 조회
    async getUsers() {
        try {
            console.log('📊 Users 시트 조회 시작...');
            
            const response = await this.gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.usersSheetId,
                range: 'Users!A:F'
            });

            console.log('📊 Google Sheets 응답:', response.result);
            
            const users = response.result.values || [];
            console.log('📊 조회된 원본 데이터:', users);
            
            if (users.length === 0) {
                console.log('📊 Users 시트가 비어있습니다.');
                return [];
            }
            
            // 첫 번째 행이 헤더인지 확인
            const hasHeader = users.length > 0 && 
                (users[0][0] === 'username' || users[0][0] === 'Username' || users[0][0] === '사용자명');
            
            const dataRows = hasHeader ? users.slice(1) : users;
            console.log('📊 헤더 제거 후 데이터:', dataRows);
            
            const processedUsers = dataRows.map((row, index) => {
                const user = {
                    username: (row[0] || '').toString().trim(),
                    email: (row[1] || '').toString().trim(),
                    password: (row[2] || '').toString().trim(),
                    google_id: (row[3] || '').toString().trim(),
                    google_name: (row[4] || '').toString().trim(),
                    created_at: (row[5] || '').toString().trim()
                };
                console.log(`📊 처리된 사용자 ${index + 1}:`, user);
                return user;
            }).filter(user => user.username && user.email); // 필수 필드가 있는 사용자만 반환
            
            console.log('📊 최종 사용자 목록:', processedUsers);
            return processedUsers;
        } catch (error) {
            console.error('❌ 사용자 목록 조회 실패:', error);
            console.error('❌ 오류 상세:', error.stack);
            return [];
        }
    }

    // 사용자 로그인
    async loginUser(usernameOrEmail, password) {
        try {
            console.log('🔍 사용자 로그인 시작:', usernameOrEmail);
            
            const user = this.getCurrentUser();
            if (!user) {
                throw new Error('Google 계정으로 먼저 로그인해주세요.');
            }
            
            console.log('👤 현재 Google 사용자:', user);

            // Users 시트에서 사용자 정보 조회
            console.log('📊 Users 시트에서 사용자 정보 조회 중...');
            const users = await this.getUsers();
            console.log('📊 조회된 사용자 수:', users.length);
            
            if (users.length === 0) {
                throw new Error('등록된 사용자가 없습니다. 먼저 회원가입을 해주세요.');
            }
            
            const foundUser = users.find(u => 
                (u.username && u.username.toLowerCase() === usernameOrEmail.toLowerCase()) || 
                (u.email && u.email.toLowerCase() === usernameOrEmail.toLowerCase())
            );
            
            console.log('🔍 찾은 사용자:', foundUser);

            if (!foundUser) {
                console.log('❌ 사용자를 찾을 수 없음. 입력값:', usernameOrEmail);
                console.log('❌ 등록된 사용자들:', users.map(u => ({ username: u.username, email: u.email })));
                throw new Error('사용자를 찾을 수 없습니다. 사용자명 또는 이메일을 확인해주세요.');
            }

            if (!foundUser.password) {
                throw new Error('사용자 비밀번호 정보가 없습니다.');
            }

            if (foundUser.password !== password) {
                console.log('❌ 비밀번호 불일치');
                throw new Error('비밀번호가 올바르지 않습니다.');
            }

            console.log('✅ 로그인 성공');
            return { 
                success: true, 
                user: {
                    user_id: foundUser.username,
                    username: foundUser.username,
                    email: foundUser.email
                }
            };
        } catch (error) {
            console.error('❌ 로그인 실패:', error);
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

// 클래스를 전역에 노출
window.GoogleSheetsAPI = GoogleSheetsAPI;

// 전역 인스턴스 생성
window.googleSheetsAPI = new GoogleSheetsAPI();

console.log('✅ GoogleSheetsAPI 클래스 및 인스턴스 전역 노출 완료');
console.log('  - window.GoogleSheetsAPI:', typeof window.GoogleSheetsAPI);
console.log('  - window.googleSheetsAPI:', !!window.googleSheetsAPI);
