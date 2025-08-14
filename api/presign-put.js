import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "node:crypto";

const s3 = new S3Client({
  region: process.env.AWS_REGION
  // 자격증명은 Vercel 환경변수(AWS_ACCESS_KEY_ID/SECRET_KEY) 자동 사용
});

export default async function handler(req, res) {
  // 간단 CORS (필요할 때만 확장)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { filename, type, size } = req.body ?? {};
    if (!filename || !type || typeof size !== "number") {
      return res.status(400).json({ error: "filename, type, size are required" });
    }
    if (!type.startsWith("image/")) {
      return res.status(400).json({ error: "only image/* allowed" });
    }
    const MAX = 100 * 1024 * 1024; // 100MB
    if (size > MAX) {
      return res.status(400).json({ error: "file too large" });
    }

    const key = makeKey(filename);
    const cmd = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ContentType: type
      // ACL은 기본 private. CloudFront OAC로 서빙 중이면 private 정상.
    });

    const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 }); // 5분 유효
    const base =
      process.env.CDN_BASE ||
      `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;
    const publicUrl = `${base}/${encodeURI(key)}`;

    return res.status(200).json({ url, key, publicUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "presign_failed", detail: String(err?.message || err) });
  }
}

function makeKey(original) {
  const clean = String(original).replace(/[^\w.\-() ]+/g, "_");
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
  const rand = crypto.randomBytes(6).toString("hex");
  return `uploads/${stamp}/${Date.now()}-${rand}/${clean}`;
}
