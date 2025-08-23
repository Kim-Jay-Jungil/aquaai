// api/upload-direct.js
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, safeKey, publicBase, requireEnv } from './_lib/s3.js';

async function readMultipart(req) {
  const chunks = [];
  for await (const ch of req) chunks.push(ch);
  const buffer = Buffer.concat(chunks);
  
  // 간단한 multipart 파싱 (실제로는 multer 같은 라이브러리 사용 권장)
  const boundary = req.headers['content-type']?.split('boundary=')[1];
  if (!boundary) throw new Error('No multipart boundary');
  
  const parts = buffer.toString('binary').split(`--${boundary}`);
  const filePart = parts.find(part => part.includes('filename='));
  
  if (!filePart) throw new Error('No file found in request');
  
  // 파일명과 내용 추출
  const filenameMatch = filePart.match(/filename="([^"]+)"/);
  const filename = filenameMatch ? filenameMatch[1] : 'unknown';
  
  // 파일 내용 시작 위치 찾기
  const contentStart = filePart.indexOf('\r\n\r\n') + 4;
  const contentEnd = filePart.lastIndexOf('\r\n');
  const fileContent = filePart.substring(contentStart, contentEnd);
  
  return {
    filename,
    content: Buffer.from(fileContent, 'binary'),
    contentType: 'application/octet-stream' // 기본값
  };
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    const { filename, content } = await readMultipart(req);
    if (!filename || !content) {
      return res.status(400).json({ ok: false, error: 'No file provided' });
    }

    const bucket = requireEnv('S3_BUCKET');
    const client = s3Client();

    const Key = safeKey(filename);
    
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key,
      Body: content,
      ContentType: 'application/octet-stream'
    });

    await client.send(cmd);
    const publicUrl = `${publicBase()}/${Key}`;

    return res.status(200).json({ 
      ok: true, 
      key: Key, 
      publicUrl,
      message: 'File uploaded successfully'
    });
    
  } catch (e) {
    console.error('[upload-direct] error:', e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
