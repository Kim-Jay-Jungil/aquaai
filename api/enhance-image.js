// api/enhance-image.js
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

    // 이미지 보정 처리
    const enhancedImageUrl = await enhanceUnderwaterImage(imageUrl, enhancementLevel);

    // Notion 데이터베이스에 기록
    try {
      await logSubmissionToNotion({
        filename: filename || 'enhanced_image',
        email,
        original_url: imageUrl,
        output_url: enhancedImageUrl,
        status: 'enhanced',
        enhancement_level: enhancementLevel,
        notes: `Enhanced with ${enhancementLevel} level`
      });
    } catch (notionError) {
      console.error('Notion logging failed:', notionError);
      // Notion 로깅 실패해도 이미지 보정은 성공으로 처리
    }

    return res.status(200).json({
      ok: true,
      originalUrl: imageUrl,
      enhancedUrl: enhancedImageUrl,
      enhancementLevel
    });

  } catch (e) {
    console.error('enhance error', e);
    return res.status(500).json({ ok: false, error: 'server', detail: e.message });
  }
}
