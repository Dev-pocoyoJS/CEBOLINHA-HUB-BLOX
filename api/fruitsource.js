async function patchCode(code) {
  // ── Nome ────────────────────────────────────────────────────────────
  code = code.replace(/"NoxHub"/g, '"CEBOLINHA HUB"');
  code = code.replace(/'NoxHub'/g, "'CEBOLINHA HUB'");
  code = code.replace(/\.Text\s*=\s*"NoxHub"/g, '.Text = "CEBOLINHA HUB"');

  // ── Logo ────────────────────────────────────────────────────────────
  code = code.replace(/rbxassetid:\/\/13940080072/g, "rbxassetid://130502669139756");
  code = code.replace(/rbxassetid:\/\/17428732487/g, "rbxassetid://130502669139756");
  code = code.replace(/rbxassetid:\/\/17428732488/g, "rbxassetid://130502669139756");
  code = code.replace(/rbxassetid:\/\/14759368201/g, "rbxassetid://130502669139756");

  // ── Cores → Verde Neon + Preto ──────────────────────────────────────
  // Cor primária (vermelho/laranja da NoxHub → verde neon)
  code = code.replace(/Color3\.fromRGB\(255,\s*50,\s*50\)/g,   "Color3.fromRGB(0, 255, 100)");
  code = code.replace(/Color3\.fromRGB\(255,\s*0,\s*0\)/g,     "Color3.fromRGB(0, 255, 100)");
  code = code.replace(/Color3\.fromRGB\(220,\s*50,\s*50\)/g,   "Color3.fromRGB(0, 255, 100)");
  code = code.replace(/Color3\.fromRGB\(200,\s*0,\s*0\)/g,     "Color3.fromRGB(0, 255, 100)");
  code = code.replace(/Color3\.fromRGB\(180,\s*0,\s*0\)/g,     "Color3.fromRGB(0, 255, 100)");
  code = code.replace(/Color3\.fromRGB\(239,\s*68,\s*68\)/g,   "Color3.fromRGB(0, 255, 100)");
  code = code.replace(/Color3\.fromRGB\(255,\s*68,\s*68\)/g,   "Color3.fromRGB(0, 255, 100)");
  code = code.replace(/Color3\.fromRGB\(231,\s*76,\s*60\)/g,   "Color3.fromRGB(0, 255, 100)");

  // Cor de destaque/hover (vermelho escuro → verde escuro)
  code = code.replace(/Color3\.fromRGB\(150,\s*0,\s*0\)/g,     "Color3.fromRGB(0, 180, 70)");
  code = code.replace(/Color3\.fromRGB\(120,\s*0,\s*0\)/g,     "Color3.fromRGB(0, 180, 70)");
  code = code.replace(/Color3\.fromRGB\(100,\s*0,\s*0\)/g,     "Color3.fromRGB(0, 180, 70)");

  // Background escuro (já é preto/dark, mantém)
  code = code.replace(/Color3\.fromRGB\(30,\s*30,\s*30\)/g,    "Color3.fromRGB(10, 10, 10)");
  code = code.replace(/Color3\.fromRGB\(25,\s*25,\s*25\)/g,    "Color3.fromRGB(10, 10, 10)");
  code = code.replace(/Color3\.fromRGB\(20,\s*20,\s*20\)/g,    "Color3.fromRGB(10, 10, 10)");

  // Barra de loading (vermelho → verde neon)
  code = code.replace(/Color3\.fromRGB\(255,\s*59,\s*48\)/g,   "Color3.fromRGB(0, 255, 100)");
  code = code.replace(/Color3\.fromRGB\(255,\s*45,\s*45\)/g,   "Color3.fromRGB(0, 255, 100)");

  // ── Redireciona sub-arquivos para o proxy ───────────────────────────
  code = code.replace(
    /https:\/\/you\.whimper\.xyz\/sources\/nox\/BloxFruits\.lua/g,
    "https://cebolinha-hub-blox.vercel.app/bloxfruits.lua"
  );
  code = code.replace(
    /https:\/\/you\.whimper\.xyz\/sources\/nox\/data\/fruitsource\.lua/g,
    "https://cebolinha-hub-blox.vercel.app/fruitsource.lua"
  );

  return code;
}

export default async function handler(req, res) {
  try {
    const path = req.url;
    let originUrl;

    if (path.includes("bloxfruits")) {
      originUrl = "https://you.whimper.xyz/sources/nox/BloxFruits.lua";
    } else {
      originUrl = "https://you.whimper.xyz/sources/nox/data/fruitsource.lua";
    }

    const response = await fetch(originUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    if (!response.ok) {
      return res.status(502).send(`-- Erro ao buscar: ${originUrl}`);
    }

    let code = await response.text();
    code = await patchCode(code);

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    return res.status(200).send(code);

  } catch (err) {
    return res.status(500).send(`-- Erro interno: ${err.message}`);
  }
}
