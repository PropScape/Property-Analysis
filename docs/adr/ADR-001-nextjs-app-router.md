# ADR-001: Next.js 16 with App Router

> **Status:** Accepted
> **Date:** 2026-05-18
> **Deciders:** Dennis Mende (Owner), AI Architect

## Context

PropScape is a B2C real estate investment analysis tool built as a 16-step
wizard. It needs server-side rendering for SEO (landing/marketing pages), form
handling for data entry steps, and the ability to serve as a progressive web
app. Future iOS/Android apps are planned, requiring that business logic be
decoupled from the frontend framework.

## Decision

Use **Next.js 16** (latest stable: 16.2.x) with the **App Router** and
**React Server Components** as the frontend framework. Server Actions serve as
the API layer for the MVP.

## Rationale

- **App Router** provides RSC (React Server Components) for efficient
  server-rendered pages and co-located data fetching.
- **Server Actions** act as a typed RPC layer for mutations (save analysis,
  update step data, delete analysis), eliminating the need for a separate API
  server in the MVP.
- **React Compiler** (`babel-plugin-react-compiler`) auto-memoizes components,
  reducing performance pitfalls.
- **`next/font`** for zero-layout-shift font loading (Inter).
- **`next/image`** for optimized image serving.
- Proven deployment path to **Vercel** with zero configuration.
- Consistent with the reference project (tonies-collection) stack.

### Future Mobile Strategy

When iOS/Android apps are needed, the business logic in `src/domain/` (which
has zero Next.js dependencies) will be extracted into a standalone API service.
The Next.js Server Actions will then become thin proxies to that API, or be
replaced entirely. This migration requires **zero changes** to the domain layer.

## Alternatives Considered

| Alternative | Pros | Cons |
|---|---|---|
| Remix | Nested routes, loaders/actions | Smaller ecosystem, less Vercel-native |
| SvelteKit | Excellent DX, smaller bundle | Team not proficient, smaller component ecosystem |
| Standalone API + SPA | Clean separation from day one | Over-engineering for MVP, double deployment |

## Consequences

### Positive

- Fast development velocity for wizard-style forms.
- Built-in SSR for marketing/SEO pages.
- Single deployment artifact (Vercel).
- Server Actions provide a typed API without boilerplate.

### Negative

- Server Actions couple the API to Next.js. Migration to standalone API
  required when mobile apps are built.
- React Server Components have a learning curve for the team.

### Risks

- Next.js major version upgrades can introduce breaking changes. Mitigated by
  pinning the major version and testing upgrades in isolation.

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [ADR-004: Clean Architecture](ADR-004-clean-architecture.md) — ensures
  domain logic remains portable despite framework coupling.
