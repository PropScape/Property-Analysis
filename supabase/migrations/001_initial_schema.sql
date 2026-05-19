-- ============================================================
-- Migration: 001_initial_schema
-- Description: Initial normalized schema for Property-Analysis
-- 
-- Tables:
--   - analyses      → one row per user analysis
--   - analysis_steps → one row per step per analysis
--
-- All tables have RLS enabled. Users can only access their own data.
-- See ADR-002 (Supabase) and docs/architecture.md §3.2.
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ────────────────────────────────────────────
-- ENUM: analysis_status
-- ────────────────────────────────────────────
create type public.analysis_status as enum ('draft', 'completed');

-- ────────────────────────────────────────────
-- TABLE: analyses
-- ────────────────────────────────────────────
create table public.analyses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  status       public.analysis_status not null default 'draft',
  current_step smallint not null default 1 check (current_step between 1 and 16),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.analyses is
  'One row per user investment analysis. Stores top-level metadata only.';
comment on column public.analyses.current_step is
  'The wizard step the user was last on (1–16).';

-- Auto-update updated_at on every row change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger analyses_updated_at
  before update on public.analyses
  for each row execute function public.set_updated_at();

-- Index for fast user-scoped queries (project overview page)
create index analyses_user_id_updated_at_idx
  on public.analyses (user_id, updated_at desc);

-- ────────────────────────────────────────────
-- TABLE: analysis_steps
-- ────────────────────────────────────────────
create table public.analysis_steps (
  id          uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  step_number smallint not null check (step_number between 1 and 16),
  data        jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- One row per step per analysis
  unique (analysis_id, step_number)
);

comment on table public.analysis_steps is
  'One row per wizard step per analysis. Step data is stored as JSONB.';
comment on column public.analysis_steps.data is
  'JSONB blob of step-specific field values. Schema validated in the domain layer.';

create trigger analysis_steps_updated_at
  before update on public.analysis_steps
  for each row execute function public.set_updated_at();

create index analysis_steps_analysis_id_idx
  on public.analysis_steps (analysis_id, step_number);

-- ────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────

-- analyses: users see only their own rows
alter table public.analyses enable row level security;

create policy "Users can view their own analyses"
  on public.analyses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own analyses"
  on public.analyses for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own analyses"
  on public.analyses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own analyses"
  on public.analyses for delete
  using (auth.uid() = user_id);

-- analysis_steps: access is gated through the parent analyses row
alter table public.analysis_steps enable row level security;

create policy "Users can view steps of their own analyses"
  on public.analysis_steps for select
  using (
    exists (
      select 1 from public.analyses
      where analyses.id = analysis_steps.analysis_id
        and analyses.user_id = auth.uid()
    )
  );

create policy "Users can insert steps of their own analyses"
  on public.analysis_steps for insert
  with check (
    exists (
      select 1 from public.analyses
      where analyses.id = analysis_steps.analysis_id
        and analyses.user_id = auth.uid()
    )
  );

create policy "Users can update steps of their own analyses"
  on public.analysis_steps for update
  using (
    exists (
      select 1 from public.analyses
      where analyses.id = analysis_steps.analysis_id
        and analyses.user_id = auth.uid()
    )
  );

create policy "Users can delete steps of their own analyses"
  on public.analysis_steps for delete
  using (
    exists (
      select 1 from public.analyses
      where analyses.id = analysis_steps.analysis_id
        and analyses.user_id = auth.uid()
    )
  );
