# Atende Cloud Corp

Sistema de gestão self-hosted (single-tenant), Fase 1: módulo de **Orçamentos**.
O módulo de **Gestão de Frota** aparece no menu como "em breve" e será implementado em uma fase futura.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · shadcn/ui ·
PostgreSQL 17 · Prisma ORM · Auth.js (NextAuth v5) · React Hook Form · Zod ·
TanStack Query · Recharts · Docker / Docker Compose.

## Subindo com Docker (produção)

```bash
cp .env.example .env
# edite .env e defina POSTGRES_PASSWORD e NEXTAUTH_SECRET (gere com: openssl rand -base64 32)

docker compose up -d --build
```

A aplicação:
1. Sobe o PostgreSQL 17 com um volume nomeado (`postgres_data`).
2. Aguarda o banco ficar saudável (healthcheck).
3. Aplica as migrations do Prisma (`prisma migrate deploy`).
4. Executa o seed inicial (cria o usuário administrador e uma empresa de exemplo).
5. Inicia o Next.js na porta `3000` (configurável via `APP_PORT`).

Login padrão criado pelo seed (definido em `.env`):
- **E-mail:** `SEED_ADMIN_EMAIL` (padrão `admin@atende.local`)
- **Senha:** `SEED_ADMIN_PASSWORD` (padrão `admin123`)

> Altere a senha padrão em produção.

## Desenvolvimento local (sem Docker)

```bash
npm install
cp .env.example .env
# aponte DATABASE_URL para um PostgreSQL local

npx prisma migrate dev
npx tsx prisma/seed.ts
npm run dev
```

## Estrutura principal

- `app/(dashboard)` — telas autenticadas (sidebar + header): orçamentos, empresas, frota (placeholder).
- `app/orcamentos/[id]/imprimir` — rota de impressão A4 dedicada (fora do shell).
- `app/api/*` — Route Handlers Next.js com as regras de negócio via Prisma.
- `prisma/schema.prisma` — modelos: `User`, `Company`, `Client`, `Quote`, `QuoteItem`, `QuoteCounter`.
- `components/quotes/quote-print-layout.tsx` — layout de impressão compartilhado entre pré-visualização e impressão.

## Limitações conhecidas (Fase 1)

- Upload de logo é salvo em disco (`public/uploads`, persistido via volume Docker `app_uploads`); não há redimensionamento/otimização de imagem.
- "Gerar PDF" usa captura client-side (html2canvas + jsPDF); para orçamentos muito longos a paginação é aproximada.
- Módulo de Gestão de Frota não implementado (fora do escopo desta fase).
