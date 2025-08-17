// api/_lib/s3.js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

const region = process.env.AWS_REGION;
const bucket = process.env.S3_BUCKET;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

// CloudFront 등 CDN이 있다면 넣고, 없으면 S3 정적 URL을 씁니다.
const CDN_BASE =
  process.env.CDN_BASE || (region && bucket
    ? `https://${bucket}.s3.${region}.amazonaws.com`
    : '');

const PREFIX = (process.env.S3_PREFIX || 'uploads').replace(/^\/+|\/+$/g, '');

// 환경 변수 검증 함수
function validateEnvironment() {
  const missingVars = [];
  
  if (!region) missingVars.push('AWS_REGION');
  if (!bucket) missingVars.push('S3_BUCKET');
  if (!accessKeyId) missingVars.push('AWS_ACCESS_KEY_ID');
  if (!secretAccessKey) missingVars.push('AWS_SECRET_ACCESS_KEY');
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}. Please check your .env.local file or Vercel environment variables.`);
  }
}

let _s3;
function s3() {
  if (!_s3) {
    try {
      validateEnvironment();
      
      _s3 = new S3Client({
        region,
        credentials: { accessKeyId, secretAccessKey }
      });
      
      console.log(`S3 client initialized for bucket: ${bucket} in region: ${region}`);
    } catch (error) {
      console.error('S3 initialization failed:', error.message);
      throw error;
    }
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
  try {
    const key = buildKey(filename);
    console.log(`Generating presigned URL for key: ${key}`);
    
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType || 'application/octet-stream'
    });
    
    const url = await getSignedUrl(s3(), cmd, { expiresIn: 300 });
    const publicUrl = `${CDN_BASE}/${key}`;
    
    console.log(`Presigned URL generated successfully for: ${filename}`);
    return { key, url, publicUrl };
    
  } catch (error) {
    console.error('Presign operation failed:', error);
    
    if (error.message.includes('Missing required environment variables')) {
      throw new Error('S3 configuration error: Environment variables not set. Please check your configuration.');
    } else if (error.message.includes('AccessDenied')) {
      throw new Error('S3 access denied: Check your AWS credentials and permissions.');
    } else if (error.message.includes('NoSuchBucket')) {
      throw new Error('S3 bucket not found: Check your bucket name and region.');
    } else {
      throw new Error(`S3 operation failed: ${error.message}`);
    }
  }
}