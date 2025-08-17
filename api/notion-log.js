import { logSubmissionToNotion } from "./_lib/notion.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
    const data = req.body || {};
    const page = await logSubmissionToNotion(data);
    return res.status(200).json({ ok: true, id: page.id });
  } catch (e) {
    return res.status(500).json({ error: e.message || "notion log failed" });
  }
}