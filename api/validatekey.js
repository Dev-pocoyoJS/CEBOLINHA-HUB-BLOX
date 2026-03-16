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

      // Tenta validar com HWID real
      let data = await validateAccount(PANDA_BASE, SERVICE_ID, key, realHwid, account);

      // Sucesso direto
      if (data.Authenticated_Status === "Success") {
        return res.status(200).json(buildSuccess(data));
      }

      // Key não encontrada como ativa — tenta ativar via binding
      // Isso acontece com keys geradas pelo painel que nunca passaram pelo GetKey
      const noteLC = (data.Note || "").toLowerCase();
      if (noteLC.includes("not found") || noteLC.includes("key not found") || noteLC.includes("invalid")) {

        // Tenta vincular o HWID à key usando o endpoint de edição
        const bindRes = await fetch(`${PANDA_BASE}/keys/api/key`, {
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

        const bindData = await bindRes.json().catch(() => ({}));

        // Tenta validar novamente após vincular
        if (bindData.success || bindData.id || bindRes.ok) {
          data = await validateAccount(PANDA_BASE, SERVICE_ID, key, realHwid, account);

          if (data.Authenticated_Status === "Success") {
            return res.status(200).json(buildSuccess(data));
          }
        }

        // Última tentativa: valida sem HWID (deixa o Panda vincular)
        data = await validateAccount(PANDA_BASE, SERVICE_ID, key, null, account);
        if (data.Authenticated_Status === "Success") {
          // Agora vincula o HWID real
          await fetch(`${PANDA_BASE}/keys/api/key`, {
            method:  "PUT",
            headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
            body: JSON.stringify({ key, hwid: realHwid, status: "active" })
          }).catch(() => {});

          return res.status(200).json(buildSuccess(data));
        }
      }

      return res.status(200).json({
        valid: false,
        note:  data.Note || "Key inválida ou não encontrada"
      });
    }

    // ── RESET HWID ────────────────────────────────────────────────
    if (action === "reset-hwid") {
      if (!key) return res.status(400).json({ success: false, message: "Key não informada" });

      const pandaRes = await fetch(`${PANDA_BASE}/keys/reset-hwid`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key":    API_KEY
        },
        body: JSON.stringify({ key })
      });

      const data = await pandaRes.json();
      return res.status(200).json(data);
    }

    // ── EXECUTION TRACKING ────────────────────────────────────────
    if (action === "execution") {
      const pandaRes = await fetch(`${PANDA_BASE}/keys/api/execution`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": API_KEY }
      });
      const data = await pandaRes.json().catch(() => ({}));
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: "Ação inválida" });

  } catch (e) {
    console.error("PandaDev proxy error:", e);
    return res.status(500).json({ valid: false, note: "Erro interno do servidor" });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────

async function validateAccount(base, serviceId, key, hwid, account) {
  const body = {
    ServiceID: serviceId,
    Key:       key,
    AccountID: account || "portal"
  };
  if (hwid) body.HWID = hwid;

  const r = await fetch(`${base}/keys/validate-account`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body)
  });
  return r.json();
}

function buildSuccess(data) {
  return {
    valid:      true,
    expire_raw: data.Expire_Date || null,
    expire:     parseExpire(data.Expire_Date),
    premium:    !!data.Key_Premium,
    note:       data.Note || "Key válida"
  };
}

function parseExpire(raw) {
  if (!raw || raw === "" || raw === "0" || raw === "null") return "Lifetime";

  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) {
    let [, month, day, year, hour = "0", min = "0"] = m;
    if (year.length === 2) year = "20" + year;
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min));
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  const d2 = new Date(raw);
  if (!isNaN(d2.getTime())) return d2.toISOString();

  return raw;
}
