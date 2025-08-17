// api/_lib/s3.js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

const region = process.env.AWS_REGION;
const bucket = process.env.S3_BUCKET;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const CDN_BASE =
  process.env.CDN_BASE || (region && bucket
    ? `https://${bucket}.s3.${region}.amazonaws.com`
    : '');

const PREFIX = (process.env.S3_PREFIX || 'uploads').replace(/^\/+|\/+$/g, '');

let _s3;
function s3() {
  if (!_s3) {
    if (!region || !bucket || !accessKeyId || !secretAccessKey) {
      throw new Error('S3 env missing (AWS_REGION, S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)');
    }
    _s3 = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey }
    });
  }
  return _s3;
}

export function buildKey(filename) {
  const safe = String(filename || 'file')
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, '-');

  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const id = crypto.randomUUID().slice(0, 8);

  return `${PREFIX}/${yyyy}/${mm}/${dd}/${id}-${safe}`;
}

export async function presignPut(filename, contentType) {
  const key = buildKey(filename);
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType || 'application/octet-stream'
  });
  const url = await getSignedUrl(s3(), cmd, { expiresIn: 300 });
  const publicUrl = `${CDN_BASE}/${key}`;
  return { key, url, publicUrl };
}