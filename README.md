# TaskFlow - 스마트 업무 관리 시스템

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/leoking9009/new)

노션 데이터베이스를 활용한 업무관리 웹 애플리케이션입니다.

## 기능
- 📧 이메일 기반 회원가입/로그인 시스템
- ✅ 관리자 승인을 통한 회원 관리
- 📋 노션 데이터베이스 연동 업무 관리
- 📱 PWA 지원으로 모바일 친화적
- 🔐 보안 강화된 인증 시스템

## 사용법

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **서버 실행**
   ```bash
   npm start
   ```
   또는
   ```bash
   npm run dev
   ```

3. 브라우저에서 `http://localhost:3000` 접속

## 설정

### Vercel 배포 시 환경 변수 설정
- `NOTION_API_KEY`: 노션 통합 API 키

### 노션 API 설정 (로컬 개발)
`.env` 파일을 생성하여 설정하세요:
```
NOTION_API_KEY=your-notion-api-key
```

사용되는 데이터베이스:
- 사용자 DB: `27bc911759c9806e8dbfcfe23a79a065`
- 주요업무 DB: `232c911759c981829e08fd928b282cd7`
- 기타업무 DB: `25cc911759c980e7a687d212aa0ee422`

### 노션 데이터베이스 속성
각 데이터베이스에는 다음 속성들이 필요합니다:
- **Name** (제목): 업무 제목
- **Status** (선택): 시작 안함, 진행 중, 완료
- **Priority** (선택): 낮음, 보통, 높음
- **Description** (리치 텍스트): 업무 설명

## 파일 구조
```
├── index.html      # 메인 HTML 파일
├── styles.css      # CSS 스타일
├── app.js          # JavaScript 로직
├── package.json    # 프로젝트 설정
└── README.md       # 이 파일
```

## 브라우저 호환성
- Chrome, Firefox, Safari, Edge 최신 버전 지원
- CORS 정책으로 인해 로컬 서버에서 실행 필요