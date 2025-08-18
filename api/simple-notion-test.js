// api/simple-notion-test.js - 간단한 Notion 연결 테스트
export default async function handler(req, res) {
  try {
    console.log('🧪 간단한 Notion 테스트 시작');
    
    // 1. 환경변수 존재 여부만 확인
    const envCheck = {
      NOTION_API_KEY: Boolean(process.env.NOTION_API_KEY),
      NOTION_DB_SUBMISSIONS: Boolean(process.env.NOTION_DB_SUBMISSIONS)
    };
    
    console.log('🔍 환경변수 상태:', envCheck);
    
    if (!envCheck.NOTION_API_KEY || !envCheck.NOTION_DB_SUBMISSIONS) {
      return res.status(400).json({
        ok: false,
        error: '환경변수 누락',
        details: envCheck
      });
    }
    
    // 2. Notion 패키지 로드 시도
    let notionClient;
    try {
      const { Client } = await import('@notionhq/client');
      notionClient = new Client({ auth: process.env.NOTION_API_KEY });
      console.log('✅ Notion 클라이언트 생성 성공');
    } catch (importError) {
      console.error('❌ Notion 패키지 로드 실패:', importError);
      return res.status(500).json({
        ok: false,
        error: 'Notion 패키지 로드 실패',
        details: importError.message
      });
    }
    
    // 3. 간단한 API 호출 테스트 (데이터베이스 정보 조회)
    try {
      const database = await notionClient.databases.retrieve({ 
        database_id: process.env.NOTION_DB_SUBMISSIONS 
      });
      
      console.log('✅ 데이터베이스 연결 성공');
      
      return res.status(200).json({
        ok: true,
        message: 'Notion 연결 성공',
        database: {
          id: database.id,
          title: database.title?.[0]?.plain_text || 'Untitled',
          properties: Object.keys(database.properties || {})
        }
      });
      
    } catch (apiError) {
      console.error('❌ Notion API 호출 실패:', apiError);
      
      const errorResponse = {
        ok: false,
        error: 'Notion API 호출 실패',
        details: apiError.message,
        code: apiError.code || 'UNKNOWN'
      };
      
      // 구체적인 오류 코드별 메시지
      if (apiError.code === 'unauthorized') {
        errorResponse.error = 'API 키가 유효하지 않습니다';
      } else if (apiError.code === 'object_not_found') {
        errorResponse.error = '데이터베이스를 찾을 수 없습니다';
      } else if (apiError.code === 'rate_limited') {
        errorResponse.error = 'API 호출 한도 초과';
      }
      
      return res.status(500).json(errorResponse);
    }
    
  } catch (error) {
    console.error('❌ 예상치 못한 오류:', error);
    
    return res.status(500).json({
      ok: false,
      error: '예상치 못한 오류',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
