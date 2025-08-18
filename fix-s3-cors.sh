#!/bin/bash

# S3 버킷 CORS 설정 수정 스크립트
# 사용법: ./fix-s3-cors.sh

echo "🔧 S3 버킷 CORS 설정 수정 시작..."

# CORS 설정 JSON 파일 생성
cat > cors-config.json << 'EOF'
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
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-version-id",
      "x-amz-delete-marker"
    ],
    "MaxAgeSeconds": 3000
  }
]
EOF

echo "📋 CORS 설정 파일 생성됨:"
cat cors-config.json

echo ""
echo "🚀 S3 버킷에 CORS 설정 적용 중..."

# S3 버킷에 CORS 설정 적용
aws s3api put-bucket-cors \
  --bucket aqua.ai-output \
  --cors-configuration file://cors-config.json

if [ $? -eq 0 ]; then
    echo "✅ CORS 설정이 성공적으로 적용되었습니다!"
    
    echo ""
    echo "🔍 현재 CORS 설정 확인 중..."
    aws s3api get-bucket-cors --bucket aqua.ai-output
    
else
    echo "❌ CORS 설정 적용에 실패했습니다."
    echo "💡 AWS 자격 증명과 권한을 확인하세요."
fi

# 임시 파일 정리
rm cors-config.json

echo ""
echo "🎯 CORS 설정 완료! 이제 브라우저에서 S3 직접 업로드가 가능합니다."
