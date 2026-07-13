# OmniAgent Web

Demo frontend for the OmniAgent API — Next.js 15 (App Router), TypeScript, Tailwind CSS 4, Framer Motion, Lucide.

## Pages

- `/` — landing page with feature grid and architecture diagram
- `/playground` — send a single task to the agent and inspect the verified answer
- `/batch` — upload a `tasks.json` (`[{ "task_id", "prompt" }]`), run it, download `results.json`
- `/status` — live health dashboard, polled every 15 seconds

## Configuration

Copy `.env.example` to `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

The NestJS API does not enable CORS, so the browser only talks to same-origin
`/api/*` routes; `next.config.ts` rewrites them to `NEXT_PUBLIC_API_URL`
server-side. No URL is hardcoded and the backend is consumed as-is.

## Commands

```
pnpm --filter web dev     # http://localhost:3001
pnpm --filter web build
pnpm --filter web start
```
