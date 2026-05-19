# ADR-005: Zustand for Wizard State Management

> **Status:** Accepted
> **Date:** 2026-05-18
> **Deciders:** Dennis Mende (Owner), AI Architect

## Context

The Immoverse wizard collects data across 16 interconnected steps. Data entered
in early steps (e.g., purchase price, rent) affects calculations displayed in
later steps (e.g., cashflow, ROI). The state management solution must:

1. Persist state across page navigations (URL-based routing per step).
2. Survive page refreshes (localStorage persistence).
3. Allow real-time calculation previews as data changes.
4. Sync to the server (Supabase) on explicit save actions.
5. Be simple enough to reason about — no unnecessary abstraction.

## Decision

Use **Zustand** for wizard state management with the **persist middleware**
(localStorage) for client-side persistence.

### Store Architecture

```typescript
interface AnalysisStore {
  // Metadata
  analysisId: string | null;
  currentStep: number;

  // Step data (one slice per step)
  generalProperty: GeneralPropertyData;
  purchasePrice: PurchasePriceData;
  financing: FinancingData;
  // ... (16 step slices)

  // Derived (computed from step data via domain functions)
  // These are NOT stored — recalculated on access.

  // Actions
  setStepData: <T>(step: number, data: Partial<T>) => void;
  setCurrentStep: (step: number) => void;
  reset: () => void;
}
```

### Persistence Strategy

1. **Every keystroke:** Zustand persist middleware writes to localStorage.
   User never loses data on refresh or tab close.
2. **Explicit save:** User clicks "Save" → Server Action writes current store
   state to Supabase (`analyses` + `analysis_steps` tables).
3. **Load from server:** When user opens a saved analysis, Server Action
   fetches data → hydrates Zustand store.

## Rationale

- **Lightweight:** ~1KB gzipped, no boilerplate (compare Redux: actions,
  reducers, selectors, thunks).
- **localStorage persist:** Built-in middleware, zero configuration.
- **DevTools:** Zustand DevTools for debugging state changes.
- **No Context re-renders:** Unlike React Context + useReducer, Zustand
  uses external subscriptions — components only re-render when their
  specific slice changes.
- **Framework-agnostic core:** While the React bindings are used, the store
  logic itself could be adapted for non-React environments.

## Alternatives Considered

| Alternative | Pros | Cons |
|---|---|---|
| React Context + useReducer | Built-in, no deps | Re-renders entire tree on any state change, verbose |
| Redux Toolkit | Mature, excellent DevTools | Heavy boilerplate for 16-step form state |
| Jotai | Atomic model, minimal re-renders | Less intuitive for large, interconnected state |
| URL search params | Shareable, bookmarkable | 16 steps of data exceeds URL length limits |

## Consequences

### Positive

- Minimal boilerplate for a complex multi-step form.
- Built-in persistence eliminates data loss risk.
- Fine-grained subscriptions prevent unnecessary re-renders.
- Easy to test — stores are plain objects with actions.

### Negative

- Client-side state — must be explicitly synced to server.
- localStorage has a ~5MB limit (sufficient for analysis data, but must
  be monitored).

### Risks

- Stale state if user opens the same analysis in two tabs. Mitigated by
  showing a "last saved" timestamp and warning on save conflicts (future).

## References

- [Zustand Documentation](https://zustand.docs.pmnd.rs/)
- [ADR-002: Supabase](ADR-002-supabase.md) — server-side persistence target
