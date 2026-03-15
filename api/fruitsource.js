const SECRET_KEY = "8186a7a7fc38c24d9a43c93637f6c0933fbdae0394b9c6ac";

async function patchCode(code) {
  code = code.replace(/"NoxHub"/g, '"CEBOLINHA HUB"');
  code = code.replace(/'NoxHub'/g, "'CEBOLINHA HUB'");
  code = code.replace(/\.Text\s*=\s*"NoxHub"/g, '.Text = "CEBOLINHA HUB"');
  code = code.replace(/Loading NoxHub/g, "Loading CEBOLINHA HUB");
  code = code.replace(/https:\/\/discord\.com\/invite\/25ms/g, "https://discord.gg/z5DhUvEx6Z");
  code = code.replace(/Security verification passed\. Loading NoxHub\.\.\./g, "CEBOLINHA HUB carregado com sucesso!");

  code = code.replace(/rbxassetid:\/\/13940080072/g, "rbxassetid://130502669139756");
  code = code.replace(/rbxassetid:\/\/17428732487/g, "rbxassetid://130502669139756");
  code = code.replace(/rbxassetid:\/\/17428732488/g, "rbxassetid://130502669139756");
  code = code.replace(/rbxassetid:\/\/14759368201/g, "rbxassetid://130502669139756");

  code = code.replace(
    /Sep1\.Text = "âŒ©<font color=\\"rgb\(255, 0, 0\)\\">âŒ©<\/font>"/g,
    'Sep1.Text = "<font color=\\"rgb(0, 255, 100)\\">◈</font>"'
  );
  code = code.replace(
    /Sep3\.Text = "<font color=\\"rgb\(255, 0, 0\)\\">âŒª<\/font>âŒª"/g,
    'Sep3.Text = "<font color=\\"rgb(0, 255, 100)\\">◈</font>"'
  );
  code = code.replace(/rgb\(255, 0, 0\)/g, "rgb(0, 255, 100)");

  code = code.replace(/_G\.Primary = Color3\.fromRGB\(100,\s*100,\s*100\)/g, "_G.Primary = Color3.fromRGB(15, 45, 20)");
  code = code.replace(/_G\.Dark = Color3\.fromRGB\(22,\s*22,\s*26\)/g, "_G.Dark = Color3.fromRGB(10, 30, 15)");
  code = code.replace(/_G\.Third = Color3\.fromRGB\(255,\s*0,\s*0\)/g, "_G.Third = Color3.fromRGB(0, 255, 100)");

  // ── SubTitle ─────────────────────────────────────────────────────────
  code = code.replace(/SubTitle = "Blox Fruits"/g, 'SubTitle = "DEV: POCOYO.JS"');

  code = code.replace(/Color3\.fromRGB\(24,\s*24,\s*26\)/g,    "Color3.fromRGB(10, 30, 15)");
  code = code.replace(/Color3\.fromRGB\(10,\s*10,\s*10\)/g,    "Color3.fromRGB(8, 22, 12)");
  code = code.replace(/Color3\.fromRGB\(30,\s*30,\s*30\)/g,    "Color3.fromRGB(12, 35, 18)");
  code = code.replace(/Color3\.fromRGB\(45,\s*45,\s*45\)/g,    "Color3.fromRGB(15, 45, 20)");
  code = code.replace(/Color3\.fromRGB\(5,\s*5,\s*5\)/g,       "Color3.fromRGB(5, 18, 8)");
  code = code.replace(/Color3\.fromRGB\(50,\s*50,\s*50\)/g,    "Color3.fromRGB(15, 45, 20)");
  code = code.replace(/Color3\.fromRGB\(255,\s*0,\s*0\)/g,     "Color3.fromRGB(0, 255, 100)");
  code = code.replace(/Color3\.fromRGB\(100,\s*100,\s*100\)/g, "Color3.fromRGB(15, 45, 20)");

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
  // Verifica chave na URL (?key=...) ou no header
  const urlKey = new URL(req.url, "https://cebolinha-hub-blox.vercel.app").searchParams.get("key");
  const headerKey = req.headers["x-cebolinha-key"];

  if (urlKey !== SECRET_KEY && headerKey !== SECRET_KEY) {
    return res.status(403).send('-- ❌ Acesso negado. Use o loader oficial do CEBOLINHA HUB.');
  }

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

    // Redireciona sub-chamadas para incluir a chave
    code = code.replace(
      /https:\/\/cebolinha-hub-blox\.vercel\.app\/bloxfruits\.lua/g,
      `https://cebolinha-hub-blox.vercel.app/bloxfruits.lua?key=${SECRET_KEY}`
    );
    code = code.replace(
      /https:\/\/cebolinha-hub-blox\.vercel\.app\/fruitsource\.lua/g,
      `https://cebolinha-hub-blox.vercel.app/fruitsource.lua?key=${SECRET_KEY}`
    );

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    return res.status(200).send(code);

  } catch (err) {
    return res.status(500).send(`-- Erro interno: ${err.message}`);
  }
}
