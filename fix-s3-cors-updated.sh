#!/bin/bash

# S3 CORS 설정 개선 스크립트
# 이 스크립트는 S3 버킷의 CORS 설정을 업데이트합니다.

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 S3 CORS 설정 개선 시작${NC}"

# 환경 변수 확인
if [ -z "$AWS_PROFILE" ] && [ -z "$AWS_ACCESS_KEY_ID" ]; then
    echo -e "${YELLOW}⚠️  AWS 자격 증명이 설정되지 않았습니다.${NC}"
    echo -e "${YELLOW}   AWS_PROFILE 또는 AWS_ACCESS_KEY_ID를 설정하세요.${NC}"
    exit 1
fi

# S3 버킷 이름 입력
read -p "S3 버킷 이름을 입력하세요: " BUCKET_NAME

if [ -z "$BUCKET_NAME" ]; then
    echo -e "${RED}❌ 버킷 이름이 입력되지 않았습니다.${NC}"
    exit 1
fi

echo -e "${BLUE}📦 버킷: ${BUCKET_NAME}${NC}"

# 개선된 CORS 설정
cat > cors-config-improved.json << 'EOF'
[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD",
      "OPTIONS"
    ],
    "AllowedOrigins": [
      "https://aquaai-one.vercel.app",
      "https://aquaai-six.vercel.app",
      "https://*.vercel.app",
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-version-id",
      "x-amz-delete-marker",
      "x-amz-request-id",
      "x-amz-meta-*",
      "Content-Length",
      "Content-Type"
    ],
    "MaxAgeSeconds": 86400
  }
]
EOF

echo -e "${BLUE}📝 개선된 CORS 설정:${NC}"
cat cors-config-improved.json

# 현재 CORS 설정 확인
echo -e "${BLUE}🔍 현재 CORS 설정 확인 중...${NC}"
if aws s3api get-bucket-cors --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  기존 CORS 설정이 있습니다.${NC}"
    read -p "기존 설정을 덮어쓰시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}❌ CORS 설정이 취소되었습니다.${NC}"
        exit 1
    fi
fi

# CORS 설정 적용
echo -e "${BLUE}🚀 CORS 설정 적용 중...${NC}"
if aws s3api put-bucket-cors --bucket "$BUCKET_NAME" --cors-configuration file://cors-config-improved.json; then
    echo -e "${GREEN}✅ CORS 설정이 성공적으로 적용되었습니다!${NC}"
else
    echo -e "${RED}❌ CORS 설정 적용에 실패했습니다.${NC}"
    exit 1
fi

# 설정 확인
echo -e "${BLUE}🔍 적용된 CORS 설정 확인:${NC}"
if aws s3api get-bucket-cors --bucket "$BUCKET_NAME"; then
    echo -e "${GREEN}✅ CORS 설정이 올바르게 적용되었습니다.${NC}"
else
    echo -e "${RED}❌ CORS 설정 확인에 실패했습니다.${NC}"
    exit 1
fi

# 버킷 정책 확인 및 업데이트
echo -e "${BLUE}🔒 버킷 정책 확인 중...${NC}"
if aws s3api get-bucket-policy --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  기존 버킷 정책이 있습니다.${NC}"
else
    echo -e "${BLUE}📝 공개 읽기 권한을 위한 버킷 정책을 생성합니다...${NC}"
    
    cat > bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
EOF

    if aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy file://bucket-policy.json; then
        echo -e "${GREEN}✅ 버킷 정책이 성공적으로 적용되었습니다!${NC}"
    else
        echo -e "${YELLOW}⚠️  버킷 정책 적용에 실패했습니다.${NC}"
    fi
fi

# 정리
rm -f cors-config-improved.json bucket-policy.json

echo -e "${GREEN}🎉 S3 CORS 설정 개선이 완료되었습니다!${NC}"
echo -e "${BLUE}📋 다음 단계:${NC}"
echo -e "${BLUE}   1. 웹사이트에서 S3 테스트를 다시 실행해보세요${NC}"
echo -e "${BLUE}   2. 이미지 업로드가 정상적으로 작동하는지 확인하세요${NC}"
echo -e "${BLUE}   3. 문제가 지속되면 AWS IAM 권한을 확인하세요${NC}"
