// api/whoami.js
import { verifyToken, Clerk } from "@clerk/backend";

const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req, res) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "no_token" });

    // Clerk에서 발급한 JWT 검증 (JWT 템플릿: backend)
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
      // audience: "backend"  // (일반적으로 생략 가능)
    });

    // 유저 프로필 간단 조회 (이메일 등)
    const userId = payload.sub;
    const user = await clerk.users.getUser(userId);
    const email =
      user?.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || null;

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      ok: true,
      userId,
      email,
      sessionId: payload.sid || null
    });
  } catch (err) {
    console.error("[whoami] error", err);
    return res.status(401).json({ error: "invalid_token" });
  }
}