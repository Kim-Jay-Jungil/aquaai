// api/test-notion.js - Notion 연동 테스트
import { logSubmissionToNotion } from './_lib/notion.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    // 테스트용 더미 데이터
    const testData = {
      filename: 'test-image.jpg',
      email: 'test@example.com',
      original_url: 'https://example.com/original.jpg',
      output_url: 'https://example.com/enhanced.jpg',
      status: 'enhanced',
      enhancement_level: 'auto',
      processing_time: 1500,
      notes: '테스트용 이미지 보정',
      user_tier: 'free'
    };

    console.log('🧪 Notion 테스트 시작:', testData);

    // Notion에 테스트 데이터 저장
    const notionResult = await logSubmissionToNotion(testData);

    console.log('✅ Notion 테스트 성공:', notionResult.id);

    return res.status(200).json({
      ok: true,
      message: 'Notion 연동 테스트 성공',
      notionId: notionResult.id,
      testData
    });

  } catch (error) {
    console.error('❌ Notion 테스트 실패:', error);
    
    return res.status(500).json({
      ok: false,
      error: 'Notion 연동 테스트 실패',
      details: {
        message: error.message,
        code: error.code || 'UNKNOWN',
        status: error.status
      }
    });
  }
}
