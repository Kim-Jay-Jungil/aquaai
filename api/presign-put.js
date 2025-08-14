import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// 필요한 환경변수 (Vercel Project Settings → Environment Variables)
// AWS_REGION        (예: us-east-1)
// S3_BUCKET         (예: aqua.ai-output)  ← 점(.) 포함 버킷도 OK
// AWS_ACCESS_KEY_ID
// AWS_SECRET_ACCESS_KEY
// (선택) CDN_BASE   (예: https://xxxx.cloudfront.net)

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  // 점(.) 포함 버킷 호환을 위해 path-style 강제 (중요)
  forcePathStyle: true,
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  } : undefined
});

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST")    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { filename, type, size } = await readJson(req);
    if (!filename || !type || !size) {
      return res.status(400).json({ error: "filename, type, size are required" });
    }
    if (!type.startsWith("image/")) {
      return res.status(400).json({ error: "only image/* allowed" });
    }
    if (!process.env.S3_BUCKET || !process.env.AWS_REGION) {
      return res.status(500).json({ error: "server env not configured" });
    }

    const key = makeKey(filename);
    const cmd = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ContentType: type
    });

    // 5분 유효
    const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 });

    // 보기/다운로드용 공개 URL (CloudFront 있으면 그걸 우선)
    const base = process.env.CDN_BASE
      || `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.S3_BUCKET}`;
    const publicUrl = `${base}/${encodeURI(key)}`;

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ uploadUrl, key, publicUrl });
  } catch (err) {
    console.error("[presign-put] error:", err);
    return res.status(500).json({ error: "presign_failed" });
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let b = "";
    req.on("data", c => b += c);
    req.on("end", () => { try { resolve(b ? JSON.parse(b) : {}); } catch(e){ reject(e); } });
    req.on("error", reject);
  });
}

function makeKey(original) {
  const clean = String(original).replace(/[^\w.\-() ]+/g, "_").slice(0, 120);
  const d = new Date(), pad = n => String(n).padStart(2,"0");
  const stamp = `${d.getUTCFullYear()}/${pad(d.getUTCMonth()+1)}/${pad(d.getUTCDate())}`;
  const rand = Math.random().toString(36).slice(2,10);
  return `uploads/${stamp}/${Date.now()}_${rand}_${clean}`;
}
