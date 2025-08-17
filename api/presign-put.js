import { getPresignedPut } from "./_lib/s3.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
    const { filename, contentType } = req.body || {};
    if (!filename) return res.status(400).json({ error: "filename required" });

    const { url, key, publicUrl } = await getPresignedPut({ filename, contentType });
    return res.status(200).json({ url, key, publicUrl });
  } catch (e) {
    return res.status(500).json({ error: e.message || "presign failed" });
  }
}