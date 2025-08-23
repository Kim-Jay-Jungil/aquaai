// api/ping.js - 가장 간단한 API 테스트
module.exports = function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 모든 HTTP 메서드 허용
  return res.status(200).json({
    message: 'pong',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: Object.keys(req.headers),
    success: true
  });
}
