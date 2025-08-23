// api/whoami.js
export default async function handler(req, res) {
  try {
    res.status(200).json({
      ok: true,
      env: {
        AWS_REGION: Boolean(process.env.AWS_REGION),
        S3_BUCKET: Boolean(process.env.S3_BUCKET),
        S3_PREFIX: process.env.S3_PREFIX || 'uploads',
        CDN_BASE: process.env.CDN_BASE || null
      }
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}