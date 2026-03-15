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

  // ── Cores globais ────────────────────────────────────────────────────
  // _G.Primary (cinza dos painéis) → verde escuro
  code = code.replace(/_G\.Primary = Color3\.fromRGB\(100,\s*100,\s*100\)/g,
    "_G.Primary = Color3.fromRGB(15, 45, 20)");

  // _G.Dark (fundo principal) → verde neon escuro
  code = code.replace(/_G\.Dark = Color3\.fromRGB\(22,\s*22,\s*26\)/g,
    "_G.Dark = Color3.fromRGB(10, 30, 15)");

  // _G.Third (vermelho dos botões/tab selecionada) → verde neon
  code = code.replace(/_G\.Third = Color3\.fromRGB\(255,\s*0,\s*0\)/g,
    "_G.Third = Color3.fromRGB(0, 255, 100)");

  // ── Cores hardcoded da janela principal ──────────────────────────────
  // Fundo janela
  code = code.replace(/Color3\.fromRGB\(24,\s*24,\s*26\)/g,  "Color3.fromRGB(10, 30, 15)");
  // Barras laterais / scroll
  code = code.replace(/Color3\.fromRGB\(10,\s*10,\s*10\)/g,  "Color3.fromRGB(8, 22, 12)");
  // OutlineMain
  code = code.replace(/Color3\.fromRGB\(30,\s*30,\s*30\)/g,  "Color3.fromRGB(12, 35, 18)");
  // Tab background
  code = code.replace(/Color3\.fromRGB\(45,\s*45,\s*45\)/g,  "Color3.fromRGB(15, 45, 20)");
  // Loading screen fundo
  code = code.replace(/Color3\.fromRGB\(5,\s*5,\s*5\)/g,     "Color3.fromRGB(5, 18, 8)");
  // Loading bar background
  code = code.replace(/Color3\.fromRGB\(50,\s*50,\s*50\)/g,  "Color3.fromRGB(15, 45, 20)");
  // Loading bar (vermelho → verde neon)
  code = code.replace(/Color3\.fromRGB\(255,\s*0,\s*0\)/g,   "Color3.fromRGB(0, 255, 100)");
  // Botões vermelhos
  code = code.replace(/Color3\.fromRGB\(100,\s*100,\s*100\)/g, "Color3.fromRGB(15, 45, 20)");

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
