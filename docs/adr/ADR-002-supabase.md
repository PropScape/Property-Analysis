# ADR-002: Supabase (EU/Frankfurt) for Database, Auth & Storage

> **Status:** Accepted
> **Date:** 2026-05-18
> **Deciders:** Dennis Mende (Owner), AI Architect

## Context

Immoverse collects sensitive financial data (income, tax rates, property values)
from German consumers. The application needs:

1. A relational database for structured analysis data.
2. User authentication (email/password, social logins).
3. File storage (potential future: document uploads, PDF exports).
4. GDPR compliance (EU data residency).
5. Row-level security to ensure users only access their own data.

## Decision

Use **Supabase** (hosted PostgreSQL) with the **EU (Frankfurt)** region as the
backend platform. This includes Supabase Auth, Supabase Storage, and
Row-Level Security (RLS).

## Rationale

- **EU data residency:** Supabase Frankfurt region ensures all data stays in
  the EU, satisfying GDPR data residency requirements.
- **Built-in auth:** Supabase Auth supports email/password, magic links, and
  social providers (Google, Apple) out of the box.
- **Row-Level Security (RLS):** Security policies are enforced at the database
  level, not just the application level. A user can never read another user's
  analyses, even if the application has a bug.
- **PostgreSQL:** Full relational database with JSONB support, excellent for
  normalized analysis data.
- **Generous free tier:** Suitable for development and early production.
- **Client libraries:** `@supabase/supabase-js` + `@supabase/ssr` integrate
  cleanly with Next.js server-side rendering.
- Proven in the reference project (tonies-collection).

### Data Model (Normalized)

```sql
-- Users managed by Supabase Auth (auth.users)

CREATE TABLE analyses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'draft', -- draft | completed
  current_step INTEGER NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE analysis_steps (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id  UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  step_number  INTEGER NOT NULL CHECK (step_number BETWEEN 1 AND 16),
  step_data    JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (analysis_id, step_number)
);

-- RLS Policies
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own analyses"
  ON analyses FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own analysis steps"
  ON analysis_steps FOR ALL
  USING (
    analysis_id IN (
      SELECT id FROM analyses WHERE user_id = auth.uid()
    )
  );
```

## Alternatives Considered

| Alternative | Pros | Cons |
|---|---|---|
| PlanetScale (MySQL) | Serverless scaling, branching | No EU region, MySQL not Postgres, separate auth needed |
| Neon (Postgres) | Serverless, branching | No built-in auth, no storage, less mature |
| Firebase | Mature, good mobile SDKs | NoSQL (Firestore) not ideal for relational data, Google Cloud only |
| Self-hosted Postgres | Full control | Operational burden, no built-in auth/storage |

## Consequences

### Positive

- Single platform for DB, auth, and storage — reduced operational complexity.
- RLS provides defense-in-depth security.
- EU data residency out of the box.
- Future mobile apps can use the same Supabase client libraries.

### Negative

- Vendor lock-in to Supabase. Mitigated by using standard SQL (migrations
  are portable Postgres) and abstracting Supabase-specific code behind
  `src/lib/supabase/`.
- Free tier has limitations (500MB database, 1GB storage). Will need a paid
  plan for production scale.

### Risks

- Supabase service outages would affect all users. Mitigated by Supabase's
  99.9% SLA on paid plans.
- RLS policy errors could expose data. Mitigated by E2E tests that verify
  cross-user isolation.

## References

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase EU Regions](https://supabase.com/docs/guides/platform/regions)
- [GDPR Compliance](https://supabase.com/docs/guides/platform/going-into-prod#security)
