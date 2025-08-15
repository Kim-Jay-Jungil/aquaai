// api/presign-put.js
import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REGION = process.env.S3_REGION;
const BUCKET = process.env.S3_BUCKET;
const PUBLIC_BASE =
  process.env.CDN_BASE ||
  (REGION && BUCKET
    ? `https://${BUCKET}.s3.${REGION}.amazonaws.com`
    : "");

const s3 = new S3Client({ region: REGION });

function safeName(name = "image.jpg") {
  return name.replace(/[^\w.\-]+/g, "_").slice(-120);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { filename = "image.jpg", contentType = "application/octet-stream" } =
      req.body || {};

    if (!REGION || !BUCKET) {
      return res
        .status(500)
        .json({ error: "S3 configs missing (S3_REGION/S3_BUCKET)" });
    }

    const now = new Date();
    const yyyy = String(now.getUTCFullYear());
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(now.getUTCDate()).padStart(2, "0");
    const rnd = crypto.randomBytes(4).toString("hex");
    const base = safeName(filename);
    const key = `uploads/${yyyy}/${mm}/${dd}/${Date.now()}-${rnd}/${base}`;

    const cmd = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3, cmd, { expiresIn: 900 }); // 15분
    const publicUrl = PUBLIC_BASE ? `${PUBLIC_BASE}/${key}` : "";

    return res.json({ url, key, publicUrl });
  } catch (err) {
    console.error("presign error", err);
    return res.status(500).json({ error: err?.message || String(err) });
  }
}