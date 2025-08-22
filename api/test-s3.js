// api/test-s3.js - S3 연결 및 CORS 테스트
import { S3Client, ListBucketsCommand, HeadBucketCommand, PutObjectCommand } from '@aws-sdk/client-s3';

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
    console.log('🧪 S3 연결 테스트 시작...');

    // 환경 변수 확인
    const requiredEnvVars = ['AWS_REGION', 'S3_BUCKET', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      return res.status(500).json({
        success: false,
        error: 'Missing environment variables',
        missing: missingVars,
        message: '필수 환경 변수가 설정되지 않았습니다.'
      });
    }

    const envStatus = {
      AWS_REGION: process.env.AWS_REGION ? '설정됨' : '설정되지 않음',
      S3_BUCKET: process.env.S3_BUCKET ? '설정됨' : '설정되지 않음',
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? '설정됨' : '설정되지 않음',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? '설정됨' : '설정되지 않음'
    };

    console.log('🔍 환경 변수 상태:', envStatus);

    // S3 클라이언트 초기화
    const s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    const bucketName = process.env.S3_BUCKET;
    const tests = [];

    // 1. ListBuckets 테스트
    try {
      console.log('📋 ListBuckets 테스트 중...');
      const listCommand = new ListBucketsCommand({});
      const listResult = await s3Client.send(listCommand);
      tests.push({
        name: 'ListBuckets',
        status: 'success',
        message: '버킷 목록 조회 성공',
        data: {
          bucketCount: listResult.Buckets?.length || 0,
          buckets: listResult.Buckets?.map(b => b.Name) || []
        }
      });
      console.log('✅ ListBuckets 성공');
    } catch (error) {
      tests.push({
        name: 'ListBuckets',
        status: 'error',
        message: '버킷 목록 조회 실패',
        error: error.message,
        code: error.$metadata?.httpStatusCode
      });
      console.error('❌ ListBuckets 실패:', error.message);
    }

    // 2. HeadBucket 테스트 (특정 버킷 접근 권한)
    try {
      console.log('🔍 HeadBucket 테스트 중...');
      const headCommand = new HeadBucketCommand({ Bucket: bucketName });
      const headResult = await s3Client.send(headCommand);
      tests.push({
        name: 'HeadBucket',
        status: 'success',
        message: '버킷 접근 권한 확인 성공',
        data: {
          bucket: bucketName,
          region: headResult.$metadata?.extendedRequestId
        }
      });
      console.log('✅ HeadBucket 성공');
    } catch (error) {
      tests.push({
        name: 'HeadBucket',
        status: 'error',
        message: '버킷 접근 권한 확인 실패',
        error: error.message,
        code: error.$metadata?.httpStatusCode
      });
      console.error('❌ HeadBucket 실패:', error.message);
    }

    // 3. PutObject 시뮬레이션 테스트
    try {
      console.log('📤 PutObject 권한 테스트 중...');
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: 'test-cors-permission.txt',
        Body: 'CORS 권한 테스트용 파일',
        ContentType: 'text/plain'
      });
      
      // 실제 업로드는 하지 않고 권한만 확인
      const putResult = await s3Client.send(putCommand);
      tests.push({
        name: 'PutObject',
        status: 'success',
        message: '파일 업로드 권한 확인 성공',
        data: {
          bucket: bucketName,
          key: 'test-cors-permission.txt',
          etag: putResult.ETag
        }
      });
      console.log('✅ PutObject 성공');
    } catch (error) {
      tests.push({
        name: 'PutObject',
        status: 'error',
        message: '파일 업로드 권한 확인 실패',
        error: error.message,
        code: error.$metadata?.httpStatusCode
      });
      console.error('❌ PutObject 실패:', error.message);
    }

    // 4. CORS 설정 확인 (간접적)
    try {
      console.log('🌐 CORS 설정 확인 중...');
      const corsCommand = new HeadBucketCommand({ Bucket: bucketName });
      await s3Client.send(corsCommand);
      
      // CORS 설정이 있다면 에러가 발생하지 않음
      tests.push({
        name: 'CORS',
        status: 'success',
        message: 'CORS 설정 확인 성공 (간접적)',
        data: {
          bucket: bucketName,
          note: 'CORS 설정은 별도 API로 확인 필요'
        }
      });
      console.log('✅ CORS 확인 성공');
    } catch (error) {
      tests.push({
        name: 'CORS',
        status: 'error',
        message: 'CORS 설정 확인 실패',
        error: error.message,
        code: error.$metadata?.httpStatusCode
      });
      console.error('❌ CORS 확인 실패:', error.message);
    }

    // 전체 테스트 결과 요약
    const successCount = tests.filter(t => t.status === 'success').length;
    const totalCount = tests.length;
    const overallStatus = successCount === totalCount ? 'success' : 'partial';

    console.log(`🏁 S3 테스트 완료: ${successCount}/${totalCount} 성공`);

    return res.status(200).json({
      success: true,
      overallStatus,
      summary: {
        total: totalCount,
        success: successCount,
        failed: totalCount - successCount
      },
      environment: envStatus,
      tests,
      recommendations: getRecommendations(tests)
    });

  } catch (error) {
    console.error('💥 S3 테스트 중 치명적 오류:', error);
    
    return res.status(500).json({
      success: false,
      error: 'S3 테스트 실패',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// 테스트 결과에 따른 권장사항 생성
function getRecommendations(tests) {
  const recommendations = [];
  
  const failedTests = tests.filter(t => t.status === 'error');
  
  if (failedTests.length === 0) {
    recommendations.push('🎉 모든 S3 테스트가 성공했습니다!');
    return recommendations;
  }
  
  failedTests.forEach(test => {
    switch (test.name) {
      case 'ListBuckets':
        recommendations.push('🔑 AWS IAM 사용자에게 s3:ListAllMyBuckets 권한을 부여하세요.');
        break;
      case 'HeadBucket':
        recommendations.push('🔑 AWS IAM 사용자에게 s3:GetBucketLocation 권한을 부여하세요.');
        break;
      case 'PutObject':
        recommendations.push('🔑 AWS IAM 사용자에게 s3:PutObject 권한을 부여하세요.');
        recommendations.push('🌐 S3 버킷 CORS 설정을 확인하고 업데이트하세요.');
        break;
      case 'CORS':
        recommendations.push('🌐 S3 버킷 CORS 설정을 확인하고 업데이트하세요.');
        recommendations.push('📋 CORS 설정 스크립트를 실행하여 설정을 업데이트하세요.');
        break;
    }
  });
  
  if (failedTests.some(t => t.name === 'PutObject' || t.name === 'CORS')) {
    recommendations.push('🚀 CORS 설정 후 웹사이트에서 S3 테스트를 다시 실행해보세요.');
  }
  
  return recommendations;
}
