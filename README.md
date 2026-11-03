# PostScript Medical Annotation App

SvelteKit (Svelte 5, TypeScript) on Netlify, with Supabase (eu-west-2) for auth and data. The migration to this stack is in progress; see [docs/migration-execution-plan.md](docs/migration-execution-plan.md).

## Requirements

- Node.js 22.17 or later
- Docker (for the local Supabase stack)

## Setup

```bash
npm install
npx supabase start      # local Postgres, Auth and Mailpit (http://127.0.0.1:54324)
npx supabase db reset   # apply migrations and seed the catalogue + test users
```

## Development

```bash
npm run dev             # http://localhost:5173
```

## Checks

```bash
npm run lint            # Prettier + ESLint
npm run check           # svelte-check (types)
npm run test:unit -- --run
npm run build
npx playwright test     # E2E against `vite preview`
```
