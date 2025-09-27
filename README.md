# 노션 업무관리 웹앱

노션 데이터베이스를 활용한 업무관리 웹 애플리케이션입니다.

## 기능
- 주요업무와 기타업무 탭으로 구분된 업무 관리
- 업무 생성, 수정, 삭제
- 상태 및 우선순위 관리
- 반응형 웹 디자인

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

### 노션 API 설정
환경변수로 설정하세요:
- `NOTION_API_KEY`: 노션 API 키
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