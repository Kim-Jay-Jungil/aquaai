# 🔐 Clerk 인증 시스템 설정 가이드

## 📋 개요
Aqua.AI에 Clerk를 통한 사용자 인증 시스템을 구현했습니다.

## 🚀 1단계: Clerk 계정 생성 및 설정

### 1.1 Clerk 대시보드 접속
- [Clerk Dashboard](https://dashboard.clerk.com/)에 접속
- 새 애플리케이션 생성

### 1.2 애플리케이션 설정
- **Application Name**: `aqua-ai`
- **Environment**: `Development` (나중에 Production으로 변경)

### 1.3 인증 방법 설정
- **Email/Password**: 활성화
- **Social Connections**: 
  - Google OAuth 활성화
  - GitHub OAuth 활성화
  - Discord OAuth 활성화 (선택사항)

## 🔑 2단계: 환경변수 설정

### 2.1 Vercel 환경변수 설정
Vercel 대시보드 → Project → Settings → Environment Variables에서 다음을 추가:

```bash
# 필수 환경변수
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# 선택사항
CLERK_SIGN_IN_URL=/signin
CLERK_SIGN_UP_URL=/signup
CLERK_AFTER_SIGN_IN_URL=/
CLERK_AFTER_SIGN_UP_URL=/
```

### 2.2 Clerk 대시보드에서 키 가져오기
1. **API Keys** 섹션으로 이동
2. **Publishable Key** 복사 → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`에 설정
3. **Secret Key** 복사 → `CLERK_SECRET_KEY`에 설정

## 🌐 3단계: 도메인 설정

### 3.1 개발 환경
```
http://localhost:3000
```

### 3.2 프로덕션 환경
```
https://your-domain.vercel.app
```

## ⚙️ 4단계: 소셜 로그인 설정

### 4.1 Google OAuth
1. [Google Cloud Console](https://console.cloud.google.com/)에서 새 프로젝트 생성
2. **OAuth 2.0 Client IDs** 생성
3. **Authorized redirect URIs**에 Clerk 콜백 URL 추가:
   ```
   https://clerk.your-domain.com/v1/oauth_callback
   ```

### 4.2 GitHub OAuth
1. [GitHub Developer Settings](https://github.com/settings/developers)에서 새 OAuth App 생성
2. **Authorization callback URL**에 Clerk 콜백 URL 추가:
   ```
   https://clerk.your-domain.com/v1/oauth_callback
   ```

### 4.3 Discord OAuth (선택사항)
1. [Discord Developer Portal](https://discord.com/developers/applications)에서 새 애플리케이션 생성
2. **OAuth2** → **Redirects**에 Clerk 콜백 URL 추가

## 🔧 5단계: 코드 수정

### 5.1 환경변수 업데이트
`public/signin.html`과 `public/signup.html`에서:

```javascript
// 이 부분을 실제 키로 교체
publishableKey: 'pk_test_YOUR_PUBLISHABLE_KEY'
```

### 5.2 Clerk 초기화 확인
브라우저 콘솔에서 다음 메시지 확인:
```
✅ Clerk 초기화 완료
```

## 🧪 6단계: 테스트

### 6.1 기본 기능 테스트
1. **회원가입**: `/signup.html`에서 새 계정 생성
2. **로그인**: `/signin.html`에서 로그인
3. **소셜 로그인**: Google, GitHub 버튼 클릭

### 6.2 오류 처리 테스트
1. 잘못된 이메일/비밀번호 입력
2. 네트워크 오류 상황
3. Clerk 서비스 중단 상황

## 🚨 7단계: 문제 해결

### 7.1 일반적인 오류
- **"Clerk 초기화 실패"**: 환경변수 확인, 네트워크 연결 확인
- **"Invalid publishable key"**: 키 형식 및 값 확인
- **"CORS 오류"**: 도메인 설정 확인

### 7.2 디버깅 팁
1. 브라우저 개발자 도구 콘솔 확인
2. Network 탭에서 API 호출 상태 확인
3. Clerk 대시보드에서 로그 확인

## 📱 8단계: 모바일 최적화

### 8.1 반응형 디자인
- 모든 인증 페이지가 모바일에서 잘 작동하는지 확인
- 터치 인터페이스 최적화

### 8.2 PWA 지원 (선택사항)
- Service Worker 추가
- 오프라인 지원

## 🔒 9단계: 보안 강화

### 9.1 환경변수 보안
- 프로덕션에서는 `CLERK_SECRET_KEY`를 절대 클라이언트에 노출하지 않음
- Vercel 환경변수 암호화 확인

### 9.2 CORS 설정
- 허용된 도메인만 접근 가능하도록 설정
- HTTPS 강제 적용

## 📊 10단계: 모니터링 및 분석

### 10.1 Clerk 대시보드
- 사용자 가입/로그인 통계
- 오류 로그 모니터링
- 성능 메트릭 확인

### 10.2 사용자 행동 분석
- 로그인 성공/실패율
- 소셜 로그인 선호도
- 사용자 이탈 지점 분석

## 🎯 완료 체크리스트

- [ ] Clerk 계정 생성 및 애플리케이션 설정
- [ ] 환경변수 설정 (Vercel)
- [ ] 소셜 로그인 OAuth 설정
- [ ] 도메인 설정
- [ ] 코드에서 실제 키로 교체
- [ ] 기본 기능 테스트
- [ ] 오류 처리 테스트
- [ ] 모바일 최적화 확인
- [ ] 보안 설정 확인
- [ ] 모니터링 설정

## 📞 지원

문제가 발생하면:
1. Clerk 공식 문서 확인
2. Clerk Discord 커뮤니티 참여
3. GitHub Issues에 문제 보고

---

**🎉 축하합니다! Clerk 인증 시스템이 성공적으로 설정되었습니다!**
