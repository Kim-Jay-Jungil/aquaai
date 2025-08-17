import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function getPresignedPut({ filename, contentType }) {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET missing");

  const prefix = (process.env.S3_PREFIX || "uploads").replace(/^\/|\/$/g, "");
  const ts = new Date();
  const y = ts.getUTCFullYear();
  const m = String(ts.getUTCMonth() + 1).padStart(2, "0");
  const d = String(ts.getUTCDate()).padStart(2, "0");
  const id = crypto.randomUUID();
  const safeName = (filename || "file").replace(/[^\w.\-]+/g, "_");

  const key = `${prefix}/${y}/${m}/${d}/${id}-${safeName}`;

  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType || "application/octet-stream",
    ACL: "private"
  });

  // URL 유효시간 60초
  const url = await getSignedUrl(s3, cmd, { expiresIn: 60 });

  // 퍼블릭 접근 URL (CloudFront 권장)
  const cdn = process.env.CDN_BASE?.replace(/\/+$/, "");
  const publicUrl = cdn
    ? `${cdn}/${key}`
    : `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${encodeURIComponent(key)}`;

  return { url, key, publicUrl };
}