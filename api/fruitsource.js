export default async function handler(req, res) {
  try {
    const response = await fetch("https://you.whimper.xyz/sources/nox/data/fruitsource.lua", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    if (!response.ok) {
      return res.status(502).send("-- Erro ao buscar biblioteca original");
    }

    let code = await response.text();

    // Substituições APENAS nos textos visuais (strings entre aspas)
    code = code.replace(/"NoxHub"/g, '"CEBOLINHA HUB"');
    code = code.replace(/'NoxHub'/g, "'CEBOLINHA HUB'");
    code = code.replace(/\bNoxHub\b(?=\s*[,\.\);\]<])/g, "CEBOLINHA HUB");

    // Logo - substitui asset IDs da NoxHub
    code = code.replace(/rbxassetid:\/\/13940080072/g, "rbxassetid://130502669139756");
    code = code.replace(/rbxassetid:\/\/17428732487/g, "rbxassetid://130502669139756");
    code = code.replace(/rbxassetid:\/\/17428732488/g, "rbxassetid://130502669139756");

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    return res.status(200).send(code);

  } catch (err) {
    return res.status(500).send(`-- Erro interno: ${err.message}`);
  }
}
