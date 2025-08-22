# S3 CORS 404 오류 진단 체크리스트

## 🔍 1단계: 기본 API 연결 확인

### Ping 테스트
- [ ] **Ping 테스트** 버튼 클릭
- [ ] 결과: `✅ Ping 테스트 성공!` 또는 `❌ Ping 테스트 실패`
- [ ] 실패 시: API 함수 인식 문제

### 간단 API 테스트
- [ ] **간단 API 테스트** 버튼 클릭
- [ ] 결과: `✅ 간단한 API 성공!` 또는 `❌ 간단한 API 실패`
- [ ] 실패 시: 기본 API 함수 문제

## 🔍 2단계: S3 관련 API 확인

### S3 테스트
- [ ] **S3 테스트** 버튼 클릭
- [ ] 결과: 4가지 테스트 항목 결과 확인
- [ ] 실패 항목별 권장사항 확인

### CORS 테스트
- [ ] **CORS 테스트** 버튼 클릭
- [ ] 결과: CORS 설정 상태 및 분석
- [ ] 문제점 및 권장사항 확인

## 🔍 3단계: 환경 변수 확인

### 환경변수 확인
- [ ] **환경변수 확인** 버튼 클릭
- [ ] AWS 관련 환경 변수 상태 확인
- [ ] 누락된 환경 변수 식별

## 🔍 4단계: Vercel 설정 확인

### vercel.json 설정
- [ ] `functions` 섹션 존재 확인
- [ ] `api/**/*.js` 패턴 확인
- [ ] `nodejs18.x` 런타임 설정 확인

### package.json 설정
- [ ] `vercel.functions` 설정 존재 확인
- [ ] Node.js 버전 호환성 확인

## 🔍 5단계: 배포 상태 확인

### Vercel 대시보드
- [ ] 최신 배포 상태 확인
- [ ] 빌드 로그 확인
- [ ] 함수 배포 상태 확인

### 로컬 테스트
- [ ] `vercel dev` 실행
- [ ] 로컬에서 API 테스트
- [ ] 로컬 환경 변수 설정 확인

## 🚨 문제별 해결 방법

### API 함수 인식 문제
```bash
# vercel.json 수정
{
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  }
}

# 재배포
npm run deploy
```

### 환경 변수 문제
```bash
# Vercel 대시보드에서 환경 변수 설정
AWS_REGION=us-east-1
S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### CORS 설정 문제
```bash
# CORS 설정 스크립트 실행
chmod +x fix-s3-cors-updated.sh
./fix-s3-cors-updated.sh
```

## 📋 테스트 순서

1. **Ping 테스트** - 기본 API 연결 확인
2. **간단 API 테스트** - 기본 API 함수 확인
3. **환경변수 확인** - AWS 설정 상태 확인
4. **S3 테스트** - S3 연결 및 권한 확인
5. **CORS 테스트** - CORS 설정 상태 확인

## 🎯 예상 결과

**성공 시:**
- ✅ 모든 API 테스트 성공
- ✅ S3 연결 정상
- ✅ CORS 설정 적절
- ✅ 이미지 업로드 정상 작동

**실패 시:**
- ❌ 구체적인 오류 메시지 확인
- ❌ 권장사항에 따른 조치
- ❌ 단계별 문제 해결
