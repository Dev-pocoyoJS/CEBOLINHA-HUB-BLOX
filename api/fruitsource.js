async function patchCode(code) {
  // Substitui textos visuais com segurança
  code = code.replace(/"NoxHub"/g, '"CEBOLINHA HUB"');
  code = code.replace(/'NoxHub'/g, "'CEBOLINHA HUB'");
  
  // Loading screen - texto que aparece na tela preta
  code = code.replace(/\.Text\s*=\s*"NoxHub"/g, '.Text = "CEBOLINHA HUB"');
  code = code.replace(/text\s*=\s*"NoxHub"/gi, 'text = "CEBOLINHA HUB"');
  
  // Asset IDs da logo NoxHub (loading screen)
  code = code.replace(/rbxassetid:\/\/13940080072/g, "rbxassetid://130502669139756");
  code = code.replace(/rbxassetid:\/\/17428732487/g, "rbxassetid://130502669139756");
  code = code.replace(/rbxassetid:\/\/17428732488/g, "rbxassetid://130502669139756");
  code = code.replace(/rbxassetid:\/\/14759368201/g, "rbxassetid://130502669139756");

  // Intercepta qualquer HttpGet que tente carregar BloxFruits.lua do servidor original
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
    // Detecta qual arquivo está sendo pedido
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
