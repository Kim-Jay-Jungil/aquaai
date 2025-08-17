import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DB = process.env.NOTION_DB_ID;

export async function logSubmissionToNotion(payload) {
  if (!DB) throw new Error("NOTION_DB_ID missing");

  const {
    filename,
    email,
    models = [],
    watermark = true,
    consent_training = false,
    consent_gallery = false,
    original_url,
    output_url,
    notes
  } = payload;

  // 사용 중인 Submissions DB의 속성 이름과 타입에 맞춰 구성합니다.
  const properties = {
    Name: { title: [{ text: { content: filename || "Untitled" } }] },
    created_at: { date: { start: new Date().toISOString() } },
    status: { select: { name: "uploaded" } }
  };

  if (email) properties.user_email = { email };
  if (Array.isArray(models) && models.length) {
    properties.models = { multi_select: models.map((n) => ({ name: n })) };
  }
  properties.watermark = { checkbox: !!watermark };
  properties.consent_training = { checkbox: !!consent_training };
  properties.consent_gallery = { checkbox: !!consent_gallery };

  // Notion의 files 타입은 external URL 지원
  if (original_url) {
    properties.original_links = {
      files: [{ name: filename || "original", external: { url: original_url } }]
    };
  }
  if (output_url) {
    properties.output_links = {
      rich_text: [{ text: { content: output_url }, href: output_url }]
    };
  }
  if (notes) {
    properties.notes = { rich_text: [{ text: { content: notes } }] };
  }

  return await notion.pages.create({
    parent: { database_id: DB },
    properties
  });
}