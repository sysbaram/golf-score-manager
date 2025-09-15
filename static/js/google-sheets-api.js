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
                // Google API 로딩 대기 (최대 10초)
                let attempts = 0;
                const maxAttempts = 100;
                const checkGapi = () => {
                    if (window.gapi && window.gapi.load) {
                        console.log('✅ Google API 로딩 완료');
                        this.gapi = window.gapi;
                        this.loadClient().then(resolve).catch(reject);
                    } else if (attempts < maxAttempts) {
                        attempts++;
                        if (attempts % 25 === 0) {
                            console.log(`⏳ Google API 로딩 대기 중... (${attempts}/${maxAttempts})`);
                        }
                        setTimeout(checkGapi, 100);
                    } else {
                        console.error('❌ Google API 로딩 시간 초과');
                        reject(new Error('Google API 로딩 시간 초과. GitHub Pages에서 Google API를 로드할 수 없습니다.'));
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
                    
                    // GitHub Pages 최적화된 설정
                    const initConfig = {
                        clientId: this.clientId,
                        scope: this.scope
                    };
                    
                    // Discovery Docs는 CORS 문제를 일으킬 수 있으므로 조건부 추가
                    if (!this.isGitHubPages) {
                        initConfig.discoveryDocs = this.discoveryDocs;
                    }
                    
                    if (this.isGitHubPages) {
                        console.log('🔧 GitHub Pages 최적화 설정 적용');
                        // GitHub Pages에서 안정적인 설정
                        initConfig.ux_mode = 'redirect';
                        initConfig.redirect_uri = window.location.origin + window.location.pathname;
                        initConfig.immediate = false;
                        initConfig.cookie_policy = 'single_host_origin';
                    } else {
                        // 로컬 환경 설정
                        initConfig.ux_mode = 'popup';
                        initConfig.redirect_uri = window.location.origin;
                        initConfig.discoveryDocs = this.discoveryDocs;
                    }
                    
                    console.log('🔧 초기화 설정:', initConfig);
                    await this.gapi.client.init(initConfig);
                    
                    // Sheets API 수동 로드 (Discovery Docs 대신)
                    if (this.isGitHubPages) {
                        console.log('📊 Sheets API 수동 로드 중...');
                        await this.gapi.client.load('sheets', 'v4');
                    }
                    
                    console.log('✅ Google API 초기화 성공');
                    resolve();
                } catch (error) {
                    console.error('❌ Google API 초기화 실패:', error);
                    console.error('❌ 오류 상세:', error.stack);
                    
                    // CORS 관련 오류 감지 및 처리
                    const errorMessage = error.message || error.toString();
                    if (errorMessage.includes('CORS') || 
                        errorMessage.includes('Cross-Origin') ||
                        errorMessage.includes('blocked') ||
                        errorMessage.includes('response header') ||
                        error.status === 0) {
                        console.error('🚫 CORS 오류 감지');
                        reject(new Error('CORS: GitHub Pages에서 Google API 접근이 차단되었습니다. 브라우저 설정을 확인하거나 다른 브라우저를 시도해주세요.'));
                        return;
                    }
                    
                    // 재시도 로직 (더 간단한 설정으로)
                    try {
                        console.log('🔄 Google API 최소 설정으로 재시도 중...');
                        await this.gapi.client.init({
                            clientId: this.clientId,
                            scope: this.scope
                        });
                        console.log('✅ Google API 재시도 성공');
                        resolve();
                    } catch (retryError) {
                        console.error('❌ Google API 재시도 실패:', retryError);
                        
                        // 재시도에서도 CORS 오류 확인
                        const retryErrorMessage = retryError.message || retryError.toString();
                        if (retryErrorMessage.includes('CORS') || 
                            retryErrorMessage.includes('Cross-Origin') ||
                            retryErrorMessage.includes('blocked') ||
                            retryErrorMessage.includes('response header') ||
                            retryError.status === 0) {
                            reject(new Error('CORS: GitHub Pages 환경에서 Google API에 접근할 수 없습니다. 오프라인 모드를 사용해주세요.'));
                            return;
                        }
                        
                        // 최종 재시도 (기본 설정만)
                        try {
                            console.log('🔄 Google API 최종 재시도 중...');
                            await this.gapi.client.init({
                                clientId: this.clientId
                            });
                            console.log('✅ Google API 최종 재시도 성공');
                            resolve();
                        } catch (finalError) {
                            console.error('❌ Google API 최종 재시도 실패:', finalError);
                            
                            // 최종 오류에서도 CORS 확인
                            const finalErrorMessage = finalError.message || finalError.toString();
                            if (finalErrorMessage.includes('CORS') || 
                                finalErrorMessage.includes('Cross-Origin') ||
                                finalErrorMessage.includes('blocked') ||
                                finalErrorMessage.includes('response header') ||
                                finalError.status === 0) {
                                reject(new Error('CORS: GitHub Pages에서 Google API를 사용할 수 없습니다. 오프라인 모드로 전환합니다.'));
                            } else {
                                reject(new Error(`Google API 초기화 실패: ${finalError.message}. 브라우저를 새로고침하거나 다른 브라우저를 시도해주세요.`));
                            }
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

// 전역 인스턴스 생성
window.googleSheetsAPI = new GoogleSheetsAPI();
