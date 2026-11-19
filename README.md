# Estilo Vox · editor

Ferramenta que transforma **roteiro marcado + voz + imagens** em shorts verticais (1080×1920, 24 fps) no estilo Vox, com a identidade do @alezudoo.

## Estrutura

```
D:\Estilo-Vox\
├── editor\                  ← este repositório (+ arquivo .env com a GEMINI_API_KEY, fora do GitHub)
├── biblioteca\
│   ├── texturas\            ← texturas do Texturelabs (não vão para o GitHub: licença proíbe repassar)
│   └── objetos\             ← objetos recortados gerados com npm run objeto
└── videos\
    └── 2026-11-25-7a1\      ← uma pasta por vídeo (AAAA-MM-DD-assunto)
        ├── roteiro.md       ← roteiro com marcações (ver claude/vocabulario-marcacoes.md no Projeto)
        ├── audio.wav        ← sua narração (também aceita .mp3/.m4a)
        ├── imagens\         ← fotos e documentos citados no roteiro
        │   └── recortes\    ← pessoas recortadas (npm run recortar)
        ├── plano.json       ← gerado automaticamente
        └── render\          ← MP4 final e quadros de conferência
```

## Primeira instalação (Windows, uma vez só)

No PowerShell:

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install Python.Python.3.12
# feche e abra o PowerShell de novo
cd D:\Estilo-Vox\editor
npm install
pip install "rembg[cpu]"
```

## Uso do dia a dia

```powershell
cd D:\Estilo-Vox\editor
npm run painel
```

Abre o painel no navegador (http://localhost:3210). Ele lê `D:\Estilo-Vox\videos`, confere cada roteiro e mostra a prévia.
Salvou o roteiro ou trocou uma imagem? O painel atualiza sozinho.

| Tecla | Ação |
|---|---|
| ← / → | um quadro |
| Shift + ← / → | um segundo |
| Espaço | tocar / pausar |
| Z | liga/desliga a zona segura |

Render final:

```powershell
npm run render -- ..\videos\2026-11-25-7a1              # MP4 final em render\
npm run render -- ..\videos\2026-11-25-7a1 --rascunho   # metade da resolução, rápido
npm run render -- ..\videos\2026-11-25-7a1 --quadros 0,120,480   # só PNGs desses quadros
npm run plano  -- ..\videos\2026-11-25-7a1              # só confere o roteiro no terminal
```

O render final se recusa a rodar se o semáforo tiver erros.

Imagens:

```powershell
npm run objeto -- bola "bola de futebol de couro antiga"   # gera objeto recortado na biblioteca (Nano Banana)
npm run objeto -- trofeu "taça prateada" --variantes 3      # 3 opções para escolher (trofeu-1, -2, -3)
npm run recortar -- 2026-11-25-7a1                          # recorta as fotos marcadas com | recorte
npm run preparar -- --tudo                                  # refaz as texturas de papel
```

Para testar sem o seu material, use a pasta de exemplo: `npm run painel` com `$env:VIDEOS_DIR="exemplos"` antes.

## Como funciona

- `src/plano/parser.ts` — lê o roteiro e gera o plano de cenas (tempos, etiquetas, avisos do semáforo).
- `src/Video.tsx` + `src/cenas/` — a composição Remotion: gancho, foto, documento, número, gráfico, círculo/seta, card final.
- `src/movimento.ts` — animação em degraus de 12 fps, cascata, aproximação lenta.
- `src/tema.ts` — paleta, fontes e zona segura do Reels.
- `painel/` — painel de assembly (Vite + Remotion Player).
- `scripts/` — render e conferência pelo terminal.

Enquanto o alinhamento palavra a palavra da voz não existe (fase 2), os tempos são estimados pelo texto e esticados para a duração real do `audio.wav`.

## Licenças

- Remotion: licença gratuita para pessoa física / empresas de até 3 pessoas.
- Humane (Pangram Pangram): uso pessoal e comercial gratuito; os arquivos da fonte não podem ser modificados. Licença em `src/fontes/Humane-Licenca.pdf`.
- Geist / Geist Serif / Geist Mono (Vercel): SIL Open Font License, em `src/fontes/Geist-OFL.txt`.
