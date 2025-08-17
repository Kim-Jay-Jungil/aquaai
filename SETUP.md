# Aqua.AI 환경 변수 설정 가이드

## 🚨 "presign 실패" 오류 해결 방법

이 문서는 이미지 업로드 시 발생하는 "presign 실패" 오류를 해결하는 방법을 설명합니다.

## 🔍 문제 진단

"presign 실패" 오류는 주로 다음 이유로 발생합니다:

1. **환경 변수 미설정**: AWS S3 관련 환경 변수가 설정되지 않음
2. **AWS 자격 증명 오류**: Access Key ID 또는 Secret Access Key가 잘못됨
3. **S3 버킷 접근 권한 부족**: IAM 사용자에게 적절한 권한이 없음
4. **지역 설정 오류**: AWS 리전이 잘못 설정됨

## 🛠️ 해결 방법

### 1. 로컬 개발 환경 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# AWS S3 설정
AWS_REGION=ap-northeast-2
S3_BUCKET=your-aquaai-bucket
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Notion 설정
NOTION_TOKEN=your-notion-integration-token
NOTION_DB_ID=your-database-id

# S3 파일 접두사
S3_PREFIX=uploads
```

### 2. Vercel 배포 환경 설정

Vercel 대시보드에서 다음 환경 변수를 설정하세요:

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. Settings → Environment Variables
4. 다음 변수들을 추가:

```bash
AWS_REGION = ap-northeast-2
S3_BUCKET = your-aquaai-bucket
AWS_ACCESS_KEY_ID = your-aws-access-key
AWS_SECRET_ACCESS_KEY = your-aws-secret-key
NOTION_TOKEN = your-notion-token
NOTION_DB_ID = your-notion-database-id
S3_PREFIX = uploads
```

### 3. AWS S3 설정

#### 3.1 S3 버킷 생성
1. AWS S3 콘솔 접속
2. "Create bucket" 클릭
3. 버킷 이름 입력 (예: `aquaai-uploads`)
4. 리전 선택 (예: `Asia Pacific (Seoul) ap-northeast-2`)
5. 기본 설정으로 생성

#### 3.2 IAM 사용자 생성
1. AWS IAM 콘솔 접속
2. "Users" → "Create user"
3. 사용자 이름 입력 (예: `aquaai-s3-user`)
4. "Programmatic access" 체크
5. "Attach existing policies directly" 선택
6. `AmazonS3FullAccess` 정책 연결 (또는 커스텀 정책 생성)

#### 3.3 Access Key 생성
1. 사용자 생성 완료 후 "Access key ID"와 "Secret access key" 복사
2. 이 키들을 환경 변수에 설정

#### 3.4 S3 버킷 CORS 설정 (선택사항)
버킷 → Permissions → CORS configuration에 다음 추가:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

### 4. Notion 설정

#### 4.1 Integration 생성
1. [Notion Developers](https://developers.notion.com/) 접속
2. "New integration" 클릭
3. Integration 이름 입력 (예: `Aqua.AI`)
4. "Submit" 클릭
5. "Internal integration token" 복사

#### 4.2 데이터베이스 생성
1. Notion에서 새 페이지 생성
2. "Add a page" → "Database" → "Table"
3. 다음 속성들을 추가:

| 속성명 | 타입 | 설명 |
|--------|------|------|
| Name | Title | 파일명 |
| Status | Select | uploaded, processing, enhanced, failed |
| Enhancement_Level | Select | auto, light, medium, strong |
| User_Tier | Select | free, pro, business |
| Created_At | Date | 생성 시간 |
| User_Email | Email | 사용자 이메일 |
| Original_Image | Files | 원본 이미지 |
| Enhanced_Image | Files | 보정된 이미지 |
| Processing_Time | Number | 처리 시간 |
| Notes | Rich Text | 추가 노트 |

#### 4.3 Integration 연결
1. 데이터베이스 페이지 우상단 "..." 클릭
2. "Add connections" 선택
3. 생성한 Integration 선택
4. 데이터베이스 ID 복사 (URL에서 추출)

## 🧪 테스트 방법

### 1. 환경 변수 확인
```bash
# 로컬에서 확인
node -e "console.log('AWS_REGION:', process.env.AWS_REGION)"
node -e "console.log('S3_BUCKET:', process.env.S3_BUCKET)"
```

### 2. API 엔드포인트 테스트
```bash
curl -X POST http://localhost:3000/api/presign-put \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.jpg","contentType":"image/jpeg"}'
```

### 3. 브라우저 콘솔 확인
개발자 도구 → Console에서 에러 메시지 확인

## 🚨 일반적인 오류와 해결책

### "Missing required environment variables"
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 환경 변수 이름이 정확한지 확인
- Vercel에 배포한 경우 환경 변수가 설정되었는지 확인

### "S3 access denied"
- IAM 사용자에게 S3 접근 권한이 있는지 확인
- Access Key ID와 Secret Access Key가 올바른지 확인
- S3 버킷 이름이 정확한지 확인

### "S3 bucket not found"
- S3 버킷이 존재하는지 확인
- 버킷 이름이 정확한지 확인
- AWS 리전이 올바른지 확인

### "Invalid presign response"
- S3 버킷 CORS 설정 확인
- IAM 정책에 PutObject 권한이 있는지 확인

## 📞 추가 지원

문제가 지속되는 경우:

1. **브라우저 콘솔**에서 에러 메시지 확인
2. **Vercel 로그**에서 서버 에러 확인
3. **AWS CloudTrail**에서 S3 API 호출 로그 확인
4. **GitHub Issues**에 문제 보고

## 🔒 보안 주의사항

- `.env.local` 파일을 Git에 커밋하지 마세요
- AWS 자격 증명을 공개 저장소에 노출하지 마세요
- IAM 사용자에게 최소한의 권한만 부여하세요
- 정기적으로 Access Key를 로테이션하세요
