// api/_lib/notion.js
import { Client } from '@notionhq/client';

const token = process.env.NOTION_TOKEN;
const db = process.env.NOTION_DATABASE_ID;

export function notion() {
  if (!token || !db) throw new Error('Notion env missing');
  return { client: new Client({ auth: token }), dbId: db };
}