// api/test.js - 간단한 테스트용 API
export default function handler(req, res) {
  return res.status(200).json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: req.headers
  });
}
