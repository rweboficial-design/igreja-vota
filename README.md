# Igreja Vota — Netlify App (MVP)

App Netlify para indicação e votação de cargos na igreja, com perfis **Técnico** e **Membro**, usando Google Sheets/Drive como backend e PDF final de resultados.

## Visão Geral
- Hospedagem: Netlify (SPA React + Netlify Functions)
- Dados: Google Sheets (config, ministérios, cargos, membros, indicações, votos, sessões, resultados)
- Mídia: Google Drive (pasta com fotos dos membros)
- Tempo real: polling leve (1–3s) no estado de sessão
- Relatório: PDF via serverless (`pdf-lib`)

## Estrutura
Veja a árvore no projeto.

## Variáveis de Ambiente (Netlify)
Crie nas **Site settings → Environment variables**:
- `GOOGLE_CLIENT_EMAIL` (service account)
- `GOOGLE_PRIVATE_KEY` (com \n escapado)
- `SHEETS_SPREADSHEET_ID`
- `DRIVE_MEMBERS_FOLDER_ID`
- `SESSION_POLL_MS` (ex.: `2000`)

> Crie uma Service Account no Google Cloud, ative **Google Sheets API** e **Google Drive API**, e compartilhe a planilha e a pasta do Drive com o e‑mail da service account.

## Abas da Planilha
- `config` → `key`,`value`
- `ministries` → `id`,`name`,`created_at`,`updated_at`
- `roles` → `id`,`ministry_id`,`name`,`created_at`,`updated_at`
- `members` → `id`,`name`,`photo_url`,`active`
- `sessions` → `id`,`status`,`ministry_id`,`role_id`,`stage`,`updated_at`
- `indications` → `session_id`,`role_id`,`member_id`,`nominee_id`,`at`
- `votes` → `session_id`,`role_id`,`member_id`,`candidate_id`,`at`
- `results` → `session_id`,`role_id`,`elected_id`,`ranking_json`,`at`

## Scripts
- `npm run dev` — ambiente local
- `npm run build` — build SPA
- Deploy pelo Netlify (Git ou Drag & Drop).

## Fluxo de Uso (resumo)
1. Em **Config**, salve os IDs da planilha e da pasta do Drive (ou use envs do Netlify).
2. Em **Membros**, clique **Sincronizar** (lê a pasta do Drive).
3. Em **Ministérios/Cargos**, crie/edite entradas.
4. Em **Controle da Sessão**: selecione ministério + cargo → **Indicação** (membros indicam até 3). Depois **Votação** (1 voto). Por fim, **Baixar Relatório (PDF)**.