// api/test-simple.js - 간단한 테스트용 API
export default function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET 요청만 허용
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      allowedMethods: ['GET']
    });
  }

  return res.status(200).json({
    message: 'Simple API is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    status: 'success'
  });
}
