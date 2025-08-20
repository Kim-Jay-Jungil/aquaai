// api/test-notion.js - Notion API 연결 테스트
import { logSubmissionToNotion } from './_lib/notion.js';

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      allowedMethods: ['POST']
    });
  }

  try {
    console.log('Testing Notion API connection...');

    // 환경 변수 확인
    const notionToken = process.env.NOTION_TOKEN;
    const notionDbId = process.env.NOTION_DB_ID;

    if (!notionToken) {
      return res.status(500).json({
        success: false,
        error: 'NOTION_TOKEN environment variable is not set'
      });
    }

    if (!notionDbId) {
      return res.status(500).json({
        success: false,
        error: 'NOTION_DB_ID environment variable is not set'
      });
    }

    console.log('Environment variables found:', {
      hasToken: !!notionToken,
      hasDbId: !!notionDbId,
      tokenLength: notionToken ? notionToken.length : 0,
      dbIdLength: notionDbId ? notionDbId.length : 0
    });

    // 테스트 데이터로 Notion에 기록 시도
    const testData = {
      filename: 'test-notion-connection.jpg',
      email: 'test@example.com',
      original_url: 'https://example.com/test-image.jpg',
      output_url: 'https://example.com/test-enhanced.jpg',
      status: 'test',
      enhancement_level: 'auto',
      notes: 'Notion API 연결 테스트',
      user_tier: 'free',
      processing_time: 1000
    };

    console.log('Attempting to log test data to Notion...');
    
    const notionResult = await logSubmissionToNotion(testData);
    
    console.log('Notion API test successful:', notionResult.id);

    return res.status(200).json({
      success: true,
      message: 'Notion API connection test successful',
      notionPageId: notionResult.id,
      testData,
      environment: {
        hasToken: !!notionToken,
        hasDbId: !!notionDbId
      }
    });

  } catch (error) {
    console.error('Notion API test failed:', error);
    
    // 구체적인 오류 타입별 메시지
    let errorMessage = error.message;
    let errorType = 'unknown';
    
    if (error.message.includes('Unauthorized')) {
      errorMessage = 'Notion API 토큰이 유효하지 않습니다. 토큰을 확인하세요.';
      errorType = 'unauthorized';
    } else if (error.message.includes('Not Found')) {
      errorMessage = 'Notion 데이터베이스를 찾을 수 없습니다. 데이터베이스 ID를 확인하세요.';
      errorType = 'not_found';
    } else if (error.message.includes('Forbidden')) {
      errorMessage = 'Notion 데이터베이스에 접근 권한이 없습니다. Integration을 데이터베이스에 연결하세요.';
      errorType = 'forbidden';
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
      errorType,
      originalError: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
