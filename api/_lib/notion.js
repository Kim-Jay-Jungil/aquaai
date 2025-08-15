// api/_lib/notion.js
import { Client } from "@notionhq/client";

const notion = process.env.NOTION_API_KEY
  ? new Client({ auth: process.env.NOTION_API_KEY })
  : null;

const dbCache = new Map();

/** DB 스키마(프로퍼티 타입) 조회 & 캐시 */
export async function loadDbSchema(databaseId) {
  if (!notion || !databaseId) return null;
  if (dbCache.has(databaseId)) return dbCache.get(databaseId);
  const db = await notion.databases.retrieve({ database_id: databaseId });
  const props = db.properties || {};
  dbCache.set(databaseId, props);
  return props;
}

/** 타입 안전하게 속성 넣기 (DB에 있을 때만) */
function buildProp(schema, name, builder) {
  const def = schema?.[name];
  if (!def) return null;
  try {
    return builder(def.type);
  } catch {
    return null;
  }
}

/** 업로드 레코드 생성 */
export async function createUploadPage({
  databaseId,
  filename,
  email,
  plan,
  url,
  key,
  size,
  contentType,
}) {
  if (!notion || !databaseId) return { ok: false, skipped: true };

  const schema = await loadDbSchema(databaseId);
  if (!schema) return { ok: false, skipped: true };

  const properties = {};

  // Name (title)
  const nameProp = buildProp(schema, "Name", () => ({
    title: [{ type: "text", text: { content: filename || "Upload" } }],
  }));
  if (nameProp) properties["Name"] = nameProp;

  // user_email
  const emailProp = buildProp(schema, "user_email", (t) =>
    t === "email"
      ? { email }
      : { rich_text: [{ type: "text", text: { content: email || "" } }] }
  );
  if (emailProp) properties["user_email"] = emailProp;

  // created_at (date)
  const createdProp = buildProp(schema, "created_at", (t) =>
    t === "date"
      ? { date: { start: new Date().toISOString() } }
      : null
  );
  if (createdProp) properties["created_at"] = createdProp;

  // plan
  const planProp = buildProp(schema, "plan", (t) =>
    t === "select"
      ? { select: { name: (plan || "free").toLowerCase() } }
      : { rich_text: [{ type: "text", text: { content: plan || "" } }] }
  );
  if (planProp) properties["plan"] = planProp;

  // status
  const statusProp = buildProp(schema, "status", (t) =>
    t === "select" ? { select: { name: "uploaded" } } : null
  );
  if (statusProp) properties["status"] = statusProp;

  // original_files (files)
  const filesProp = buildProp(schema, "original_files", (t) =>
    t === "files"
      ? {
          files: [
            {
              type: "external",
              name: filename || "file",
              external: { url },
            },
          ],
        }
      : null
  );
  if (filesProp) properties["original_files"] = filesProp;

  // original_links
  const linksProp = buildProp(schema, "original_links", (t) =>
    t === "url"
      ? { url }
      : { rich_text: [{ type: "text", text: { content: url } }] }
  );
  if (linksProp) properties["original_links"] = linksProp;

  // size_bytes
  const sizeProp = buildProp(schema, "size_bytes", (t) =>
    t === "number" ? { number: Number(size || 0) } : null
  );
  if (sizeProp) properties["size_bytes"] = sizeProp;

  // content_type
  const ctProp = buildProp(schema, "content_type", (t) =>
    t === "select"
      ? { select: { name: contentType || "" } }
      : { rich_text: [{ type: "text", text: { content: contentType || "" } }] }
  );
  if (ctProp) properties["content_type"] = ctProp;

  // s3_key
  const keyProp = buildProp(schema, "s3_key", () => ({
    rich_text: [{ type: "text", text: { content: key || "" } }],
  }));
  if (keyProp) properties["s3_key"] = keyProp;

  const page = await notion.pages.create({
    parent: { database_id: databaseId },
    properties,
  });

  return { ok: true, id: page.id };
}