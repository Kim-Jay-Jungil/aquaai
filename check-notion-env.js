// check-notion-env.js - Notion 환경변수 상태 확인
export default async function handler(req, res) {
  try {
    const envStatus = {
      NOTION_TOKEN: {
        exists: Boolean(process.env.NOTION_TOKEN),
        length: process.env.NOTION_TOKEN ? process.env.NOTION_TOKEN.length : 0,
        startsWith: process.env.NOTION_TOKEN ? process.env.NOTION_TOKEN.substring(0, 10) + '...' : 'N/A'
      },
      NOTION_DB_ID: {
        exists: Boolean(process.env.NOTION_DB_ID),
        value: process.env.NOTION_DB_ID || 'N/A',
        length: process.env.NOTION_DB_ID ? process.env.NOTION_DB_ID.length : 0
      },
      NOTION_WORKSPACE_ID: {
        exists: Boolean(process.env.NOTION_WORKSPACE_ID),
        value: process.env.NOTION_WORKSPACE_ID || 'N/A'
      }
    };

    console.log('🔍 Notion 환경변수 상태:', envStatus);

    // 필수 환경변수 검증
    const missingVars = [];
    if (!process.env.NOTION_TOKEN) missingVars.push('NOTION_TOKEN');
    if (!process.env.NOTION_DB_ID) missingVars.push('NOTION_DB_ID');

    if (missingVars.length > 0) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required Notion environment variables',
        missing: missingVars,
        envStatus
      });
    }

    return res.status(200).json({
      ok: true,
      message: 'All required Notion environment variables are set',
      envStatus
    });

  } catch (error) {
    console.error('❌ 환경변수 확인 중 오류:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to check environment variables',
      details: error.message
    });
  }
}
