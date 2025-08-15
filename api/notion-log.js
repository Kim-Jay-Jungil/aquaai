// api/notion-log.js
import { createUploadPage } from "./_lib/notion.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const {
    filename = "file",
    email = "",
    plan = "free",
    url = "",
    key = "",
    size = 0,
    contentType = "",
  } = req.body || {};

  const databaseId = process.env.NOTION_DB_SUBMISSIONS;
  const hasNotion = Boolean(process.env.NOTION_API_KEY && databaseId);

  if (!hasNotion) {
    // 노션 미설정 시에도 프론트를 막지 않기 위해 성공처럼 응답
    return res.json({ ok: false, skipped: true });
  }

  try {
    const out = await createUploadPage({
      databaseId,
      filename,
      email,
      plan,
      url,
      key,
      size,
      contentType,
    });
    return res.json(out);
  } catch (err) {
    console.error("notion-log error", err);
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
}