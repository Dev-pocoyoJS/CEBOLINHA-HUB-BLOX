# CEBOLINHA HUB - Proxy

Servidor que serve a biblioteca modificada com o nome CEBOLINHA HUB.

## Como subir no Vercel

1. Crie uma conta em https://vercel.com (pode entrar com GitHub)
2. No GitHub, crie um repositório novo (ex: `cebolinha-hub-proxy`)
3. Suba todos os arquivos desta pasta para o repositório
4. No Vercel, clique em **Add New Project** → importe o repositório
5. Clique em **Deploy** — pronto!

## URL para usar no script

Após o deploy, sua URL será algo como:
```
https://cebolinha-hub-proxy.vercel.app
```

No seu script, troque a linha do loadstring por:
```lua
local Update = (loadstring(game:HttpGet("https://SEU-PROJETO.vercel.app/fruitsource.lua")))()
```

## O que este proxy faz

- Baixa o `fruitsource.lua` original da NoxHub
- Substitui todos os textos "NoxHub" por "CEBOLINHA HUB"
- Substitui a logo pela sua (rbxassetid://130502669139756)
- Serve o arquivo modificado para o seu script
