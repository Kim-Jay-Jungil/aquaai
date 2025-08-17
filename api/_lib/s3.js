import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

const region = process.env.AWS_REGION;
const bucket = process.env.S3_BUCKET;

if (!region) console.error("[S3] AWS_REGION is missing");
if (!bucket) console.error("[S3] S3_BUCKET is missing");

// Vercel 환경변수에 키가 없으면 presign 자체가 불가합니다.
const hasCreds = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
if (!hasCreds) console.error("[S3] AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY missing");

const s3 = new S3Client({ region });

export async function getPresignedPut({ filename, contentType }) {
  if (!region) throw new Error("AWS_REGION missing");
  if (!bucket) throw new Error("S3_BUCKET missing");
  if (!hasCreds) throw new Error("AWS credentials missing");

  const prefix = (process.env.S3_PREFIX || "uploads").replace(/^\/|\/$/g, "");
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  const id = crypto.randomUUID();
  const safe = (filename || "file").replace(/[^\w.\-]+/g, "_");

  const key = `${prefix}/${y}/${m}/${d}/${id}-${safe}`;

  // ⚠️ ACL 헤더를 서명에 포함하면 클라이언트 PUT 시 동일 헤더를 보내야 합니다.
  // 버킷이 "Bucket owner enforced"인 경우 ACL 자체가 금지라 400 납니다.
  // → PutObjectCommand에서 ACL을 빼고 기본(소유자) 권한을 사용합니다.
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType || "application/octet-stream"
  });

  const url = await getSignedUrl(s3, cmd, { expiresIn: 60 }); // 60s 유효

  const cdn = process.env.CDN_BASE?.replace(/\/+$/, "");
  const publicUrl = cdn
    ? `${cdn}/${key}`
    : `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;

  return { url, key, publicUrl };
}