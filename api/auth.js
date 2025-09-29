// Vercel Serverless Function for Authentication
export default async function handler(req, res) {
    // CORS 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // POST 요청만 허용
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { name, email, action } = req.body;

        // 환경 변수에서 설정 가져오기
        const NOTION_API_KEY = process.env.NOTION_API_KEY;
        const USER_DATABASE_ID = process.env.USER_DATABASE_ID || '27bc911759c9806e8dbfcfe23a79a065';
        const NOTION_VERSION = '2022-06-28';

        if (!NOTION_API_KEY) {
            return res.status(500).json({
                success: false,
                message: 'Server configuration error'
            });
        }

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
                return res.json({
                    success: true,
                    message: '가입 신청이 완료되었습니다. 관리자 승인을 기다려주세요.'
                });
            } else {
                const errorData = await createResponse.json();
                console.error('❌ 등록 오류:', errorData);
                return res.json({
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
                    return res.json({
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
                    return res.json({
                        success: false,
                        message: '아직 관리자 승인이 완료되지 않았습니다. 잠시 후 다시 시도해주세요.'
                    });
                } else {
                    console.log('❌ User status:', approvalStatus);
                    return res.json({
                        success: false,
                        message: '계정이 승인되지 않았습니다. 관리자에게 문의해주세요.'
                    });
                }
            } else {
                console.log('❌ User not found');
                return res.json({
                    success: false,
                    message: '등록되지 않은 이메일입니다. 먼저 회원가입을 해주세요.'
                });
            }
        } else {
            return res.json({
                success: false,
                message: '잘못된 요청입니다.'
            });
        }

    } catch (error) {
        console.error('인증 오류:', error);
        return res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
}