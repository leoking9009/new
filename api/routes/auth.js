// Authentication route handler
const express = require('express');
const router = express.Router();

// Login endpoint
router.post('/', async (req, res) => {
    try {
        const { password, action } = req.body;

        // 환경 변수에서 관리자 비밀번호 가져오기
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

        if (!ADMIN_PASSWORD) {
            return res.status(500).json({
                success: false,
                message: 'Server configuration error'
            });
        }

        if (action === 'login') {
            // 로그인 처리 - 비밀번호 검증
            console.log('🔍 Login attempt');

            if (!password) {
                return res.json({
                    success: false,
                    message: '비밀번호를 입력해주세요.'
                });
            }

            // 비밀번호 확인
            if (password === ADMIN_PASSWORD) {
                console.log('✅ Password correct, logging in');
                return res.json({
                    success: true,
                    message: '로그인 성공',
                    data: {
                        user: {
                            id: 'admin',
                            name: 'Admin',
                            email: 'admin@taskflow.com'
                        }
                    }
                });
            } else {
                console.log('❌ Password incorrect');
                return res.json({
                    success: false,
                    message: '비밀번호가 올바르지 않습니다.'
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
});

module.exports = router;