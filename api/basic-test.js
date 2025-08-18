// api/basic-test.js - 가장 기본적인 테스트
export default async function handler(req, res) {
  try {
    console.log('🧪 기본 테스트 시작');
    
    // 현재 시간
    const now = new Date();
    
    // 환경변수 상태 (민감한 정보는 노출하지 않음)
    const envStatus = {
      NODE_ENV: process.env.NODE_ENV || 'development',
      hasNotionApiKey: Boolean(process.env.NOTION_API_KEY),
      hasNotionDb: Boolean(process.env.NOTION_DB_SUBMISSIONS),
      timestamp: now.toISOString()
    };
    
    console.log('✅ 기본 테스트 성공:', envStatus);
    
    return res.status(200).json({
      ok: true,
      message: '기본 테스트 성공',
      data: envStatus
    });
    
  } catch (error) {
    console.error('❌ 기본 테스트 실패:', error);
    
    return res.status(500).json({
      ok: false,
      error: '기본 테스트 실패',
      details: error.message
    });
  }
}
