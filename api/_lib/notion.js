import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DB = process.env.NOTION_DB_SUBMISSIONS;

// 환경변수 상태 로깅 (함수 호출 시에만 실행)
function logNotionStatus() {
  console.log('🔧 Notion 라이브러리 상태:', {
    hasApiKey: Boolean(process.env.NOTION_API_KEY),
    apiKeyLength: process.env.NOTION_API_KEY ? process.env.NOTION_API_KEY.length : 0,
    hasDB: Boolean(DB),
    dbLength: DB ? DB.length : 0
  });
}

export async function logSubmissionToNotion(payload) {
  // Notion 상태 로깅
  logNotionStatus();
  
  console.log('🔍 logSubmissionToNotion 시작:', { 
    hasDB: Boolean(DB), 
    dbLength: DB ? DB.length : 0,
    payloadKeys: Object.keys(payload)
  });
  
  if (!DB) {
    console.error('❌ NOTION_DB_SUBMISSIONS missing');
    throw new Error("NOTION_DB_SUBMISSIONS missing");
  }

  const {
    filename,
    email,
    original_url,
    output_url,
    status = 'Pending',
    notes,
    processing_time,
    file_size,
    ip_address
  } = payload;

  // 새로운 데이터베이스 구조에 맞는 속성들
  const properties = {
    Title: { title: [{ text: { content: filename || "Untitled" } }] },
    Status: { 
      select: { 
        name: status // Pending, Processing, Completed, Failed
      } 
    },
    "Upload Time": { date: { start: new Date().toISOString() } }
  };

  // 사용자 이메일
  if (email) {
    properties["User Email"] = { email };
  }

  // 원본 이미지 링크
  if (original_url) {
    properties["Original Image"] = {
      files: [{ name: filename || "original", external: { url: original_url } }]
    };
  }

  // 보정된 이미지 링크
  if (output_url) {
    properties["Enhanced Image"] = {
      files: [{ name: `${filename}_enhanced` || "enhanced", external: { url: output_url } }]
    };
  }

  // 파일 크기 (MB)
  if (file_size) {
    properties["File Size"] = { number: file_size };
  }

  // 처리 시간 (초)
  if (processing_time) {
    properties["Processing Time"] = { number: processing_time / 1000 }; // 밀리초를 초로 변환
  }

  // IP 주소
  if (ip_address) {
    properties["IP Address"] = { rich_text: [{ text: { content: ip_address } }] };
  }

  // 추가 노트
  if (notes) {
    properties.Notes = { rich_text: [{ text: { content: notes } }] };
  }

  // 기본값 설정
  properties["Customer Satisfaction"] = { select: { name: "Neutral" } };
  properties["Follow-up Required"] = { checkbox: false };

  console.log('📝 Notion에 전송할 속성들:', properties);

  try {
    const result = await notion.pages.create({
      parent: { database_id: DB },
      properties
    });
    
    console.log('✅ Notion 페이지 생성 성공:', result.id);
    return result;
  } catch (error) {
    console.error('❌ Notion 페이지 생성 실패:', error);
    throw error;
  }
}

// 사용자별 월간 사용량 조회
export async function getUserMonthlyUsage(email, year, month) {
  if (!DB) throw new Error("NOTION_DB_SUBMISSIONS missing");

  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0).toISOString();

  const response = await notion.databases.query({
    database_id: DB,
    filter: {
      and: [
        {
          property: 'User Email',
          email: { equals: email }
        },
        {
          property: 'Upload Time',
          date: {
            on_or_after: startDate
          }
        },
        {
          property: 'Upload Time',
          date: {
            on_or_before: endDate
          }
        }
      ]
    }
  });

  return response.results.length;
}

// 사용자 티어별 제한 확인
export async function checkUserLimit(email, userTier = 'free') {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const monthlyUsage = await getUserMonthlyUsage(email, currentYear, currentMonth);
  
  const limits = {
    free: 5,      // 무료 티어: 월 5장
    pro: 100,     // 프로 티어: 월 100장
    business: 1000 // 비즈니스 티어: 월 1000장
  };

  return {
    currentUsage: monthlyUsage,
    limit: limits[userTier] || limits.free,
    canProcess: monthlyUsage < (limits[userTier] || limits.free)
  };
}

// 통계 데이터 조회
export async function getServiceStats() {
  if (!DB) throw new Error("NOTION_DB_SUBMISSIONS missing");

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const startDate = new Date(currentYear, currentMonth - 1, 1).toISOString();
  const endDate = new Date(currentYear, currentMonth, 0).toISOString();

  const response = await notion.databases.query({
    database_id: DB,
    filter: {
      and: [
        {
          property: 'Upload Time',
          date: {
            on_or_after: startDate
          }
        },
        {
          property: 'Upload Time',
          date: {
            on_or_before: endDate
          }
        }
      ]
    }
  });

  const stats = {
    totalProcessed: response.results.length,
    byStatus: {},
    bySatisfaction: {}
  };

  response.results.forEach(page => {
    const status = page.properties.Status?.select?.name || 'unknown';
    const satisfaction = page.properties["Customer Satisfaction"]?.select?.name || 'unknown';

    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    stats.bySatisfaction[satisfaction] = (stats.bySatisfaction[satisfaction] || 0) + 1;
  });

  return stats;
}