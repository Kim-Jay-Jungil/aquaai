// api/whoami.js
export default function handler(req, res) {
  const mask = (v) => (v ? '***' : null);
  res.status(200).json({
    ok: true,
    env: {
      AWS_REGION: !!process.env.AWS_REGION,
      S3_BUCKET: !!process.env.S3_BUCKET,
      AWS_ACCESS_KEY_ID: mask(process.env.AWS_ACCESS_KEY_ID),
      AWS_SECRET_ACCESS_KEY: mask(process.env.AWS_SECRET_ACCESS_KEY),
      S3_PREFIX: process.env.S3_PREFIX || null,
      CDN_BASE: process.env.CDN_BASE || null
    }
  });
}