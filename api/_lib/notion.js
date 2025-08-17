import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DB = process.env.NOTION_DB_ID;

export async function logSubmissionToNotion(payload) {
  if (!DB) throw new Error("NOTION_DB_ID missing");

  const {
    filename,
    email,
    original_url,
    output_url,
    status = 'uploaded',
    enhancement_level = 'auto',
    notes,
    user_tier = 'free',
    processing_time,
    image_quality
  } = payload;

  // 수중 사진 보정 서비스용 데이터베이스 구조
  const properties = {
    Name: { title: [{ text: { content: filename || "Untitled" } }] },
    Status: { 
      select: { 
        name: status // uploaded, processing, enhanced, failed
      } 
    },
    Enhancement_Level: { 
      select: { 
        name: enhancement_level // auto, light, medium, strong
      } 
    },
    User_Tier: { 
      select: { 
        name: user_tier // free, pro, business
      } 
    },
    Created_At: { date: { start: new Date().toISOString() } }
  };

  // 사용자 이메일 (로그인한 경우)
  if (email) {
    properties.User_Email = { email };
  }

  // 원본 이미지 링크
  if (original_url) {
    properties.Original_Image = {
      files: [{ name: filename || "original", external: { url: original_url } }]
    };
  }

  // 보정된 이미지 링크
  if (output_url) {
    properties.Enhanced_Image = {
      files: [{ name: `${filename}_enhanced` || "enhanced", external: { url: output_url } }]
    };
  }

  // 처리 시간 (밀리초)
  if (processing_time) {
    properties.Processing_Time = { number: processing_time };
  }

  // 이미지 품질 정보
  if (image_quality) {
    properties.Image_Quality = { rich_text: [{ text: { content: JSON.stringify(image_quality) } }] };
  }

  // 추가 노트
  if (notes) {
    properties.Notes = { rich_text: [{ text: { content: notes } }] };
  }

  // 사용량 추적 (무료 티어 제한 관리용)
  if (email) {
    properties.Usage_Date = { date: { start: new Date().toISOString() } };
  }

  return await notion.pages.create({
    parent: { database_id: DB },
    properties
  });
}

// 사용자별 월간 사용량 조회
export async function getUserMonthlyUsage(email, year, month) {
  if (!DB) throw new Error("NOTION_DB_ID missing");

  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0).toISOString();

  const response = await notion.databases.query({
    database_id: DB,
    filter: {
      and: [
        {
          property: 'User_Email',
          email: { equals: email }
        },
        {
          property: 'Created_At',
          date: {
            on_or_after: startDate
          }
        },
        {
          property: 'Created_At',
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
  if (!DB) throw new Error("NOTION_DB_ID missing");

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
          property: 'Created_At',
          date: {
            on_or_after: startDate
          }
        },
        {
          property: 'Created_At',
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
    byTier: {},
    byEnhancementLevel: {}
  };

  response.results.forEach(page => {
    const status = page.properties.Status?.select?.name || 'unknown';
    const tier = page.properties.User_Tier?.select?.name || 'unknown';
    const level = page.properties.Enhancement_Level?.select?.name || 'unknown';

    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    stats.byTier[tier] = (stats.byTier[tier] || 0) + 1;
    stats.byEnhancementLevel[level] = (stats.byEnhancementLevel[level] || 0) + 1;
  });

  return stats;
}