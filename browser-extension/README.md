# RedLine Focus Guard — Browser Extension

Extensão para Chrome/Edge que **bloqueia sites distradores automaticamente** enquanto uma sessão de foco está ativa no RedLine.

---

## Como funciona

```
App RedLine (web)
  └─ ao iniciar/pausar o foco → upsert na tabela `focus_state` (Supabase)

Extensão (background service worker)
  └─ polling a cada ~15s na tabela `focus_state`
  └─ focus ativado  → adiciona regras de bloqueio via declarativeNetRequest
  └─ focus encerrado → remove todas as regras
  └─ tentativa de acesso → redireciona para a página "Acesso Bloqueado"
```

---

## Pré-requisitos

1. Rodar a migration do Supabase:
   ```
   supabase/migrations/20260316_focus_state.sql
   ```
   Crie a tabela no seu projeto Supabase (Dashboard → SQL Editor ou via CLI).

2. Adicionar ícones PNG em `browser-extension/icons/`:
   - `icon16.png`  (16 × 16 px)
   - `icon48.png`  (48 × 48 px)
   - `icon128.png` (128 × 128 px)

---

## Instalar no Chrome / Edge (modo desenvolvedor)

1. Abra `chrome://extensions` (ou `edge://extensions`).
2. Ative **Modo do desenvolvedor**.
3. Clique em **Carregar sem pacote** e selecione a pasta `browser-extension/`.

---

## Configuração inicial

1. Clique no ícone da extensão.
2. Expanda **Configurações / Login**.
3. Preencha:
   - **Supabase URL** — `VITE_SUPABASE_URL` do seu `.env`
   - **Anon Key** — `VITE_SUPABASE_ANON_KEY` do seu `.env`
   - **E-mail / Senha** — as mesmas credenciais usadas no app
4. Clique em **Salvar e Conectar**.

---

## Gerenciar a lista de bloqueios

- Na seção **Sites Bloqueados**, insira domínios no campo de texto e pressione `Enter` ou clique `+ Add`.
  - Exemplos: `youtube.com`, `instagram.com`, `twitter.com`
  - Protocolo e caminhos são ignorados automaticamente (`https://www.youtube.com/watch?v=…` → `youtube.com`).
- Clique no **×** ao lado de um site para removê-lo.
- A lista é armazenada localmente (`chrome.storage`) e sincronizada com as regras de bloqueio em tempo real.

---

## Estrutura de arquivos

```
browser-extension/
├── manifest.json          # Manifest V3
├── background.js          # Service worker: polling + regras de bloqueio
├── popup/
│   ├── popup.html         # UI da extensão (status + lista + login)
│   └── popup.js
├── blocked/
│   ├── blocked.html       # Página exibida quando um site é bloqueado
│   └── blocked.js
└── icons/
    ├── icon16.png         # Adicione manualmente
    ├── icon48.png
    └── icon128.png
```
