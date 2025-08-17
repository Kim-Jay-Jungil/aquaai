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
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const body = await parseBody(req);
    const filename = body.filename || req.query.filename || '';
    const contentType = body.contentType || req.query.contentType || '';

    if (!filename) {
      return res.status(400).json({ ok: false, error: 'filename required' });
    }

    const { url, key, publicUrl } = await presignPut(filename, contentType);
    return res.status(200).json({ ok: true, url, key, publicUrl });
  } catch (e) {
    console.error('presign error', e);
    return res.status(500).json({ ok: false, error: 'server', detail: e.message });
  }
}