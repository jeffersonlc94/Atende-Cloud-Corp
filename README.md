# Atende Cloud Corp

Sistema de gestão self-hosted (single-tenant) com dois módulos principais:

- **Orçamentos** — emissão, listagem, duplicação e impressão de orçamentos com numeração automática, descontos por item e gerais, visibilidade Privado/Global e abas "Meus Orçamentos" / "Orçamentos Globais".
- **Gestão de Frota** — cadastro de veículos (com foto), checklists, manutenções, troca de óleo com controle por KM, documentos com anexos (visualizar/baixar/imprimir), abastecimentos, agenda de eventos, relatórios com filtros por período e dashboard com alertas.

Recursos gerais: usuários com papéis e permissões por módulo, auditoria de ações, configurações do sistema, tema claro/escuro.

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

Para atualizar uma instalação existente após novas mudanças no código:

```bash
git pull
docker compose up -d --build
```

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

- `app/(dashboard)` — telas autenticadas (sidebar + header): orçamentos, empresas, frota, usuários, auditoria, configurações e perfil.
- `app/(dashboard)/frota` — módulo de frota: dashboard, veículos, checklists, manutenções, troca de óleo, documentos, abastecimentos, agenda e relatórios.
- `app/orcamentos/[id]/imprimir` — rota de impressão A4 dedicada (fora do shell).
- `app/api/*` — Route Handlers Next.js com as regras de negócio via Prisma (inclui `app/api/frota/*` para veículos, manutenções, documentos, abastecimentos, eventos de agenda, alertas e notificações).
- `app/uploads/[filename]` — rota que serve os arquivos enviados em runtime (necessária no modo `standalone`, em que o Next só serve estáticos existentes no build).
- `prisma/schema.prisma` — modelos: `User`, `Company`, `Client`, `Quote`, `QuoteItem`, `QuoteCounter`, `Vehicle`, `VehicleDocument`, `MileageLog`, `OilChange`, `Maintenance`, `Checklist`, `ChecklistItem`, `Fuel`, `CalendarEvent`, `NotificationLog`, `AuditLog`, `SystemSettings`.
- `components/quotes/quote-print-layout.tsx` — layout de impressão compartilhado entre pré-visualização e impressão.
- `components/frota/*` — componentes do módulo de frota (cards e tabela de veículos, formulários, diálogos de visualização).

## Uploads

Fotos de veículos, logos e anexos de documentos são salvos em disco em
`public/uploads` (persistidos via volume Docker `app_uploads`) e servidos
pela rota `/uploads/[filename]`. Limite de 5 MB por arquivo.

## Limitações conhecidas

- Não há redimensionamento/otimização de imagem nos uploads.
- "Gerar PDF" usa captura client-side (html2canvas + jsPDF); para orçamentos muito longos a paginação é aproximada.
