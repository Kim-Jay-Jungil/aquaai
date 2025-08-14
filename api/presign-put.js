import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ---- 환경 ----
// Vercel Project > Settings > Environment Variables 에 아래 키 세팅:
// AWS_REGION        (예: us-east-1)
// S3_BUCKET         (예: aqua.ai-output)
// AWS_ACCESS_KEY_ID
// AWS_SECRET_ACCESS_KEY
// (선택) CDN_BASE   (예: https://xxxx.cloudfront.net)

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  // Vercel은 기본적으로 환경변수 자격증명을 자동 주입함
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  } : undefined
});

export default async function handler(req, res) {
  // CORS(필요시 특정 오리진으로 제한)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST")    return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = await readJson(req);
    const filename = String(body?.filename || "");
    const type = String(body?.type || "");
    const size = Number(body?.size || 0);

    if (!filename || !type || !size) {
      return res.status(400).json({ error: "filename, type, size are required" });
    }
    if (!type.startsWith("image/")) {
      return res.status(400).json({ error: "only image/* allowed" });
    }
    const MAX = 100 * 1024 * 1024; // 100MB
    if (size > MAX) {
      return res.status(400).json({ error: "file too large" });
    }
    if (!process.env.S3_BUCKET || !process.env.AWS_REGION) {
      return res.status(500).json({ error: "server env not configured" });
    }

    const key = makeKey(filename);
    const cmd = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ContentType: type // S3에 저장되는 MIME
      // ACL: 기본 private (CloudFront OAC 사용 시 권장)
    });

    // 5분 유효 사전서명 URL
    const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 });

    const base = process.env.CDN_BASE
      || `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;
    const publicUrl = `${base}/${encodeURI(key)}`;

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ uploadUrl, key, publicUrl });
  } catch (err) {
    console.error("[presign-put] error:", err);
    return res.status(500).json({ error: "presign_failed" });
  }
}

// ---- helpers ----
function readJson(req) {
  return new Promise((resolve, reject) => {
    let b = "";
    req.on("data", c => b += c);
    req.on("end", () => {
      try { resolve(b ? JSON.parse(b) : {}); }
      catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}
function makeKey(original) {
  const clean = String(original).replace(/[^\w.\-() ]+/g, "_").slice(0, 120);
  const d = new Date();
  const pad = n => String(n).padStart(2, "0");
  const stamp = `${d.getUTCFullYear()}/${pad(d.getUTCMonth()+1)}/${pad(d.getUTCDate())}`;
  const rand = Math.random().toString(36).slice(2, 10);
  return `uploads/${stamp}/${Date.now()}_${rand}_${clean}`;
}
