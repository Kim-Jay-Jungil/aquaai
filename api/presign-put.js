// api/presign-put.js
import { presignPut } from './_lib/s3.js';

function readRaw(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (d) => (data += d));
    req.on('end', () => resolve(data || ''));
  });
}

async function parseBody(req) {
  const ct = String(req.headers['content-type'] || '').toLowerCase();
  const raw = await readRaw(req);

  if (!raw) return {};

  if (ct.includes('application/json')) {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  if (ct.includes('application/x-www-form-urlencoded')) {
    const p = new URLSearchParams(raw);
    return Object.fromEntries(p.entries());
  }
  return {};
}

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리 (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      ok: false, 
      error: 'Method Not Allowed',
      allowedMethods: ['POST']
    });
  }

  try {
    const body = await parseBody(req);
    const filename = body.filename || req.query.filename || '';
    const contentType = body.contentType || req.query.contentType || '';

    if (!filename) {
      return res.status(400).json({ 
        ok: false, 
        error: 'filename required',
        received: { filename, contentType }
      });
    }

    console.log(`Presign request for: ${filename}, type: ${contentType}`);

    const { url, key, publicUrl } = await presignPut(filename, contentType);
    
    console.log(`Presign successful: ${key}`);
    
    return res.status(200).json({ 
      ok: true, 
      url, 
      key, 
      publicUrl,
      message: 'Presigned URL generated successfully'
    });
    
  } catch (e) {
    console.error('Presign error:', e);
    
    // 환경 변수 누락 체크
    if (e.message.includes('Missing required environment variables')) {
      return res.status(500).json({ 
        ok: false, 
        error: 'configuration_error',
        detail: 'S3 configuration is missing. Please check environment variables.',
        message: '서버 설정 오류: S3 환경 변수가 설정되지 않았습니다.'
      });
    }
    
    // S3 접근 오류
    if (e.message.includes('AccessDenied') || e.message.includes('access denied')) {
      return res.status(500).json({ 
        ok: false, 
        error: 'access_denied',
        detail: 'S3 access denied. Check AWS credentials and permissions.',
        message: 'S3 접근 권한 오류: AWS 자격 증명을 확인하세요.'
      });
    }
    
    // 기타 오류
    return res.status(500).json({ 
      ok: false, 
      error: 'server_error',
      detail: e.message,
      message: '서버 오류가 발생했습니다.'
    });
  }
}