// api/validatekey.js
// Proxy server-side para PandaDevelopment — resolve CORS do browser
// Deploy em: cebolinha-hub-blox.vercel.app/api/validatekey

export default async function handler(req, res) {
  // CORS — permite qualquer origem (portal pode chamar)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { key, action } = req.body || {};

  if (!key) {
    return res.status(400).json({ valid: false, note: "Key não informada" });
  }

  const SERVICE_ID = "chsystem";
  const PANDA_BASE = "https://new.pandadevelopment.net/api/v1";

  try {
    // ── VALIDATE ────────────────────────────────────────────────
    if (!action || action === "validate") {
      const pandaRes = await fetch(`${PANDA_BASE}/keys/validate-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ServiceID: SERVICE_ID,
          Key:       key,
          HWID:      "portal-" + key.slice(-8),
          AccountID: "portal"
        })
      });

      const data = await pandaRes.json();

      if (data.Authenticated_Status === "Success") {
        return res.status(200).json({
          valid:   true,
          expire:  data.Expire_Date  || "Lifetime",
          premium: !!data.Key_Premium,
          note:    data.Note || "Key válida"
        });
      }

      return res.status(200).json({
        valid: false,
        note:  data.Note || "Key inválida ou não encontrada"
      });
    }

    // ── RESET HWID ──────────────────────────────────────────────
    if (action === "reset-hwid") {
      const pandaRes = await fetch(`${PANDA_BASE}/keys/reset-hwid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key })
      });

      const data = await pandaRes.json();
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: "Ação inválida" });

  } catch (e) {
    console.error("PandaDev proxy error:", e);
    return res.status(500).json({ valid: false, note: "Erro interno do servidor" });
  }
}
