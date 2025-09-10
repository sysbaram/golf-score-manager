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
    }

    async init() {
        return new Promise((resolve, reject) => {
            // Google API가 이미 로드되었는지 확인
            if (window.gapi && window.gapi.load) {
                this.gapi = window.gapi;
                this.loadClient().then(resolve).catch(reject);
            } else {
                // Google API 로딩 대기 (최대 10초)
                let attempts = 0;
                const maxAttempts = 100;
                const checkGapi = () => {
                    if (window.gapi && window.gapi.load) {
                        this.gapi = window.gapi;
                        this.loadClient().then(resolve).catch(reject);
                    } else if (attempts < maxAttempts) {
                        attempts++;
                        setTimeout(checkGapi, 100);
                    } else {
                        reject(new Error('Google API 로딩 시간 초과'));
                    }
                };
                checkGapi();
            }
        });
    }

    async loadClient() {
        return new Promise((resolve, reject) => {
            this.gapi.load('client:auth2', async () => {
                try {
                    await this.gapi.client.init({
                        clientId: this.clientId,
                        discoveryDocs: this.discoveryDocs,
                        scope: this.scope
                    });
                    console.log('Google API 초기화 성공');
                    resolve();
                } catch (error) {
                    console.error('Google API 초기화 실패:', error);
                    // API 키 없이도 시도해보기
                    try {
                        await this.gapi.client.init({
                            clientId: this.clientId,
                            discoveryDocs: this.discoveryDocs,
                            scope: this.scope
                        });
                        console.log('Google API 초기화 성공 (API 키 없이)');
                        resolve();
                    } catch (retryError) {
                        console.error('Google API 초기화 재시도 실패:', retryError);
                        reject(retryError);
                    }
                }
            });
        });
    }

    async signIn() {
        try {
            const authInstance = this.gapi.auth2.getAuthInstance();
            const user = await authInstance.signIn();
            this.isSignedIn = true;
            return user;
        } catch (error) {
            console.error('로그인 실패:', error);
            throw error;
        }
    }

    async signOut() {
        try {
            const authInstance = this.gapi.auth2.getAuthInstance();
            await authInstance.signIn();
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

    // 사용자 로그인
    async loginUser(usernameOrEmail, password) {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                throw new Error('Google 계정으로 로그인해주세요.');
            }

            // Users 시트에서 사용자 정보 조회
            const response = await this.gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.usersSheetId,
                range: 'Users!A:F'
            });

            const users = response.result.values || [];
            const foundUser = users.find(row => 
                row[0] === usernameOrEmail || row[1] === usernameOrEmail
            );

            if (!foundUser || foundUser[2] !== password) {
                throw new Error('사용자명 또는 비밀번호가 올바르지 않습니다.');
            }

            return { 
                success: true, 
                user: {
                    user_id: foundUser[0],
                    username: foundUser[0],
                    email: foundUser[1]
                }
            };
        } catch (error) {
            console.error('로그인 실패:', error);
            return { success: false, error: error.message };
        }
    }

    // 스코어 저장
    async saveScore(courseName, detailedScores) {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                throw new Error('Google 계정으로 로그인해주세요.');
            }

            const today = new Date().toISOString().split('T')[0];
            const totalScore = detailedScores.reduce((sum, score) => sum + score.total, 0);
            
            // 스코어 데이터 준비
            const scoreData = [
                today,
                user.name,
                courseName,
                totalScore,
                0 // 핸디캡
            ];

            // 상세 스코어 추가
            detailedScores.forEach(score => {
                scoreData.push(
                    score.par,
                    score.driver,
                    score.wood_util,
                    score.iron,
                    score.putter,
                    score.total
                );
            });

            // Score 시트에 데이터 추가
            const response = await this.gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'Score!A:DI',
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [scoreData]
                }
            });

            return { success: true, message: '스코어가 성공적으로 저장되었습니다.' };
        } catch (error) {
            console.error('스코어 저장 실패:', error);
            return { success: false, error: error.message };
        }
    }

    // 스코어 조회
    async getScores() {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                throw new Error('Google 계정으로 로그인해주세요.');
            }

            const response = await this.gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Score!A:DI'
            });

            const rows = response.result.values || [];
            if (rows.length <= 1) return []; // 헤더만 있는 경우

            const scores = [];
            const headers = rows[0];
            const dataRows = rows.slice(1);

            dataRows.forEach(row => {
                if (row.length >= 5) {
                    const detailedScores = [];
                    for (let i = 0; i < 18; i++) {
                        const startIdx = 5 + (i * 6);
                        if (startIdx + 5 < row.length) {
                            detailedScores.push({
                                par: parseInt(row[startIdx]) || 4,
                                driver: parseInt(row[startIdx + 1]) || 0,
                                wood_util: parseInt(row[startIdx + 2]) || 0,
                                iron: parseInt(row[startIdx + 3]) || 0,
                                putter: parseInt(row[startIdx + 4]) || 0,
                                total: parseInt(row[startIdx + 5]) || 0
                            });
                        }
                    }

                    scores.push({
                        date: row[0],
                        player_name: row[1],
                        course_name: row[2],
                        total_score: parseInt(row[3]) || 0,
                        handicap: parseInt(row[4]) || 0,
                        scores: detailedScores.map(s => s.total),
                        detailed_scores: detailedScores
                    });
                }
            });

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
