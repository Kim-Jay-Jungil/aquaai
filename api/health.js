// api/health.js - API 상태 확인용
export default function handler(req, res) {
  return res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    message: 'Aqua.AI API is running'
  });
}