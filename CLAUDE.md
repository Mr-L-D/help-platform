# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

综合性互助平台（MVP 阶段）— users publish free or paid-reward tasks, others accept orders to help.

- **Admin web**: Next.js 16 App Router + React 19 + TypeScript + Tailwind CSS + Ant Design 6
- **Miniapp / H5**: uni-app (Vue 3) + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Monorepo**: Turborepo + pnpm
- **Deployment**: Vercel (admin & H5), git-integrated auto-deploy

## Critical: Next.js 16

This is **Next.js 16** — APIs, conventions, and file structure differ from earlier versions. Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`. See `apps/admin/AGENTS.md`.

## Essential Commands

```bash
# Development
pnpm dev                 # Start all apps
pnpm dev:admin           # Admin only (Next.js backend + frontend)
pnpm dev:miniapp         # Miniapp H5 only
pnpm dev:miniapp:mp      # Miniapp WeChat MP only

# Database
pnpm db:generate         # Regenerate Prisma client after schema changes
pnpm db:push             # Push schema to local PostgreSQL
pnpm db:studio           # Open Prisma Studio GUI

# Build
pnpm build:admin         # Build admin
pnpm build:miniapp:mp    # Build miniapp WeChat
pnpm build:miniapp       # Build miniapp H5

# Quality
pnpm lint                # ESLint across all workspaces
pnpm format              # Prettier format all files
pnpm format:check        # Prettier check only
```

## Architecture

### Monorepo Structure

```
apps/admin/          # Next.js 16 App Router — frontend + backend (API routes)
apps/miniapp/        # uni-app (Vue 3) — H5 + WeChat miniapp
packages/database/   # Prisma schema + shared PrismaClient singleton
packages/shared/     # Enums, types, API request/response interfaces
```

### Backend = API Routes (no separate server)

All backend logic lives in Next.js App Router API routes under `apps/admin/app/api/`. There is no Express/Fastify — the Next.js server is the entire backend.

### API Route Conventions

- Every route handler receives `NextRequest`, returns `NextResponse.json()`.
- Responses use the `ApiResponse<T>` format: `{ code: number; data: T; message: string }`.
- Paginated endpoints use `PaginatedData<T>`: `{ list, total, page, pageSize }`.
- Auth validation: each route handler checks `requireUser()` / `requireAdmin()` individually — there is no middleware-based auth guard.

### Auth System

- JWT-based using `jose` library (`apps/admin/lib/auth.ts`).
- Password hashing: scrypt with random salt, timing-safe comparison (`apps/admin/lib/password.ts`).
- Auth helpers (`apps/admin/lib/auth-helpers.ts`): `getAuthUser()`, `requireUser()`, `requireAdmin()` extract JWT from `Authorization: Bearer <token>` header.
- Admin login reads credentials from `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars (defaults: `admin` / `123456`).

### Database (Prisma)

- Single shared client defined in `packages/database/src/index.ts` — uses `globalThis` singleton pattern for dev hot-reload safety.
- `apps/admin/lib/prisma.ts` re-exports from `@help-platform/database`.
- Schema has 4 models: `User`, `Category`, `Task`, `Order` — plus matching enums.
- Enum values in Prisma schema mirror those in `packages/shared/src/enums.ts`.

### Shared Package

`@help-platform/shared` exports enums and TypeScript interfaces that both admin and miniapp consume. When adding a new enum or API type, update this package.

### Environment Variables

| Variable         | Purpose               | Default                                     |
| ---------------- | --------------------- | ------------------------------------------- |
| `DATABASE_URL`   | PostgreSQL connection | `postgresql://localhost:5432/help_platform` |
| `JWT_SECRET`     | JWT signing key       | `dev-secret` (change in prod)               |
| `ADMIN_USERNAME` | Admin login username  | `admin`                                     |
| `ADMIN_PASSWORD` | Admin login password  | `123456`                                    |
| `WECHAT_APPID`   | WeChat miniapp AppID  | (empty = mock mode)                         |
| `WECHAT_SECRET`  | WeChat miniapp Secret | (empty = mock mode)                         |

### Git Hooks

- `pre-commit`: ESLint + Prettier (via lint-staged)
- `commit-msg`: Conventional commit format validation
- `pre-push`: Block direct push to `master` branch
- `feature/*` branches are excluded from Vercel auto-deploy

### Vibe Coding Context

60-70% of code is AI-generated (Claude Code + DeepSeek v4). The `docs/` directory contains early AI-produced design docs — reference only, not authoritative. Actual implementation may differ.
