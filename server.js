require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 4000;

// Notion API configuration
const NOTION_API_KEY = process.env.NOTION_API_KEY || 'your-notion-api-key-here';
const NOTION_VERSION = '2022-06-28';

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

// Notion API proxy routes
app.post('/api/notion/databases/:databaseId/query', async (req, res) => {
    try {
        const { databaseId } = req.params;
        const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NOTION_API_KEY}`,
                'Content-Type': 'application/json',
                'Notion-Version': NOTION_VERSION
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error('Database query error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/notion/pages/:pageId', async (req, res) => {
    try {
        const { pageId } = req.params;
        const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${NOTION_API_KEY}`,
                'Content-Type': 'application/json',
                'Notion-Version': NOTION_VERSION
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error('Page get error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.patch('/api/notion/pages/:pageId', async (req, res) => {
    try {
        const { pageId } = req.params;
        const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${NOTION_API_KEY}`,
                'Content-Type': 'application/json',
                'Notion-Version': NOTION_VERSION
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error('Page patch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/notion/pages', async (req, res) => {
    try {
        const response = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NOTION_API_KEY}`,
                'Content-Type': 'application/json',
                'Notion-Version': NOTION_VERSION
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error('Page create error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Authentication API endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { name, email, action } = req.body;
        const USER_DATABASE_ID = '27bc911759c9806e8dbfcfe23a79a065';

        if (action === 'register') {
            // 회원가입 처리
            // 먼저 이미 존재하는 이메일인지 확인
            const existingUser = await fetch(`https://api.notion.com/v1/databases/${USER_DATABASE_ID}/query`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${NOTION_API_KEY}`,
                    'Content-Type': 'application/json',
                    'Notion-Version': NOTION_VERSION
                },
                body: JSON.stringify({
                    filter: {
                        property: '이메일',
                        email: { equals: email }
                    }
                })
            });

            const existingData = await existingUser.json();

            if (existingData.results && existingData.results.length > 0) {
                return res.json({
                    success: false,
                    message: '이미 등록된 이메일입니다.'
                });
            }

            // 새 사용자 등록
            console.log('🔍 Creating new user:', { name, email, USER_DATABASE_ID });

            const createPayload = {
                parent: { database_id: USER_DATABASE_ID },
                properties: {
                    '이름': {
                        title: [{ text: { content: name } }]
                    },
                    '이메일': {
                        email: email
                    },
                    '승인상태': {
                        select: { name: '대기' }
                    },
                    '가입날짜': {
                        date: { start: new Date().toISOString().split('T')[0] }
                    }
                }
            };

            console.log('📤 Create payload:', JSON.stringify(createPayload, null, 2));

            const createResponse = await fetch('https://api.notion.com/v1/pages', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${NOTION_API_KEY}`,
                    'Content-Type': 'application/json',
                    'Notion-Version': NOTION_VERSION
                },
                body: JSON.stringify(createPayload)
            });

            console.log('📥 Create response status:', createResponse.status);

            if (createResponse.ok) {
                const createdData = await createResponse.json();
                console.log('✅ User created successfully:', createdData.id);
                res.json({
                    success: true,
                    message: '가입 신청이 완료되었습니다. 관리자 승인을 기다려주세요.'
                });
            } else {
                const errorData = await createResponse.json();
                console.error('❌ 등록 오류:', errorData);
                res.json({
                    success: false,
                    message: '가입 신청 중 오류가 발생했습니다: ' + (errorData.message || 'Unknown error')
                });
            }

        } else if (action === 'login') {
            // 로그인 처리
            console.log('🔍 Login attempt for:', email);

            const response = await fetch(`https://api.notion.com/v1/databases/${USER_DATABASE_ID}/query`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${NOTION_API_KEY}`,
                    'Content-Type': 'application/json',
                    'Notion-Version': NOTION_VERSION
                },
                body: JSON.stringify({
                    filter: {
                        property: '이메일',
                        email: { equals: email }
                    }
                })
            });

            const data = await response.json();
            console.log('📥 Query response:', JSON.stringify(data, null, 2));

            if (data.results && data.results.length > 0) {
                const user = data.results[0];
                const approvalStatus = user.properties['승인상태']?.select?.name;
                const userName = user.properties['이름']?.title?.[0]?.text?.content;

                console.log('👤 User found:', {
                    id: user.id,
                    name: userName,
                    email: email,
                    approvalStatus: approvalStatus,
                    rawProperties: user.properties
                });

                if (approvalStatus === '승인' || approvalStatus === 'approved') {
                    console.log('✅ User approved, logging in');
                    res.json({
                        success: true,
                        message: '로그인 성공',
                        data: {
                            user: {
                                id: user.id,
                                name: userName,
                                email: email,
                                status: approvalStatus
                            }
                        }
                    });
                } else if (approvalStatus === '대기') {
                    console.log('⏳ User status: 대기');
                    res.json({
                        success: false,
                        message: '아직 관리자 승인이 완료되지 않았습니다. 잠시 후 다시 시도해주세요.'
                    });
                } else {
                    console.log('❌ User status:', approvalStatus);
                    res.json({
                        success: false,
                        message: '계정이 승인되지 않았습니다. 관리자에게 문의해주세요.'
                    });
                }
            } else {
                console.log('❌ User not found');
                res.json({
                    success: false,
                    message: '등록되지 않은 이메일입니다. 먼저 회원가입을 해주세요.'
                });
            }
        } else {
            res.json({
                success: false,
                message: '잘못된 요청입니다.'
            });
        }

    } catch (error) {
        console.error('인증 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ TaskFlow 서버가 실행 중입니다!`);
    console.log(`🌐 브라우저에서 http://localhost:${PORT} 에 접속하세요`);
    console.log(`📱 모바일에서는 http://[내IP]:${PORT} 로 접속 가능합니다`);
    console.log(`🔗 노션 API 프록시가 활성화되었습니다`);
});