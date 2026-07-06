# OmniAgent

Production-quality AI Agent Framework built for the AMD AI Agent Hackathon.

---

## 1. Mission

Build a reliable multi-capability AI agent that routes tasks to the correct capability, generates answers using Fireworks AI, verifies its own answers before returning them, and produces structured JSON output — extensible after the hackathon.

Hackathon success is the highest priority. Avoid over-engineering.

---

## 2. Target Project State

This describes where the repo should be, not a verified audit of where it is today — check the actual repo config before assuming any of this is already in place.

- `apps/api` — Active, primary target for all hackathon work.
- `apps/web` — Reserved, out of hackathon scope. Do not build or modify.
- Stack: NestJS, TypeScript (Strict), pnpm Workspace, Fireworks AI, Zod, Pino, Docker, Biome, Jest.

---

## 3. Scope Guard

**Priority 0 (build this):** Fireworks Integration, Task Router, Capabilities, Self Verification, JSON Input/Output, Docker.

**Priority 1 (only after P0 is solid):** Logging, Error Handling, Health Check.

Everything else is out of scope. Do not add features, packages, or abstractions beyond what P0/P1 requires.

---

## 4. Commands

```
pnpm dev
pnpm build
pnpm test
pnpm lint
pnpm format

pnpm --filter api start:dev
pnpm --filter api build
pnpm --filter api test
```

---

## 5. Architecture & Layer Mapping

```
Presentation → Application → Core ← Infrastructure
```

Dependencies always point inward: Presentation depends on Application depends on Core. Infrastructure points *into* Core by implementing Core's interfaces — Core never depends on Infrastructure. Never violate this rule.

- **Presentation** — controllers/DTOs only. No business logic.
- **Application** — orchestrates use cases (routing, verification flow, retries).
- **Core** — domain types, business rules, and provider interfaces. No framework or HTTP imports (no Fireworks, no Axios, no HTTP client).
- **Infrastructure** — concrete providers (Fireworks, HTTP, config, logging) implementing Core's interfaces.

Business logic must never live inside: Controller, Module, Config, Bootstrap, or Infrastructure.

Design principles: Interface First, Dependency Injection, SOLID, Small Classes, Single Responsibility, Provider Agnostic, Readability First.

---

## 6. Folder Structure

```
apps/
  api/    # Active — the only app that exists today
  web/    # Reserved (out of scope)

packages/   # Reserved for future shared libraries (not yet created)
  core/
  shared/
  config/

docs/            # Reserved (not yet created)
infrastructure/  # Reserved (not yet created)
tests/           # Reserved (not yet created)
```

Reserved directories are intentional: they stay in `pnpm-workspace.yaml` and this map, and are created only when their first real content lands. The default Nest scaffold (`app.controller.ts`, `app.service.ts`) remains until the first real feature module replaces it.

Tooling is workspace-wide: Biome (`biome.json`) is the only linter/formatter, and every package extends `tsconfig.base.json` (strict mode).

---

## 7. Project Rules

- **Config** — Only `ConfigModule` may access `process.env`. Everywhere else, inject `ConfigService`.
- **Dependency Injection** — Never instantiate manually (e.g. `new FireworksProvider()`). Constructor injection only.
- **Logging** — Never `console.log()`. Always `LoggerService`.
- **Capabilities** — Each is independent, owns `canHandle()`, `execute()`, `validate()`. Capabilities never depend on each other.
- **Verification** — Always a separate step: Generate → Verify → Retry (if needed) → Return. Never merge generation and verification.
- **Error Handling** — Never throw raw `Error`. Use typed errors: `ProviderError`, `CapabilityError`, `WorkflowError`, `VerificationError` — defined in `apps/api/src/core/errors`.
- **Validation** — Validate every external input with Zod. Never trust incoming data.
- **Testing** — Every module must be testable. Avoid hidden dependencies. Constructor injection only.
- **Performance** — Avoid duplicate provider calls. Retry only when verification fails. Keep implementations simple.

---

## 8. Coding Rules

- **Naming** — Prefer `AgentOrchestrator`, `TaskRouter`, `PromptBuilder`, `VerificationEngine`, `ExecutionRunner`. Avoid `Helper`, `Utils`, `Manager`, `Misc`.
- **Style** — Strict TypeScript, small methods, small classes, early return, no deep nesting. Readability over cleverness.
- **Imports** — Prefer absolute imports. Avoid circular dependencies.
- **AI Must Not (CRITICAL)** — Never use `any`, `@ts-ignore`, or `@ts-nocheck`.
- **Before writing code** — Read existing code. Reuse existing abstractions. Do not duplicate logic. Do not introduce new architecture without necessity. Keep changes minimal and focused. Prefer extending existing modules. If a requirement conflicts with this file, follow this file.
- **Git** — Use Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.

---

## 9. Definition of Done

A task is complete only if it builds successfully, passes lint, passes tests (when applicable), follows the architecture in §5, has no dead code, and has no placeholder implementation.

"No dead code" includes the Nest CLI scaffold's default `app.controller.ts` / `app.service.ts` — remove or replace them once real endpoints exist; don't leave hello-world code alongside production capabilities.

---

Hackathon First. Keep the architecture clean, but never sacrifice delivery for unnecessary complexity. Build only what is required today. Design so tomorrow's features can be added without major refactoring.