// api/debug-env.js - 환경 변수 디버깅용
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 환경 변수 상태 확인 (민감한 정보는 마스킹)
    const envStatus = {
      AWS_REGION: process.env.AWS_REGION ? '✅ Set' : '❌ Missing',
      S3_BUCKET: process.env.S3_BUCKET ? '✅ Set' : '❌ Missing',
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing',
      NOTION_API_KEY: process.env.NOTION_API_KEY ? '✅ Set' : '❌ Missing',
      NOTION_DB_SUBMISSIONS: process.env.NOTION_DB_SUBMISSIONS ? '✅ Set' : '❌ Missing',
      S3_PREFIX: process.env.S3_PREFIX || 'uploads (default)',
      NODE_ENV: process.env.NODE_ENV || 'development'
    };

    // AWS SDK 테스트
    let awsTest = 'Not tested';
    try {
      const { S3Client } = await import('@aws-sdk/client-s3');
      const client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      });
      
      // 간단한 연결 테스트 (실제 API 호출 없음)
      awsTest = '✅ AWS SDK initialized successfully';
    } catch (error) {
      awsTest = `❌ AWS SDK error: ${error.message}`;
    }

    return res.status(200).json({
      success: true,
      environment: envStatus,
      awsTest,
      timestamp: new Date().toISOString(),
      vercel: {
        region: process.env.VERCEL_REGION,
        url: process.env.VERCEL_URL,
        gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
