# OmniAgent API

NestJS service for the OmniAgent framework: routes tasks to capabilities, generates answers via Fireworks AI, self-verifies before returning, and produces structured JSON output.

See the root `CLAUDE.md` for architecture, scope, and project rules.

## Commands

Run from the repository root:

```
pnpm dev                        # start api in watch mode
pnpm --filter api build
pnpm --filter api test
pnpm --filter api test:e2e
pnpm lint                       # Biome (workspace-wide)
pnpm format
```
