// api/_lib/s3.js
import { S3Client } from '@aws-sdk/client-s3';
import crypto from 'crypto';

export function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function s3Client() {
  const region = requireEnv('AWS_REGION');
  const accessKeyId = requireEnv('AWS_ACCESS_KEY_ID');
  const secretAccessKey = requireEnv('AWS_SECRET_ACCESS_KEY');
  return new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
}

export function safeKey(filename, prefix = process.env.S3_PREFIX || 'uploads') {
  const ext = (filename.split('.').pop() || 'bin').toLowerCase();
  const base = filename.replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'file';
  const dt = new Date();
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  const dir = (prefix || 'uploads').replace(/^\/+|\/+$/g, '');
  return `${dir}/${y}/${m}/${d}/${id}-${base}.${ext}`;
}

export function publicBase() {
  // 버킷이 퍼블릭이 아니면 CDN_BASE 를 사용하세요.
  const cdn = process.env.CDN_BASE && process.env.CDN_BASE.replace(/\/+$/,'');
  if (cdn) return cdn;
  const bucket = requireEnv('S3_BUCKET');
  const region = requireEnv('AWS_REGION');
  // NOTE: us-east-1 은 s3.amazonaws.com 도 되지만, 지역 고정 URL 사용을 권장
  return `https://${bucket}.s3.${region}.amazonaws.com`;
}