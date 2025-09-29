# TaskFlow 📋

스마트한 업무 관리를 위한 Progressive Web Application

## 🚀 기능

- **업무 관리**: 주요 업무, 기타 업무, 할 일 관리
- **일지 작성**: 일일 업무 일지 작성 및 관리
- **일정 관리**: 업무 일정 및 이벤트 관리
- **대시보드**: 업무 현황 한눈에 보기
- **PWA 지원**: 모바일 앱처럼 사용 가능
- **실시간 동기화**: Supabase 실시간 데이터베이스

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Hosting**: Vercel
- **PWA**: Service Worker, Manifest

## 🎯 빠른 시작

### 로컬 개발환경 설정

```bash
# 1. 저장소 클론
git clone https://github.com/username/taskflow.git
cd taskflow

# 2. 환경변수 설정
cp .env.example .env.local
# .env.local에 실제 Supabase 정보 입력

# 3. 로컬 서버 실행
npm run serve
# 또는
python -m http.server 3000
```

### 배포

자세한 배포 방법은 [DEPLOYMENT.md](DEPLOYMENT.md)를 참조하세요.

## 📁 프로젝트 구조

```
taskflow/
├── index.html              # 메인 페이지
├── login.html              # 로그인 페이지
├── app.js                  # 메인 앱 로직
├── styles.css              # 스타일시트
├── config/
│   └── supabase.js         # Supabase 설정
├── supabase/
│   └── schema.sql          # 데이터베이스 스키마
├── api/                    # API 엔드포인트
├── icons/                  # PWA 아이콘
├── manifest.json           # PWA 매니페스트
├── sw.js                   # Service Worker
├── vercel.json             # Vercel 배포 설정
└── DEPLOYMENT.md           # 배포 가이드
```

## 🔧 개발

### 환경변수

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

### 주요 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 배포
vercel deploy
```

## 📱 PWA 기능

- 오프라인 사용 가능
- 홈 화면 추가 지원
- 푸시 알림 (예정)
- 자동 업데이트

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 지원

- **이슈 리포트**: [GitHub Issues](https://github.com/username/taskflow/issues)
- **이메일**: your-email@example.com
- **문서**: [배포 가이드](DEPLOYMENT.md)

---

**TaskFlow**로 효율적인 업무 관리를 시작하세요! ✨