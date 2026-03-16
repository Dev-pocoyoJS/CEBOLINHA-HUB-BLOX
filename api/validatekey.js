// api/validatekey.js — Proxy PandaDevelopment para o CEBOLINHA HUB

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")    return res.status(405).json({ error: "Method not allowed" });

  const { key, action, hwid, account } = req.body || {};

  const SERVICE_ID = "chsystem";
  const API_KEY    = "7ae22f7b-0ecc-418b-bb0e-1899e9b6e461";
  const PANDA_BASE = "https://new.pandadevelopment.net/api/v1";

  try {

    // ── VALIDATE ─────────────────────────────────────────────────
    if (!action || action === "validate") {
      if (!key) return res.status(400).json({ valid: false, note: "Key não informada" });

      const realHwid = hwid || ("portal-" + key.slice(-8));

      // DEBUG: busca info da key e loga a resposta completa
      const keyInfoRes = await fetch(`${PANDA_BASE}/keys/api/key?key=${encodeURIComponent(key)}`, {
        headers: { "X-API-Key": API_KEY }
      });
      const keyInfoRaw = await keyInfoRes.text();
      console.log("GET /keys/api/key status:", keyInfoRes.status);
      console.log("GET /keys/api/key body:", keyInfoRaw);

      let keyInfo = null;
      try { keyInfo = JSON.parse(keyInfoRaw); } catch(e) {}

      // Se não achou pelo valor, tenta validar direto sem HWID (keys generated aceitam)
      if (!keyInfo || keyInfo.error || keyInfoRes.status === 404) {
        // Tenta validate-account sem HWID
        const valRes = await fetch(`${PANDA_BASE}/keys/validate-account`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ServiceID: SERVICE_ID,
            Key:       key,
            HWID:      realHwid,
            AccountID: account || "portal"
          })
        });
        const valRaw = await valRes.text();
        console.log("validate-account body:", valRaw);
        let valData = null;
        try { valData = JSON.parse(valRaw); } catch(e) {}

        if (valData && valData.Authenticated_Status === "Success") {
          return res.status(200).json({
            valid:   true,
            expire:  parseExpire(valData.Expire_Date),
            premium: !!valData.Key_Premium,
            note:    "Key válida"
          });
        }

        return res.status(200).json({
          valid: false,
          note:  valData?.Note || "Key não encontrada",
          debug: { keyInfoStatus: keyInfoRes.status, keyInfoBody: keyInfoRaw, valBody: valRaw }
        });
      }

      // Key existe — verifica se está banida/expirada
      const status = (keyInfo.status || "").toLowerCase();
      if (status === "banned" || status === "revoked" || status === "disabled") {
        return res.status(200).json({ valid: false, note: "Key banida ou revogada" });
      }
      if (keyInfo.expiresAt) {
        const exp = new Date(keyInfo.expiresAt);
        if (!isNaN(exp.getTime()) && exp < new Date()) {
          return res.status(200).json({ valid: false, note: "Key expirada" });
        }
      }

      // Ativa e vincula HWID
      await fetch(`${PANDA_BASE}/keys/api/key`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
        body: JSON.stringify({ key, hwid: realHwid, status: "active" })
      }).catch(() => {});

      return res.status(200).json({
        valid:   true,
        expire:  parseExpire(keyInfo.expiresAt),
        premium: !!keyInfo.isPremium,
        note:    "Key válida"
      });
    }

    // ── RESET HWID ────────────────────────────────────────────────
    if (action === "reset-hwid") {
      if (!key) return res.status(400).json({ success: false, message: "Key não informada" });

      await fetch(`${PANDA_BASE}/keys/api/key`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
        body: JSON.stringify({ key, hwid: "" })
      }).catch(() => {});

      await fetch(`${PANDA_BASE}/keys/reset-hwid`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
        body: JSON.stringify({ key })
      }).catch(() => {});

      return res.status(200).json({ success: true, message: "HWID resetado com sucesso" });
    }

    // ── EXECUTION TRACKING ────────────────────────────────────────
    if (action === "execution") {
      await fetch(`${PANDA_BASE}/keys/api/execution`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": API_KEY }
      }).catch(() => {});
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: "Ação inválida" });

  } catch (e) {
    console.error("PandaDev proxy error:", e);
    return res.status(500).json({ valid: false, note: "Erro interno: " + e.message });
  }
}

function parseExpire(raw) {
  if (!raw || raw === "" || raw === "0" || raw === "null" || raw === "Lifetime") return "Lifetime";
  const d1 = new Date(raw);
  if (!isNaN(d1.getTime())) return d1.toISOString();
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) {
    let [, month, day, year, hour = "0", min = "0"] = m;
    if (year.length === 2) year = "20" + year;
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min));
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return "Lifetime";
}
