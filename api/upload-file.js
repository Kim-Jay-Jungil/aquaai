// api/upload-file.js - 프록시 파일 업로드 (CORS 문제 해결)
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

function readRaw(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (d) => (data += d));
    req.on('end', () => resolve(data || ''));
  });
}

async function parseBody(req) {
  const ct = String(req.headers['content-type'] || '').toLowerCase();
  const raw = await readRaw(req);

  if (!raw) return {};

  if (ct.includes('application/json')) {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  if (ct.includes('application/x-www-form-urlencoded')) {
    const p = new URLSearchParams(raw);
    return Object.fromEntries(p.entries());
  }
  return {};
}

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리 (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      ok: false, 
      error: 'Method Not Allowed',
      allowedMethods: ['POST']
    });
  }

  try {
    const body = await parseBody(req);
    const { presignUrl, filename, contentType, fileData } = body;

    if (!presignUrl || !filename || !contentType || !fileData) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing required fields',
        required: ['presignUrl', 'filename', 'contentType', 'fileData'],
        received: { presignUrl: !!presignUrl, filename: !!filename, contentType: !!contentType, fileData: !!fileData }
      });
    }

    console.log(`Proxy upload for: ${filename}, type: ${contentType}`);

    // Base64 데이터를 Buffer로 변환
    const fileBuffer = Buffer.from(fileData, 'base64');
    
    // S3에 직접 업로드
    const uploadParams = {
      Bucket: process.env.S3_BUCKET,
      Key: filename,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: 'public-read'
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    console.log(`Proxy upload successful: ${filename}`);
    
    // 공개 URL 생성
    const publicUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
    
    return res.status(200).json({ 
      ok: true, 
      filename,
      publicUrl,
      message: 'File uploaded successfully via proxy'
    });
    
  } catch (e) {
    console.error('Proxy upload error:', e);
    
    // 환경 변수 누락 체크
    if (e.message.includes('Missing required environment variables')) {
      return res.status(500).json({ 
        ok: false, 
        error: 'configuration_error',
        detail: 'S3 configuration is missing. Please check environment variables.',
        message: '서버 설정 오류: S3 환경 변수가 설정되지 않았습니다.'
      });
    }
    
    // S3 접근 오류
    if (e.name === 'AccessDenied' || e.message.includes('access denied')) {
      return res.status(500).json({ 
        ok: false, 
        error: 'access_denied',
        detail: 'S3 access denied. Check AWS credentials and permissions.',
        message: 'S3 접근 권한 오류: AWS 자격 증명을 확인하세요.'
      });
    }
    
    // 기타 오류
    return res.status(500).json({ 
      ok: false, 
      error: 'server_error',
      detail: e.message,
      message: '서버 오류가 발생했습니다.'
    });
  }
}
