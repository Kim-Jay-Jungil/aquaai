#!/bin/bash

# S3 버킷 정책 설정 (public-read 권한 포함)
# 사용법: ./fix-s3-policy-public.sh

echo "🔧 S3 버킷 정책 설정 시작 (public-read 권한 포함)..."

# 버킷 정책 JSON 파일 생성
cat > bucket-policy-public.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontReadViaOAC",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": [
        "s3:GetObject",
        "s3:GetObjectVersion"
      ],
      "Resource": "arn:aws:s3:::aqua.ai-output/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::571161047004:distribution/E3PTIKQP1PJBST"
        }
      }
    },
    {
      "Sid": "AllowPublicRead",
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
      "Resource": "arn:aws:s3:::aqua.ai-output/*"
    }
  ]
}
EOF

echo "📋 새로운 버킷 정책 파일 생성됨:"
cat bucket-policy-public.json

echo ""
echo "🚀 S3 버킷에 새로운 정책 적용 중..."

# S3 버킷에 정책 적용
aws s3api put-bucket-policy \
  --bucket aqua.ai-output \
  --policy file://bucket-policy-public.json

if [ $? -eq 0 ]; then
    echo "✅ 새로운 버킷 정책이 성공적으로 적용되었습니다!"
    
    echo ""
    echo "🔍 현재 버킷 정책 확인 중..."
    aws s3api get-bucket-policy --bucket aqua.ai-output
    
else
    echo "❌ 버킷 정책 적용에 실패했습니다."
    echo "💡 AWS 자격 증명과 권한을 확인하세요."
fi

# 임시 파일 정리
rm bucket-policy-public.json

echo ""
echo "🎯 버킷 정책 설정 완료! 이제 public-read 권한으로 업로드가 가능합니다."
