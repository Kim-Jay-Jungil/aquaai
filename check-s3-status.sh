#!/bin/bash

# S3 상태 전체 점검 스크립트
# 사용법: ./check-s3-status.sh

echo "🔍 S3 상태 전체 점검 시작..."
echo "=================================="

# 1. AWS 자격 증명 확인
echo "1️⃣ AWS 자격 증명 확인 중..."
aws sts get-caller-identity

if [ $? -eq 0 ]; then
    echo "✅ AWS 자격 증명 정상"
else
    echo "❌ AWS 자격 증명 실패"
    exit 1
fi

echo ""

# 2. S3 버킷 존재 확인
echo "2️⃣ S3 버킷 존재 확인 중..."
aws s3 ls s3://aqua.ai-output/

if [ $? -eq 0 ]; then
    echo "✅ S3 버킷 존재 확인됨"
else
    echo "❌ S3 버킷을 찾을 수 없음"
    exit 1
fi

echo ""

# 3. 현재 CORS 설정 확인
echo "3️⃣ 현재 CORS 설정 확인 중..."
aws s3api get-bucket-cors --bucket aqua.ai-output 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ CORS 설정이 이미 존재함"
else
    echo "❌ CORS 설정이 없음 - 설정 필요"
fi

echo ""

# 4. 현재 버킷 정책 확인
echo "4️⃣ 현재 버킷 정책 확인 중..."
aws s3api get-bucket-policy --bucket aqua.ai-output 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ 버킷 정책이 이미 존재함"
else
    echo "❌ 버킷 정책이 없음 - 설정 필요"
fi

echo ""

# 5. 권한 테스트
echo "5️⃣ S3 권한 테스트 중..."
echo "테스트 파일 생성 중..."
echo "S3 권한 테스트 - $(date)" > test-upload.txt

echo "S3에 테스트 파일 업로드 중..."
aws s3 cp test-upload.txt s3://aqua.ai-output/test-upload.txt

if [ $? -eq 0 ]; then
    echo "✅ S3 업로드 권한 정상"
    
    echo "S3에서 테스트 파일 다운로드 중..."
    aws s3 cp s3://aqua.ai-output/test-upload.txt test-download.txt
    
    if [ $? -eq 0 ]; then
        echo "✅ S3 다운로드 권한 정상"
    else
        echo "❌ S3 다운로드 권한 문제"
    fi
    
    # 테스트 파일 정리
    aws s3 rm s3://aqua.ai-output/test-upload.txt
    rm test-upload.txt test-download.txt 2>/dev/null
    
else
    echo "❌ S3 업로드 권한 문제"
fi

echo ""
echo "=================================="
echo "🎯 S3 상태 점검 완료!"

echo ""
echo "💡 다음 단계:"
if aws s3api get-bucket-cors --bucket aqua.ai-output >/dev/null 2>&1; then
    echo "   ✅ CORS 설정 완료"
else
    echo "   🔧 CORS 설정 필요: ./fix-s3-cors.sh 실행"
fi

if aws s3api get-bucket-policy --bucket aqua.ai-output >/dev/null 2>&1; then
    echo "   ✅ 버킷 정책 완료"
else
    echo "   🔧 버킷 정책 필요: ./fix-s3-policy.sh 실행"
fi

echo ""
echo "🚀 모든 설정 완료 후 웹사이트에서 테스트해보세요!"
