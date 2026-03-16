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

      // Passo 1: Busca a key no painel para ver o status atual
      const keyInfoRes = await fetch(`${PANDA_BASE}/keys/api/key?key=${encodeURIComponent(key)}`, {
        method:  "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key":    API_KEY
        }
      });

      const keyInfo = await keyInfoRes.json().catch(() => null);

      // Key não existe no painel
      if (!keyInfo || keyInfo.error || (!keyInfo.id && !keyInfo.value)) {
        return res.status(200).json({ valid: false, note: "Key não encontrada" });
      }

      // Key existe — verifica status
      const status = (keyInfo.status || "").toLowerCase();

      // Se estiver banida/revogada
      if (status === "banned" || status === "revoked" || status === "disabled") {
        return res.status(200).json({ valid: false, note: "Key banida ou revogada" });
      }

      // Se expirada
      if (keyInfo.expiresAt) {
        const exp = new Date(keyInfo.expiresAt);
        if (!isNaN(exp.getTime()) && exp < new Date()) {
          return res.status(200).json({ valid: false, note: "Key expirada" });
        }
      }

      // Passo 2: Ativa a key e vincula o HWID (funciona tanto para "generated" quanto "active")
      const activateRes = await fetch(`${PANDA_BASE}/keys/api/key`, {
        method:  "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key":    API_KEY
        },
        body: JSON.stringify({
          key:    key,
          hwid:   realHwid,
          status: "active"
        })
      });

      await activateRes.json().catch(() => {});

      // Passo 3: Valida normalmente com o HWID
      const validateRes = await fetch(`${PANDA_BASE}/keys/validate-account`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ServiceID: SERVICE_ID,
          Key:       key,
          HWID:      realHwid,
          AccountID: account || "portal"
        })
      });

      const data = await validateRes.json();

      if (data.Authenticated_Status === "Success") {
        return res.status(200).json({
          valid:      true,
          expire_raw: keyInfo.expiresAt || null,
          expire:     parseExpire(keyInfo.expiresAt),
          premium:    !!keyInfo.isPremium,
          note:       "Key válida"
        });
      }

      // Se ainda falhou, retorna válido com base no keyInfo
      // (key existe, não está banida, não expirou)
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

      // Limpa o HWID via PUT
      const resetRes = await fetch(`${PANDA_BASE}/keys/api/key`, {
        method:  "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key":    API_KEY
        },
        body: JSON.stringify({ key, hwid: "" })
      });

      const resetData = await resetRes.json().catch(() => ({}));

      // Tenta também o endpoint nativo de reset
      const nativeRes = await fetch(`${PANDA_BASE}/keys/reset-hwid`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key":    API_KEY
        },
        body: JSON.stringify({ key })
      });
      const nativeData = await nativeRes.json().catch(() => ({}));

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
    return res.status(500).json({ valid: false, note: "Erro interno do servidor" });
  }
}

function parseExpire(raw) {
  if (!raw || raw === "" || raw === "0" || raw === "null" || raw === "Lifetime") return "Lifetime";

  // ISO string direto (ex: "2026-03-22T00:00:00.000Z")
  const d1 = new Date(raw);
  if (!isNaN(d1.getTime())) return d1.toISOString();

  // Formato PandaDev "MM/DD/YY HH:MM"
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) {
    let [, month, day, year, hour = "0", min = "0"] = m;
    if (year.length === 2) year = "20" + year;
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min));
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  return "Lifetime";
}
