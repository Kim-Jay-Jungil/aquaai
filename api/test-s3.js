// api/test-s3.js
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, requireEnv } from './_lib/s3.js';

export default async function handler(req, res) {
  try {
    const bucket = requireEnv('S3_BUCKET');
    const client = s3Client();

    const key = `health/${Date.now()}.txt`;
    const out = await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: 'ok',
      ContentType: 'text/plain'
    }));

    res.status(200).json({ ok: true, key, etag: out.ETag });
  } catch (e) {
    console.error('[test-s3]', e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
