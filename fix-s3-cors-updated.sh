#!/bin/bash

# S3 버킷 CORS 설정 수정 (현재 도메인 포함)
# 사용법: ./fix-s3-cors-updated.sh

echo "🔧 S3 버킷 CORS 설정 수정 시작 (현재 도메인 포함)..."

# CORS 설정 JSON 파일 생성 (현재 도메인 포함)
cat > cors-config-updated.json << 'EOF'
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
      "HEAD"
    ],
    "AllowedOrigins": [
      "https://aquaai-one.vercel.app",
      "https://aquaai-six.vercel.app",
      "http://localhost:3000",
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-version-id",
      "x-amz-delete-marker",
      "x-amz-request-id"
    ],
    "MaxAgeSeconds": 3000
  }
]
EOF

echo "📋 업데이트된 CORS 설정 파일 생성됨:"
cat cors-config-updated.json

echo ""
echo "🚀 S3 버킷에 업데이트된 CORS 설정 적용 중..."

# S3 버킷에 CORS 설정 적용
aws s3api put-bucket-cors \
  --bucket aqua.ai-output \
  --cors-configuration file://cors-config-updated.json

if [ $? -eq 0 ]; then
    echo "✅ 업데이트된 CORS 설정이 성공적으로 적용되었습니다!"
    
    echo ""
    echo "🔍 현재 CORS 설정 확인 중..."
    aws s3api get-bucket-cors --bucket aqua.ai-output
    
else
    echo "❌ CORS 설정 적용에 실패했습니다."
    echo "💡 AWS 자격 증명과 권한을 확인하세요."
fi

# 임시 파일 정리
rm cors-config-updated.json

echo ""
echo "🎯 CORS 설정 업데이트 완료! 이제 aquaai-six.vercel.app에서 S3 직접 업로드가 가능합니다."
