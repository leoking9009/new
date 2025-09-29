# TaskFlow 배포 가이드

TaskFlow 프로젝트를 Supabase + Vercel로 배포하는 단계별 가이드입니다.

## 📋 사전 준비

### 필요한 계정
- [Supabase](https://supabase.com) 계정
- [Vercel](https://vercel.com) 계정
- [GitHub](https://github.com) 계정 (코드 저장소)

### 필요한 파일들 ✅
- `supabase/schema.sql` - 데이터베이스 스키마
- `config/supabase.js` - Supabase 클라이언트 설정
- `vercel.json` - Vercel 배포 설정
- `.env.example` - 환경변수 예시
- 업데이트된 `login.html`, `index.html`

## 🗄️ 1단계: Supabase 설정

### 1.1 Supabase 프로젝트 생성
1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. "New project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: taskflow
   - **Database Password**: 강력한 비밀번호 설정
   - **Region**: South Korea (Northeast Asia)
4. "Create new project" 클릭하고 약 2분 대기

### 1.2 데이터베이스 스키마 설정
1. Supabase 대시보드 → **SQL Editor** 메뉴
2. "New query" 클릭
3. `supabase/schema.sql` 파일 내용 복사 붙여넣기
4. **Run** 버튼 클릭하여 실행
5. 실행 완료 후 **Table Editor**에서 테이블 생성 확인:
   - users
   - main_tasks
   - other_tasks
   - todo_tasks
   - journal_entries
   - records
   - events

### 1.3 환경변수 확인
1. Supabase 대시보드에서 **Settings** → **API** 메뉴 클릭
2. **Project Configuration** 섹션에서 다음 정보 복사:

   **📋 복사할 환경변수:**
   ```bash
   # Project URL
   SUPABASE_URL=https://abcdefghijklmnop.supabase.co

   # anon/public key (클라이언트에서 사용, 공개 가능)
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...

   # service_role key (서버에서만 사용, 절대 노출 금지!)
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...
   ```

3. **⚠️ 보안 주의사항:**
   - `anon/public key`: 브라우저에서 사용 가능 (RLS로 보안 보장)
   - `service_role key`: 서버 환경에서만 사용, GitHub/코드에 절대 커밋하지 말 것!

4. **💡 키 복사 팁:**
   - 각 키 오른쪽의 📋 복사 버튼 클릭
   - 또는 키를 더블클릭하여 전체 선택 후 Ctrl+C

### 1.4 인증 설정
1. **Authentication** → **Settings** 메뉴
2. **Site URL** 설정:
   - Development: `http://localhost:3000`
   - Production: `https://your-app.vercel.app`
3. **Email Templates** → **Magic Link** 확인
4. **Providers** → **Email** 활성화 상태 확인

## 🚀 2단계: Vercel 배포

### 2.1 GitHub 저장소 준비
```bash
# GitHub에 코드 푸시
git init
git add .
git commit -m "Initial TaskFlow setup with Supabase"
git branch -M main
git remote add origin https://github.com/username/taskflow.git
git push -u origin main
```

### 2.2 Vercel 프로젝트 생성
1. [Vercel 대시보드](https://vercel.com/dashboard) 로그인
2. "New Project" 클릭
3. GitHub 저장소 선택 및 Import
4. 프로젝트 설정:
   - **Project Name**: taskflow
   - **Framework**: Other
   - **Root Directory**: `./` 또는 `./new`
   - **Build Command**: 기본값 유지
   - **Output Directory**: 기본값 유지

### 2.3 환경변수 설정
1. Vercel 프로젝트 → **Settings** → **Environment Variables**
2. 다음 환경변수 추가:

```bash
# Production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Development (선택사항)
NODE_ENV=production
```

### 2.4 배포 실행
1. **Deployments** 탭에서 배포 상태 확인
2. 배포 완료 후 도메인 주소 확인 (https://your-app.vercel.app)

## ⚙️ 3단계: 최종 설정

### 3.1 Supabase 사이트 URL 업데이트
1. Supabase → **Authentication** → **Settings**
2. **Site URL**에 Vercel 도메인 추가:
   ```
   https://your-app.vercel.app
   ```
3. **Redirect URLs**에 추가:
   ```
   https://your-app.vercel.app/**
   ```

### 3.2 도메인 설정 (선택사항)
1. Vercel 프로젝트 → **Settings** → **Domains**
2. 커스텀 도메인 추가
3. DNS 설정 완료

## 📱 4단계: 애플리케이션 테스트

### 4.1 기본 기능 테스트
1. 배포된 URL 접속
2. 회원가입 테스트:
   - 이메일 주소로 가입
   - 이메일 확인 링크 클릭
   - 로그인 성공 확인
3. 업무 관리 기능 테스트:
   - 주요 업무 추가/수정/삭제
   - 기타 업무 관리
   - 할 일 관리
   - 일지 작성
   - 일정 관리

### 4.2 PWA 기능 확인
1. 모바일에서 "홈 화면에 추가" 테스트
2. 오프라인 기능 확인
3. 알림 기능 테스트

## 🔧 5단계: 운영 및 유지보수

### 5.1 모니터링 설정
- **Vercel Analytics**: 트래픽 모니터링
- **Supabase Logs**: 데이터베이스 활동 모니터링
- **Error Tracking**: 오류 추적 설정

### 5.2 백업 및 보안
- **데이터 백업**: Supabase 자동 백업 활성화
- **SSL 인증서**: Vercel 자동 관리
- **환경변수 보안**: 민감한 정보 보호

## 🚨 문제 해결

### 자주 발생하는 문제

#### 1. 로그인이 안 되는 경우
```bash
# Supabase Site URL 확인
# Email Templates 확인
# CORS 설정 확인
```

#### 2. 데이터베이스 연결 오류
```bash
# 환경변수 SUPABASE_URL, SUPABASE_ANON_KEY 확인
# RLS 정책 확인
# 네트워크 연결 확인
```

#### 3. 배포 실패
```bash
# vercel.json 문법 확인
# package.json 빌드 스크립트 확인
# 빌드 로그 확인
```

## 📞 지원 및 도움

### 유용한 리소스
- [Supabase 문서](https://supabase.com/docs)
- [Vercel 문서](https://vercel.com/docs)
- [TaskFlow GitHub Issues](https://github.com/username/taskflow/issues)

### 연락처
- 개발자: [your-email@example.com]
- 프로젝트: [GitHub Repository URL]

---

## 🎉 배포 완료!

축하합니다! TaskFlow가 성공적으로 배포되었습니다.

**배포된 애플리케이션**: https://your-app.vercel.app
**관리자 대시보드**: https://supabase.com/dashboard

이제 팀원들과 함께 효율적인 업무 관리를 시작하세요! 📋✨