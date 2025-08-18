# 📝 Notion 데이터베이스 연동 설정 가이드

## 📋 개요
Aqua.AI에서 이미지 보정 후 Notion 데이터베이스에 자동으로 저장하는 기능을 구현했습니다.

## 🚀 1단계: Notion 계정 및 워크스페이스 설정

### 1.1 Notion 계정 생성
- [Notion](https://www.notion.so/)에 가입
- 새 워크스페이스 생성 (Aqua.AI용)

### 1.2 Integration 생성
1. [Notion Integrations](https://www.notion.so/my-integrations) 페이지로 이동
2. **New integration** 클릭
3. 설정:
   - **Name**: `Aqua.AI Integration`
   - **Associated workspace**: Aqua.AI 워크스페이스 선택
   - **Capabilities**: 
     - ✅ Read content
     - ✅ Update content
     - ✅ Insert content

## 🗄️ 2단계: 데이터베이스 생성 및 설정

### 2.1 새 데이터베이스 생성
1. 워크스페이스에서 **+ New page** 클릭
2. **Table** 선택
3. 데이터베이스 이름: `Aqua.AI Image Processing Log`

### 2.2 데이터베이스 속성 설정
다음 속성들을 추가하세요:

| 속성명 | 타입 | 설명 |
|--------|------|------|
| **Name** | Title | 파일명 (자동 생성) |
| **Status** | Select | 처리 상태 (uploaded, processing, enhanced, failed) |
| **Enhancement_Level** | Select | 보정 강도 (auto, light, medium, strong) |
| **User_Tier** | Select | 사용자 티어 (free, pro, business) |
| **User_Email** | Email | 사용자 이메일 |
| **Original_Image** | Files & media | 원본 이미지 링크 |
| **Enhanced_Image** | Files & media | 보정된 이미지 링크 |
| **Processing_Time** | Number | 처리 시간 (밀리초) |
| **Created_At** | Date | 생성 시간 (자동) |
| **Usage_Date** | Date | 사용 날짜 |
| **Notes** | Text | 추가 노트 |

### 2.3 Select 옵션 설정

**Status 옵션:**
- `uploaded` (업로드됨)
- `processing` (처리 중)
- `enhanced` (보정 완료)
- `failed` (실패)

**Enhancement_Level 옵션:**
- `auto` (자동)
- `light` (약함)
- `medium` (보통)
- `strong` (강함)

**User_Tier 옵션:**
- `free` (무료)
- `pro` (프로)
- `business` (비즈니스)

## 🔑 3단계: Integration 권한 설정

### 3.1 데이터베이스에 Integration 추가
1. 생성한 데이터베이스 페이지에서 **...** (더보기) 클릭
2. **Add connections** 선택
3. **Aqua.AI Integration** 검색 후 추가

### 3.2 권한 확인
- Integration이 데이터베이스에 접근할 수 있는지 확인
- **Can edit** 권한이 있는지 확인

## 🌐 4단계: Vercel 환경변수 설정

### 4.1 Vercel 대시보드에서 설정
Vercel → Project → Settings → Environment Variables:

```bash
# 필수 환경변수
NOTION_TOKEN=secret_...
NOTION_DB_ID=...

# 선택사항
NOTION_WORKSPACE_ID=...
```

### 4.2 Notion Token 가져오기
1. [Notion Integrations](https://www.notion.so/my-integrations) 페이지
2. **Aqua.AI Integration** 클릭
3. **Internal Integration Token** 복사
4. `NOTION_TOKEN`에 설정

### 4.3 Database ID 가져오기
1. Notion 데이터베이스 페이지 열기
2. URL에서 ID 복사:
   ```
   https://www.notion.so/workspace/DATABASE_ID?v=...
   ```
3. `NOTION_DB_ID`에 설정

## 🧪 5단계: 테스트 및 확인

### 5.1 기본 기능 테스트
1. 이미지 업로드 및 보정
2. Notion 데이터베이스에 새 항목 생성 확인
3. 모든 필드가 올바르게 채워지는지 확인

### 5.2 오류 처리 테스트
1. 잘못된 토큰으로 테스트
2. 데이터베이스 ID 오류 테스트
3. 권한 부족 상황 테스트

## 📊 6단계: 데이터베이스 활용

### 6.1 사용량 추적
- 사용자별 월간 처리 건수
- 티어별 제한 관리
- 처리 시간 통계

### 6.2 품질 관리
- 실패한 처리 건 분석
- 처리 시간 패턴 분석
- 사용자 피드백 수집

### 6.3 비즈니스 인사이트
- 인기 있는 보정 강도
- 사용자 행동 패턴
- 서비스 개선 포인트

## 🚨 7단계: 문제 해결

### 7.1 일반적인 오류
- **"Notion DB 기록 실패"**: 토큰 및 데이터베이스 ID 확인
- **"권한 없음"**: Integration 권한 설정 확인
- **"데이터베이스 없음"**: 데이터베이스 ID 및 연결 상태 확인

### 7.2 디버깅 팁
1. Vercel 로그에서 Notion 오류 확인
2. Notion Integration 권한 상태 확인
3. 데이터베이스 속성명 정확성 확인

## 🔒 8단계: 보안 및 개인정보

### 8.1 데이터 보호
- 사용자 이메일은 선택사항
- 이미지 링크는 외부 URL로 저장
- 민감한 정보는 저장하지 않음

### 8.2 접근 제어
- Integration 권한을 최소한으로 설정
- 데이터베이스 접근 권한 관리
- 정기적인 권한 검토

## 📱 9단계: 모니터링 및 알림

### 9.1 자동 알림 설정
- 처리 실패 시 알림
- 일일/주간 처리 통계
- 사용량 한도 도달 알림

### 9.2 대시보드 구성
- 실시간 처리 현황
- 사용자별 통계
- 시스템 성능 지표

## 🎯 완료 체크리스트

- [ ] Notion 계정 및 워크스페이스 생성
- [ ] Integration 생성 및 설정
- [ ] 데이터베이스 생성 및 속성 설정
- [ ] Integration을 데이터베이스에 연결
- [ ] Vercel 환경변수 설정
- [ ] 기본 기능 테스트
- [ ] 오류 처리 테스트
- [ ] 모니터링 설정

## 📞 지원

문제가 발생하면:
1. Notion 공식 문서 확인
2. Vercel 로그에서 오류 메시지 확인
3. Integration 권한 및 연결 상태 재확인

---

**🎉 축하합니다! Notion 데이터베이스 연동이 성공적으로 설정되었습니다!**

이제 모든 이미지 보정 결과가 자동으로 Notion에 저장되어 추적하고 분석할 수 있습니다.
