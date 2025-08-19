// api/notion-simple-test.js - 가장 기본적인 Notion 테스트
export default async function handler(req, res) {
  try {
    console.log('🧪 Notion 간단 테스트 시작');
    
    // 1. 환경변수 상태 확인
    const envStatus = {
      NOTION_API_KEY: {
        exists: Boolean(process.env.NOTION_API_KEY),
        length: process.env.NOTION_API_KEY ? process.env.NOTION_API_KEY.length : 0,
        startsWith: process.env.NOTION_API_KEY ? process.env.NOTION_API_KEY.substring(0, 10) + '...' : 'N/A'
      },
      NOTION_DB_SUBMISSIONS: {
        exists: Boolean(process.env.NOTION_DB_SUBMISSIONS),
        value: process.env.NOTION_DB_SUBMISSIONS || 'N/A',
        length: process.env.NOTION_DB_SUBMISSIONS ? process.env.NOTION_DB_SUBMISSIONS.length : 0
      }
    };
    
    console.log('🔍 환경변수 상태:', envStatus);
    
    // 2. Notion 패키지 로드 테스트
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
    
    // 3. API 키 유효성 테스트 (간단한 사용자 정보 조회)
    try {
      console.log('🔍 API 키 유효성 테스트 시작');
      const user = await notionClient.users.me();
      console.log('✅ API 키 유효성 확인 성공:', {
        userId: user.id,
        name: user.name,
        type: user.type
      });
    } catch (userError) {
      console.error('❌ API 키 유효성 테스트 실패:', userError);
      return res.status(401).json({
        ok: false,
        error: 'Notion API 키가 유효하지 않습니다',
        details: userError.message,
        code: userError.code
      });
    }
    
    // 4. 데이터베이스 접근 테스트
    try {
      console.log('🔍 데이터베이스 접근 테스트 시작');
      const database = await notionClient.databases.retrieve({ 
        database_id: process.env.NOTION_DB_SUBMISSIONS 
      });
      console.log('✅ 데이터베이스 접근 성공:', {
        id: database.id,
        title: database.title?.[0]?.plain_text || 'Untitled',
        properties: Object.keys(database.properties || {})
      });
      
      return res.status(200).json({
        ok: true,
        message: 'Notion 간단 테스트 성공',
        user: {
          id: user.id,
          name: user.name
        },
        database: {
          id: database.id,
          title: database.title?.[0]?.plain_text || 'Untitled',
          properties: Object.keys(database.properties || {})
        }
      });
      
    } catch (dbError) {
      console.error('❌ 데이터베이스 접근 실패:', dbError);
      
      return res.status(500).json({
        ok: false,
        error: '데이터베이스 접근 실패',
        details: dbError.message,
        code: dbError.code,
        envStatus
      });
    }
    
  } catch (error) {
    console.error('❌ Notion 간단 테스트 실패:', error);
    
    return res.status(500).json({
      ok: false,
      error: 'Notion 간단 테스트 실패',
      details: error.message
    });
  }
}
