// api/whoami.js
export default async function handler(req, res) {
  try {
    const present = (v) => Boolean(v);

    res.status(200).json({
      ok: true,
      userId: null,          // 인증은 아직 사용 안 함(공개 모드)
      env: {
        AWS_REGION: present(process.env.AWS_REGION),
        S3_BUCKET: present(process.env.S3_BUCKET),
        S3_PREFIX: process.env.S3_PREFIX || 'uploads',
        CDN_BASE: process.env.CDN_BASE || null,
      },
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}