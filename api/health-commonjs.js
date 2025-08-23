// api/health-commonjs.js - CommonJS 형식 예시
module.exports = function handler(req, res) {
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
    console.log('🏥 Health check API 호출됨');
    
    // 환경 변수 상태 확인
    const envStatus = {
      AWS_REGION: process.env.AWS_REGION ? '설정됨' : '설정되지 않음',
      S3_BUCKET: process.env.S3_BUCKET ? '설정됨' : '설정되지 않음',
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? '설정됨' : '설정되지 않음',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? '설정됨' : '설정되지 않음',
      NOTION_API_KEY: process.env.NOTION_API_KEY ? '설정됨' : '설정되지 않음',
      NOTION_DB_SUBMISSIONS: process.env.NOTION_DB_SUBMISSIONS ? '설정됨' : '설정되지 않음'
    };

    // Vercel 환경 정보
    const vercelInfo = {
      environment: process.env.VERCEL_ENV || 'unknown',
      region: process.env.VERCEL_REGION || 'unknown',
      url: process.env.VERCEL_URL || 'unknown'
    };

    const healthData = {
      status: 'healthy',
      message: 'Aqua.AI API 서버가 정상적으로 작동 중입니다',
      timestamp: new Date().toISOString(),
      environment: envStatus,
      vercel: vercelInfo,
      api: {
        version: '1.0.0',
        endpoints: [
          '/api/health',
          '/api/test-simple',
          '/api/test-s3',
          '/api/test-cors',
          '/api/test-notion',
          '/api/presign-put',
          '/api/enhance-image',
          '/api/debug-env'
        ]
      }
    };

    console.log('✅ Health check 성공:', healthData);
    
    return res.status(200).json(healthData);

  } catch (error) {
    console.error('❌ Health check 실패:', error);
    
    return res.status(500).json({
      status: 'unhealthy',
      message: 'API 서버에 문제가 발생했습니다',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
