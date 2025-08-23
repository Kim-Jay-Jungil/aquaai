// api/presign-put.js
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, safeKey, publicBase, requireEnv } from './_lib/s3.js';

async function readJson(req) {
  const ct = (req.headers['content-type'] || '').toLowerCase();
  const chunks = [];
  for await (const ch of req) chunks.push(ch);
  const raw = Buffer.concat(chunks).toString('utf8') || '';
  if (ct.includes('application/json')) {
    try { return JSON.parse(raw || '{}'); } catch { return {}; }
  }
  if (ct.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(raw));
  }
  return { filename: req.query?.filename, contentType: req.query?.contentType };
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    const body = await readJson(req);
    const filename = body.filename;
    const contentType = body.contentType || 'application/octet-stream';
    if (!filename) return res.status(400).json({ ok: false, error: 'filename required' });

    const bucket = requireEnv('S3_BUCKET');
    const client = s3Client();

    const Key = safeKey(filename);
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key,
      ContentType: contentType
      // ACL: 'public-read'  // 버킷 퍼블릭 차단이 켜져있으면 사용하지 마세요.
    });

    const putUrl = await getSignedUrl(client, cmd, { expiresIn: 600 });
    const publicUrl = `${publicBase()}/${Key}`;

    return res.status(200).json({ ok: true, putUrl, key: Key, publicUrl });
  } catch (e) {
    console.error('[presign-put] error:', e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}