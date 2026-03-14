export default async function handler(req, res) {
  try {
    // Baixa a biblioteca original
    const response = await fetch("https://you.whimper.xyz/sources/nox/data/fruitsource.lua", {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!response.ok) {
      return res.status(502).send("-- Erro ao buscar biblioteca original");
    }

    let code = await response.text();

    // ── Substituições de texto ──────────────────────────────────────────
    // Nome principal
    code = code.replaceAll("NoxHub", "CEBOLINHA HUB");
    code = code.replaceAll("noxhub", "cebolinhahub");
    code = code.replaceAll("NOXHUB", "CEBOLINHA HUB");
    code = code.replaceAll("Nox Hub", "CEBOLINHA HUB");

    // Logo — troca qualquer asset da NoxHub pela logo do Cebolinha Hub
    // O ID original da logo NoxHub no loading screen
    code = code.replaceAll(
      "rbxassetid://17428732487",  // logo original NoxHub (loading)
      "rbxassetid://130502669139756"
    );
    code = code.replaceAll(
      "rbxassetid://17428732488",
      "rbxassetid://130502669139756"
    );

    // Substitui qualquer ImageLabel/logo que contenha "nox" no nome do asset
    // via regex para pegar variações
    code = code.replace(
      /rbxassetid:\/\/174287324\d+/g,
      "rbxassetid://130502669139756"
    );

    // Cor vermelha para a barra de loading (opcional - mantém o vermelho do NoxHub)
    // Se quiser mudar, altere o valor hex abaixo
    // code = code.replaceAll("Color3.fromRGB(255, 0, 0)", "Color3.fromRGB(255, 0, 0)");

    // ── Headers para o Roblox aceitar ──────────────────────────────────
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    return res.status(200).send(code);

  } catch (err) {
    return res.status(500).send(`-- Erro interno: ${err.message}`);
  }
}
