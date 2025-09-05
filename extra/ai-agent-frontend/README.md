# Frontend do Agente de IA
- [Visão Geral](#visão-geral)
- [Como funciona (resumo)](#como-funciona-resumo)
- [Funcionalidades principais (macro)](#funcionalidades-principais-macro)
- [Requisitos](#requisitos)
- [Como rodar (dev rápido)](#como-rodar-dev-rápido)
- [Integração com a API](#integração-com-a-api)
- [Fluxo macro (arquitetura)](#fluxo-macro-arquitetura)
- [Dicas de uso](#dicas-de-uso)
- [Deploy (visão macro)](#deploy-visão-macro)
- [Vídeo de demonstração](#vídeo-de-demonstração)

## Visão Geral
Pensando em dar vida aos dados tratados na stack de engenharia e no painel de dados do PowerBI, desenvolvi um interface web (Next.js + TypeScript) para conversar com o agente de IA que acessa esses dados. O foco é experiência: chat fluido, voz (fala e escuta), visual limpo/escuro, animações e boas opções de export/compartilhamento.

## Como funciona (resumo)
- Eu envio uma pergunta no chat e o app chama a **API do backend (Flask)**.
- A API classifica o tipo de resposta (Genérica, Dados/SQL, Documentos) e retorna o payload adequado.
- A UI renderiza cada tipo de resposta com um componente dedicado (texto, tabela, documentos), com **animação de “digitando…”**, headers por tipo e suporte a **voz**.
- Tudo que é sessão/estado leve (conversas, preferências) fica no **localStorage**.

## Funcionalidades principais (macro)
- **Chat inteligente** com 3 tipos de retorno:  
  Genérico (texto), Dados (tabela SQL com ordenação e export), Documentos (arquivos).
- **Voz**: speech-to-text (entrada) e text-to-speech (resposta falada). Atalho: **Ctrl+M**.
- **Export** de resultados (CSV/XLSX), **compartilhamento** (PDF/Markdown) e **TL;DR** automático.
- **Onboarding**: cartões de exemplos; **loading** bonito; **tema claro/escuro/auto**.
- **UX**: envio otimista, estados claros (enviando/enviado/erro), retry rápido.

## Requisitos
- **Node 18+ (recomendado 20+)**, **npm** ou **pnpm**.
- Backend Flask rodando e acessível (CORS habilitado).  
- Chaves/URLs no `.env.local` (ver abaixo).

## Como rodar (dev rápido)

```bash
#1. Entrar na pasta:
cd extra/ai-agent-frontend

#2. Instalar deps:
npm install

#4. Rodar em dev:
npm run dev

#5. Abrir em: `http://localhost:3000`

# 6. Build/produção:
npm run build
npm start
```

## Integração com a API
- O frontend usa um cliente simples (`lib/api.ts`) que chama o backend.
- A API responde com um “tipo” (genérico/dados/documentos) e o conteúdo.  
- Para ambientes não-locais, confira **CORS** no Flask (origem do seu frontend) e **HTTPS**.

## Fluxo macro (arquitetura)
Next.js (chat + voz + export) → Flask API (classifica intent) → LLM/DB/S3
- Genérico → texto
- Dados → SQL → tabela com export
- Documentos → busca no S3 → resposta formatada

## Dicas de uso
- Atalho para voz: **Ctrl+M** (liga/desliga microfone).
- Export respeita os filtros/colunas visíveis.
- Tema/estado ficam no localStorage (persistem entre sessões).

## Deploy (visão macro)
- Qualquer host estático/Node que suporte Next.js (Vercel, AWS Amplify, ECS, etc.).
- Ative cache/CDN se quiser ganhar performance nas assets.

## Vídeo de demonstração




https://github.com/user-attachments/assets/c3eae939-ee7a-41ee-8403-c4c867713499
