import { getPresignedPut } from "./_lib/s3.js";

function readJsonBody(req) {
  return new Promise((resolve) => {
    try {
      if (req.body && typeof req.body === "object") return resolve(req.body);
      if (typeof req.body === "string") {
        try { return resolve(JSON.parse(req.body)); } catch {}
      }
      let data = "";
      req.on("data", (c) => (data += c));
      req.on("end", () => {
        try { resolve(JSON.parse(data || "{}")); } catch { resolve({}); }
      });
    } catch { resolve({}); }
  });
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const body = await readJsonBody(req);
    const filename = body?.filename;
    const contentType = body?.contentType;

    if (!filename) return res.status(400).json({ error: "filename required" });

    const { url, key, publicUrl } = await getPresignedPut({ filename, contentType });
    return res.status(200).json({ url, key, publicUrl });
  } catch (e) {
    console.error("[presign-put] failed:", e);
    // 클라이언트에서 에러 원인을 바로 볼 수 있게 message 그대로 내려줍니다.
    return res.status(500).json({ error: `presign failed: ${e?.message || e}` });
  }
}