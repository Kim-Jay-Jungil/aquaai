// api/test-cors.js - S3 CORS 설정 전용 테스트
import { S3Client, GetBucketCorsCommand } from '@aws-sdk/client-s3';

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      allowedMethods: ['GET']
    });
  }

  try {
    console.log('🌐 S3 CORS 설정 테스트 시작...');

    // 환경 변수 확인
    if (!process.env.S3_BUCKET) {
      return res.status(500).json({
        success: false,
        error: 'S3_BUCKET environment variable is not set',
        message: 'S3_BUCKET 환경 변수가 설정되지 않았습니다.'
      });
    }

    // S3 클라이언트 초기화
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    const bucketName = process.env.S3_BUCKET;

    try {
      // CORS 설정 조회
      console.log('🔍 CORS 설정 조회 중...');
      const corsCommand = new GetBucketCorsCommand({ Bucket: bucketName });
      const corsResult = await s3Client.send(corsCommand);
      
      console.log('✅ CORS 설정 조회 성공:', corsResult);

      // CORS 설정 분석
      const corsRules = corsResult.CORSRules || [];
      const analysis = analyzeCorsRules(corsRules);

      return res.status(200).json({
        success: true,
        message: 'CORS 설정 확인 성공',
        bucket: bucketName,
        corsRules: corsRules,
        analysis: analysis,
        recommendations: generateCorsRecommendations(analysis)
      });

    } catch (error) {
      console.error('❌ CORS 설정 조회 실패:', error.message);
      
      // CORS 설정이 없는 경우
      if (error.name === 'NoSuchCORSConfiguration') {
        return res.status(200).json({
          success: true,
          message: 'CORS 설정이 없습니다. 설정이 필요합니다.',
          bucket: bucketName,
          corsRules: [],
          analysis: {
            hasCors: false,
            issues: ['CORS 설정이 없습니다'],
            severity: 'high'
          },
          recommendations: [
            '🌐 S3 버킷에 CORS 설정을 추가해야 합니다.',
            '📋 CORS 설정 스크립트를 실행하여 설정을 업데이트하세요.',
            '🚀 설정 후 웹사이트에서 CORS 테스트를 다시 실행해보세요.'
          ]
        });
      }

      // 권한 문제
      if (error.name === 'AccessDenied') {
        return res.status(403).json({
          success: false,
          error: 'Access Denied',
          message: 'CORS 설정을 조회할 권한이 없습니다.',
          bucket: bucketName,
          recommendations: [
            '🔑 AWS IAM 사용자에게 s3:GetBucketCors 권한을 부여하세요.',
            '🌐 S3 버킷 소유자에게 문의하세요.'
          ]
        });
      }

      // 기타 오류
      return res.status(500).json({
        success: false,
        error: 'CORS 설정 조회 실패',
        message: error.message,
        bucket: bucketName,
        recommendations: [
          '🔍 AWS 콘솔에서 S3 버킷 CORS 설정을 직접 확인하세요.',
          '📋 CORS 설정 스크립트를 실행하여 설정을 업데이트하세요.'
        ]
      });
    }

  } catch (error) {
    console.error('💥 CORS 테스트 중 치명적 오류:', error);
    
    return res.status(500).json({
      success: false,
      error: 'CORS 테스트 실패',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// CORS 규칙 분석
function analyzeCorsRules(corsRules) {
  if (!corsRules || corsRules.length === 0) {
    return {
      hasCors: false,
      issues: ['CORS 설정이 없습니다'],
      severity: 'high'
    };
  }

  const issues = [];
  const warnings = [];
  let severity = 'low';

  corsRules.forEach((rule, index) => {
    // AllowedOrigins 확인
    if (!rule.AllowedOrigins || rule.AllowedOrigins.length === 0) {
      issues.push(`규칙 ${index + 1}: AllowedOrigins가 설정되지 않음`);
      severity = 'high';
    } else if (rule.AllowedOrigins.includes('*')) {
      warnings.push(`규칙 ${index + 1}: 모든 도메인 허용 (*) - 보안상 주의 필요`);
    }

    // AllowedMethods 확인
    if (!rule.AllowedMethods || rule.AllowedMethods.length === 0) {
      issues.push(`규칙 ${index + 1}: AllowedMethods가 설정되지 않음`);
      severity = 'high';
    } else {
      const requiredMethods = ['GET', 'PUT', 'POST', 'OPTIONS'];
      const missingMethods = requiredMethods.filter(method => 
        !rule.AllowedMethods.includes(method)
      );
      if (missingMethods.length > 0) {
        warnings.push(`규칙 ${index + 1}: 필요한 메서드 누락: ${missingMethods.join(', ')}`);
      }
    }

    // AllowedHeaders 확인
    if (!rule.AllowedHeaders || rule.AllowedHeaders.length === 0) {
      warnings.push(`규칙 ${index + 1}: AllowedHeaders가 설정되지 않음`);
    }

    // MaxAgeSeconds 확인
    if (!rule.MaxAgeSeconds || rule.MaxAgeSeconds < 300) {
      warnings.push(`규칙 ${index + 1}: MaxAgeSeconds가 너무 짧음 (권장: 86400)`);
    }
  });

  if (issues.length > 0) {
    severity = 'high';
  } else if (warnings.length > 0) {
    severity = 'medium';
  }

  return {
    hasCors: true,
    issues,
    warnings,
    severity,
    ruleCount: corsRules.length
  };
}

// CORS 권장사항 생성
function generateCorsRecommendations(analysis) {
  const recommendations = [];

  if (!analysis.hasCors) {
    recommendations.push('🌐 S3 버킷에 CORS 설정을 추가해야 합니다.');
    recommendations.push('📋 CORS 설정 스크립트를 실행하여 설정을 업데이트하세요.');
  } else {
    if (analysis.issues.length > 0) {
      recommendations.push('🔧 CORS 설정의 문제점을 수정해야 합니다.');
      analysis.issues.forEach(issue => {
        recommendations.push(`   - ${issue}`);
      });
    }

    if (analysis.warnings.length > 0) {
      recommendations.push('⚠️ CORS 설정을 개선하는 것을 권장합니다.');
      analysis.warnings.forEach(warning => {
        recommendations.push(`   - ${warning}`);
      });
    }

    if (analysis.severity === 'low') {
      recommendations.push('✅ CORS 설정이 적절합니다.');
    }
  }

  recommendations.push('🚀 설정 후 웹사이트에서 CORS 테스트를 다시 실행해보세요.');

  return recommendations;
}
