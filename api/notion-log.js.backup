// api/_lib/notion.js
import { Client } from '@notionhq/client';

const token = process.env.NOTION_API_KEY;
const db = process.env.NOTION_DB_SUBMISSIONS;

export function notion() {
  if (!token || !db) throw new Error('Notion env missing');
  return { client: new Client({ auth: token }), dbId: db };
}