# Aqua.AI - 수중 사진 자동보정 서비스

AI 기반 수중 사진 자동보정 웹앱 서비스입니다. 블루/그린 톤을 자동으로 감지하고 제거하여 수중에서 찍은 사진을 자연스럽게 만들어드립니다.

## 🚀 주요 기능

- **자동 색상 보정**: 수중 환경의 블루/그린 톤 자동 감지 및 제거
- **다양한 보정 강도**: 자동, 약함, 보통, 강함 4단계 보정 옵션
- **배치 처리**: 여러 이미지 동시 업로드 및 보정
- **실시간 진행률**: 보정 과정을 실시간으로 확인
- **Notion 연동**: 모든 처리 기록을 Notion 데이터베이스에 자동 저장
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 기기 지원

## 💰 요금제

- **무료**: 월 5장 이미지 보정
- **프로**: 월 ₩19,900 - 100장 보정 + 고급 옵션
- **비즈니스**: 월 ₩49,900 - 1,000장 보정 + API 접근

## 🛠️ 기술 스택

- **프론트엔드**: HTML5, CSS3, JavaScript (ES6+)
- **백엔드**: Vercel Functions
- **이미지 처리**: Sharp.js
- **파일 저장**: AWS S3
- **데이터베이스**: Notion API
- **배포**: Vercel

## 📋 설치 및 설정

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/aquaai.git
cd aquaai
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```bash
# AWS S3 설정
AWS_REGION=ap-northeast-2
S3_BUCKET=your-aquaai-bucket
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Notion 설정
NOTION_TOKEN=your-notion-integration-token
NOTION_DB_ID=your-database-id

# CDN 설정 (선택사항)
CDN_BASE=https://your-cdn-domain.com

# S3 파일 접두사
S3_PREFIX=uploads
```

### 4. Notion 데이터베이스 설정

1. [Notion Developers](https://developers.notion.com/)에서 새 Integration 생성
2. Integration Token 복사
3. Notion에서 새 데이터베이스 생성
4. 다음 속성들을 추가:
   - **Name** (Title): 파일명
   - **Status** (Select): uploaded, processing, enhanced, failed
   - **Enhancement_Level** (Select): auto, light, medium, strong
   - **User_Tier** (Select): free, pro, business
   - **Created_At** (Date): 생성 시간
   - **User_Email** (Email): 사용자 이메일
   - **Original_Image** (Files): 원본 이미지
   - **Enhanced_Image** (Files): 보정된 이미지
   - **Processing_Time** (Number): 처리 시간
   - **Notes** (Rich Text): 추가 노트

5. Integration을 데이터베이스에 연결
6. 데이터베이스 ID 복사 (URL에서 추출)

### 5. AWS S3 설정

1. AWS S3 버킷 생성
2. IAM 사용자 생성 및 S3 접근 권한 부여
3. Access Key ID와 Secret Access Key 생성
4. 버킷 CORS 설정 (필요시)

### 6. 개발 서버 실행
```bash
npm run dev
```

### 7. 배포
```bash
npm run deploy
```

## 🔧 API 엔드포인트

### 이미지 업로드 (S3 Presign)
```
POST /api/presign-put
Content-Type: application/json

{
  "filename": "image.jpg",
  "contentType": "image/jpeg"
}
```

### 이미지 보정
```
POST /api/enhance-image
Content-Type: application/json

{
  "imageUrl": "https://s3.amazonaws.com/bucket/image.jpg",
  "filename": "image.jpg",
  "enhancementLevel": "auto"
}
```

## 📱 사용법

1. **이미지 업로드**: 드래그 앤 드롭 또는 클릭하여 이미지 선택
2. **보정 강도 선택**: 자동, 약함, 보통, 강함 중 선택
3. **보정 시작**: "이미지 보정 시작" 버튼 클릭
4. **결과 확인**: 원본과 보정된 이미지 비교
5. **다운로드**: 보정된 이미지 다운로드

## 🔒 보안 및 개인정보

- 업로드된 이미지는 자동으로 삭제되어 개인정보 보호
- S3 버킷은 비공개 설정 권장
- HTTPS 통신으로 데이터 전송 보안

## 📊 모니터링

- Notion 데이터베이스에서 모든 처리 기록 확인
- 사용자별 월간 사용량 추적
- 서비스 통계 및 분석 데이터 제공

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 지원

- **이메일**: support@aquaai.com
- **문의**: [GitHub Issues](https://github.com/your-username/aquaai/issues)
- **문서**: [Wiki](https://github.com/your-username/aquaai/wiki)

## 🚀 로드맵

- [ ] 사용자 인증 시스템
- [ ] 결제 시스템 연동 (Stripe)
- [ ] 고급 AI 모델 적용
- [ ] 모바일 앱 개발
- [ ] API 레이트 리미팅
- [ ] 이미지 품질 분석
- [ ] 배치 처리 최적화

---

**Aqua.AI** - 수중 사진을 아름답게 만드는 AI 서비스
