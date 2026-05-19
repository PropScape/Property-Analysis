# ADR-007: Next.js 16 — `proxy.ts` replaces `middleware.ts`

**Status:** Accepted  
**Date:** 2026-05-19  
**Deciders:** Engineering  

---

## Context

Next.js 16 renamed the edge-request interception file from `middleware.ts` to
`proxy.ts`. The `middleware.ts` convention is **deprecated and will cause a
runtime error** if both files exist simultaneously.

The error message is:

```
Both middleware file "./src/middleware.ts" and proxy file "./src/proxy.ts"
are detected. Please use "./src/proxy.ts" only.
```

Reference: https://nextjs.org/docs/messages/middleware-to-proxy

---

## Decision

> **`src/proxy.ts` is the ONE AND ONLY edge-request interception file in this
> project. `src/middleware.ts` must never be created.**

All edge-request logic (session refresh, route protection, request/response
header injection) lives exclusively in `src/proxy.ts`.

---

## Consequences

### For agents and developers

| ❌ Never do this | ✅ Do this instead |
|---|---|
| Create `src/middleware.ts` | Add logic to `src/proxy.ts` |
| Create `middleware.ts` anywhere in `src/` | — |
| Reference Next.js middleware docs that show `middleware.ts` | Substitute `proxy.ts` |

### Existing implementation

`src/proxy.ts` currently handles:
1. Supabase session cookie refresh (via `updateSession`)
2. Route protection — unauthenticated → `/auth/login`
3. Auth-page redirect for logged-in users → `/`
4. `x-pathname` header injection (for Server Component layout awareness)

### For LLM agents (CRITICAL)

When implementing any feature that requires Next.js middleware (e.g. adding
headers, redirects, rewriting URLs), **search for `src/proxy.ts` first**.
Do NOT create `src/middleware.ts`. The build will fail and the runtime will
throw an unhandled rejection.

---

## References

- https://nextjs.org/docs/messages/middleware-to-proxy
- `src/proxy.ts` — the canonical implementation
- SPEC-AUTH v1.0.0 §4.5
