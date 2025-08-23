// api/echo.js - 가장 기본적인 echo API
export default async function handler(req, res) {
  try {
    console.log('🔊 Echo API 호출됨');
    
    const requestInfo = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      timestamp: new Date().toISOString()
    };
    
    console.log('📋 요청 정보:', requestInfo);
    
    return res.status(200).json({
      ok: true,
      message: 'Echo API 작동 중',
      request: requestInfo,
      serverTime: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Echo API 오류:', error);
    
    return res.status(500).json({
      ok: false,
      error: 'Echo API 오류',
      details: error.message
    });
  }
}
