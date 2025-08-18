// api/test-notion-connection.js - Notion 연결 테스트
import { Client } from "@notionhq/client";

export default async function handler(req, res) {
  try {
    console.log('🧪 Notion 연결 테스트 시작');
    
    // 환경변수 확인
    const apiKey = process.env.NOTION_API_KEY;
    const dbId = process.env.NOTION_DB_SUBMISSIONS;
    
    console.log('🔍 환경변수 상태:', {
      hasApiKey: Boolean(apiKey),
      apiKeyLength: apiKey ? apiKey.length : 0,
      hasDbId: Boolean(dbId),
      dbIdLength: dbId ? dbId.length : 0
    });
    
    if (!apiKey) {
      return res.status(400).json({
        ok: false,
        error: 'NOTION_API_KEY가 설정되지 않았습니다'
      });
    }
    
    if (!dbId) {
      return res.status(400).json({
        ok: false,
        error: 'NOTION_DB_SUBMISSIONS가 설정되지 않았습니다'
      });
    }
    
    // Notion 클라이언트 생성
    const notion = new Client({ auth: apiKey });
    console.log('✅ Notion 클라이언트 생성 성공');
    
    // 데이터베이스 정보 조회 시도
    try {
      const database = await notion.databases.retrieve({ database_id: dbId });
      console.log('✅ 데이터베이스 연결 성공:', {
        id: database.id,
        title: database.title?.[0]?.plain_text || 'Untitled',
        properties: Object.keys(database.properties)
      });
      
      return res.status(200).json({
        ok: true,
        message: 'Notion 연결 성공',
        database: {
          id: database.id,
          title: database.title?.[0]?.plain_text || 'Untitled',
          properties: Object.keys(database.properties)
        }
      });
      
    } catch (dbError) {
      console.error('❌ 데이터베이스 연결 실패:', dbError);
      
      if (dbError.code === 'unauthorized') {
        return res.status(401).json({
          ok: false,
          error: 'Notion API 키가 유효하지 않습니다',
          details: dbError.message
        });
      }
      
      if (dbError.code === 'object_not_found') {
        return res.status(404).json({
          ok: false,
          error: '데이터베이스를 찾을 수 없습니다',
          details: dbError.message
        });
      }
      
      return res.status(500).json({
        ok: false,
        error: '데이터베이스 연결 중 오류 발생',
        details: dbError.message,
        code: dbError.code
      });
    }
    
  } catch (error) {
    console.error('❌ Notion 연결 테스트 실패:', error);
    
    return res.status(500).json({
      ok: false,
      error: 'Notion 연결 테스트 실패',
      details: error.message
    });
  }
}
