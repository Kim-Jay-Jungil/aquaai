import { verifyToken } from '@clerk/backend';

export default async function handler(req, res) {
  try {
    let userId = null;
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (process.env.CLERK_SECRET_KEY && token) {
      const claims = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
      userId = claims?.sub ?? null;
    }

    res.status(200).json({
      ok: true,
      userId,
      env: {
        AWS_REGION: !!process.env.AWS_REGION,
        S3_BUCKET: !!process.env.S3_BUCKET,
        S3_PREFIX: process.env.S3_PREFIX || 'uploads',
        CDN_BASE: process.env.CDN_BASE || null
      }
    });
  } catch {
    res.status(200).json({ ok: true, userId: null, note: 'public mode' });
  }
  
}