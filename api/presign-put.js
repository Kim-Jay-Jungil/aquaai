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
  // 1) 메서드 체크
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  // 2) 환경변수 존재 여부(비밀은 마스킹하여 로그)
  const envReport = {
    AWS_REGION: !!process.env.AWS_REGION,
    S3_BUCKET: !!process.env.S3_BUCKET,
    AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
    S3_PREFIX: !!process.env.S3_PREFIX,
    CDN_BASE: !!process.env.CDN_BASE
  };

  try {
    // 3) 본문 파싱 & 필수값 검증
    const body = await parseBody(req);
    const filename = body.filename || req.query.filename || '';
    const contentType = body.contentType || req.query.contentType || '';

    if (!filename) {
      console.warn('[presign] 400 filename required', { envReport, headers: req.headers });
      return res.status(400).json({ ok: false, error: 'filename required' });
    }

    console.log('[presign] start', { filename, contentType, envReport });

    // 4) Pre-sign 생성
    const { url, key, publicUrl } = await presignPut(filename, contentType);

    console.log('[presign] ok', { key });
    return res.status(200).json({ ok: true, url, key, publicUrl });
  } catch (e) {
    // 5) 에러 로깅 + 클라이언트에 상세 메시지 전달
    console.error('[presign] 500 error', e);
    const safeDetail = (e && e.message) ? e.message : String(e);
    return res.status(500).json({ ok: false, error: 'server', detail: safeDetail });
  }
}