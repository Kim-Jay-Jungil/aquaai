// api/enhance-image.js - 이미지 보정 및 Notion DB 저장
import { enhanceUnderwaterImage } from './_lib/image-processing.js';
import { logSubmissionToNotion } from './_lib/notion.js';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const body = await parseBody(req);
    const { imageUrl, email, filename, enhancementLevel = 'auto' } = body;

    if (!imageUrl) {
      return res.status(400).json({ ok: false, error: 'imageUrl required' });
    }

    console.log(`Starting image enhancement process for: ${filename || 'unknown'}`);

    // 이미지 보정 처리
    const startTime = Date.now();
    const enhancedImageUrl = await enhanceUnderwaterImage(imageUrl, enhancementLevel);
    const processingTime = Date.now() - startTime;

    console.log(`Image enhancement completed in ${processingTime}ms`);

    // Notion 데이터베이스에 기록
    try {
      const notionResult = await logSubmissionToNotion({
        filename: filename || 'enhanced_image',
        email: email || 'anonymous@example.com',
        original_url: imageUrl,
        output_url: enhancedImageUrl,
        status: 'enhanced',
        enhancement_level: enhancementLevel,
        processing_time: processingTime,
        notes: `Enhanced with ${enhancementLevel} level in ${processingTime}ms`,
        user_tier: 'free' // 기본값
      });

      console.log('Successfully logged to Notion:', notionResult.id);
    } catch (notionError) {
      console.error('Notion logging failed:', notionError);
      // Notion 로깅 실패해도 이미지 보정은 성공으로 처리
    }

    return res.status(200).json({
      ok: true,
      originalUrl: imageUrl,
      enhancedUrl: enhancedImageUrl,
      enhancementLevel,
      processingTime,
      notionLogged: true
    });

  } catch (e) {
    console.error('enhance error', e);
    return res.status(500).json({ ok: false, error: 'server', detail: e.message });
  }
}
