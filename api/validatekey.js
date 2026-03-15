// api/validatekey.js
// Proxy server-side para PandaDevelopment — resolve CORS do browser

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")    return res.status(405).json({ error: "Method not allowed" });

  const { key, action } = req.body || {};
  if (!key) return res.status(400).json({ valid: false, note: "Key não informada" });

  const SERVICE_ID = "chsystem";
  const API_KEY    = "7ae22f7b-0ecc-418b-bb0e-1899e9b6e461";
  const PANDA_BASE = "https://new.pandadevelopment.net/api/v1";

  try {

    // VALIDATE
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
          valid:      true,
          expire_raw: data.Expire_Date || null,
          expire:     parseExpire(data.Expire_Date),
          premium:    !!data.Key_Premium,
          note:       data.Note || "Key válida"
        });
      }

      return res.status(200).json({
        valid: false,
        note:  data.Note || "Key inválida ou não encontrada"
      });
    }

    // RESET HWID
    if (action === "reset-hwid") {
      const pandaRes = await fetch(`${PANDA_BASE}/keys/reset-hwid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key":    API_KEY
        },
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

// Converte o formato de data do Panda para ISO
// Panda retorna: "MM/DD/YY HH:MM", "MM/DD/YYYY", null ou ""
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

  return raw; // devolve raw se não conseguir parsear
}
