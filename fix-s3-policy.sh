#!/bin/bash

# S3 버킷 정책 설정 스크립트
# 사용법: ./fix-s3-policy.sh

echo "🔧 S3 버킷 정책 설정 시작..."

# 버킷 정책 JSON 파일 생성
cat > bucket-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::aqua.ai-output/*"
    },
    {
      "Sid": "AllowPresignedPut",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::aqua.ai-output/*",
      "Condition": {
        "StringEquals": {
          "s3:x-amz-acl": "public-read"
        }
      }
    }
  ]
}
EOF

echo "📋 버킷 정책 파일 생성됨:"
cat bucket-policy.json

echo ""
echo "🚀 S3 버킷에 정책 적용 중..."

# S3 버킷에 정책 적용
aws s3api put-bucket-policy \
  --bucket aqua.ai-output \
  --policy file://bucket-policy.json

if [ $? -eq 0 ]; then
    echo "✅ 버킷 정책이 성공적으로 적용되었습니다!"
    
    echo ""
    echo "🔍 현재 버킷 정책 확인 중..."
    aws s3api get-bucket-policy --bucket aqua.ai-output
    
else
    echo "❌ 버킷 정책 적용에 실패했습니다."
    echo "💡 AWS 자격 증명과 권한을 확인하세요."
fi

# 임시 파일 정리
rm bucket-policy.json

echo ""
echo "🎯 버킷 정책 설정 완료!"
