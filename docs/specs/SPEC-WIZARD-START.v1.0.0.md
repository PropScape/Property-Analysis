---
id: SPEC-WIZARD-START
version: 1.0.0
status: draft
created: 2026-05-19
author: AI Architect
---

# SPEC-WIZARD-START v1.0.0 — Wizard Start & Step 1

## 1. Overview

Implements the entry point into the 16-step analysis wizard:

1. **`/analysis/new`** — Shows a name-prompt form. The DB row is **only created
   after the user submits a name**. Navigating away without submitting leaves no
   database record behind.
2. **`/analysis/[id]/step/1`** — "Start" step: user selects their investment
   intent and experience level. No financial inputs yet.
3. **Wizard shell** — Shared layout (`WizardLayout`) with the fixed `AppHeader`,
   a `WizardStepper` bar below the header, a centered form panel, and a `StepFooter`.
4. **Zustand store** — `useAnalysisStore` bootstrapped with `zustand/middleware/persist`
   (localStorage) to hold all 16 step slices.

---

## 2. Routes

| Route | Type | Description |
|---|---|---|
| `/analysis/new` | Client form + Server Action | Name prompt → on submit creates DB row → redirect to step 1 |
| `/analysis/[id]/step/[step]` | Server Component shell + Client form | Wizard step page |
| `/analysis/[id]/step/1` | — | Step 1 (this spec) |

---

## 3. Acceptance Criteria (Gherkin)

### AC-1: Name prompt renders

```gherkin
GIVEN an authenticated user on the project overview page
WHEN they click "Neue Analyse"
THEN they are navigated to /analysis/new
AND they see a heading "Neue Analyse erstellen"
AND they see a name input field
AND the "Erstellen" button is disabled while the name field is empty
AND the page title is "Neue Analyse | PropScape"
```

### AC-2: Create new analysis

```gherkin
GIVEN the user is on /analysis/new and has entered a name
WHEN they click "Erstellen"
THEN a new analysis row is created in Supabase with the given name, status "draft", and current_step = 1
AND the user is redirected to /analysis/[newId]/step/1
AND the page title is "Analyse starten | PropScape"
```

### AC-2a: No orphan record on abandonment

```gherkin
GIVEN the user is on /analysis/new and has NOT submitted the form
WHEN they navigate away or close the tab
THEN no analysis row is created in Supabase
```

### AC-3: Step 1 form renders

```gherkin
GIVEN the user is on /analysis/[id]/step/1
WHEN the page loads
THEN they see a heading "Wie möchten Sie investieren?"
AND they see three intent selection cards: "Kapitalanlage", "Eigennutzung", "Flip"
AND they see three experience level cards: "Einsteiger", "Fortgeschrittener", "Experte"
AND the "Weiter" (Next) button is disabled until both selections are made
AND the WizardStepper shows Step 1 as active
```

### AC-4: Intent selection

```gherkin
GIVEN the user is on Step 1
WHEN they click "Kapitalanlage"
THEN the card gets a navy-600 border and check indicator
AND the other intent cards are deselected
```

### AC-5: Validation

```gherkin
GIVEN the user has not selected both intent and experience level
WHEN they attempt to click "Weiter"
THEN the button remains disabled (no error toast needed — button state is sufficient)
```

### AC-6: Save and advance

```gherkin
GIVEN the user has selected intent and experience level
WHEN they click "Weiter"
THEN the step data is saved to localStorage via Zustand
AND a Server Action saves step 1 data to analysis_steps (step_number = 1)
AND the user is redirected to /analysis/[id]/step/2
```

### AC-7: Stepper navigation

```gherkin
GIVEN the user is on any step > 1
WHEN they click "Zurück"
THEN they are navigated to the previous step
AND no data is lost
```

### AC-8: WizardStepper rendering

```gherkin
GIVEN the user is on step N
THEN steps 1..N-1 show as "completed" (check icon, slate-800 background)
AND step N shows as "active" (navy-600, shadow-glow)
AND steps N+1..15 show as "disabled" (slate-100, not clickable)
AND completed steps ARE clickable (allow backward navigation)
```

---

## 4. Data Shape

### Step 1 domain type

```typescript
// src/domain/types/wizard.ts
export type WizardIntent =
  | "buy_to_rent"    // Kapitalanlage
  | "buy_to_live"    // Eigennutzung
  | "flip";          // Flip

export type ExperienceLevel =
  | "beginner"       // Einsteiger
  | "intermediate"   // Fortgeschrittener
  | "expert";        // Experte

export interface Step1Data {
  intent: WizardIntent;
  experience_level: ExperienceLevel;
}
```

### Zustand store slice (Step 1)

```typescript
// src/stores/analysis-store.ts
interface AnalysisStore {
  analysisId: string | null;
  currentStep: number;
  step1: Partial<Step1Data>;
  // ... (steps 2–16 added in future specs)
  setStep1: (data: Partial<Step1Data>) => void;
  setCurrentStep: (step: number) => void;
  setAnalysisId: (id: string) => void;
  reset: () => void;
}
```

Persisted to localStorage key: `propscape-analysis`.

---

## 5. Components to Build

| Component | Location | Notes |
|---|---|---|
| `WizardLayout` | `src/app/analysis/[id]/step/layout.tsx` | Shared layout: AppHeader + stepper + main content |
| `WizardStepper` | `src/components/wizard/WizardStepper.tsx` | 15-node horizontal stepper (Steps 1–15; Step 16 is dashboard) |
| `StepFooter` | `src/components/wizard/StepFooter.tsx` | Back / Next navigation bar |
| `RadioCardGroup` | `src/components/wizard/RadioCardGroup.tsx` | Card-style radio selection (reused in many steps) |
| `Step1Form` | `src/components/wizard/steps/Step1Form.tsx` | Client Component: intent + experience level selection |
| `useAnalysisStore` | `src/stores/analysis-store.ts` | Zustand store with persist middleware |

---

## 6. Server Actions

### `createAnalysisAction`
- `src/actions/analysis.ts`
- Creates a new row in `analyses` (status: draft, current_step: 1)
- Returns `Result<{ id: string }>`
- Called from `/analysis/new` page

### `saveStepAction`
- `src/actions/analysis.ts`
- Upserts a row in `analysis_steps` (step_number, step_data JSONB)
- Updates `analyses.current_step` if advancing
- Called from `StepFooter` on "Next"

---

## 7. Architectural Remarks

1. **Scalability risk:** The Zustand store will grow to 16 step slices.
   Keep slices flat (not nested objects) to avoid unnecessary re-renders.
2. **Security risk:** `analysis_id` is user-supplied via URL param — Server Actions
   must verify `auth.uid() = analyses.user_id` via RLS before any write.
   RLS is already enforced at DB level (ADR-002); Server Actions must not
   bypass it by using the service role key.
3. **ADR check:** ADR-005 mandates Zustand + persist middleware — compliant.
   ADR-004 mandates domain types in `src/domain/` — `Step1Data` and enums
   go there, not in the store file.

---

## 8. Open Questions

> [!IMPORTANT]
> **Q1 — Analysis name:** Should `/analysis/new` prompt for an analysis name
> before creating the DB row, or should it auto-generate one (e.g. "Analyse vom 19.05.2026")
> that the user can rename later?
> **Proposed:** Auto-generate. Rename can be added post-MVP.

> [!IMPORTANT]
> **Q2 — Step 2 redirect:** This spec only covers Step 1. Does Step 2 exist yet?
> `/analysis/[id]/step/2` will 404 until SPEC-WIZARD-STEPS is implemented.
> **Proposed:** "Weiter" on Step 1 saves data but shows a toast "Schritt 2 folgt bald"
> instead of redirecting, until Step 2 exists.

---

## 9. Files to Create / Modify

### New files
- `src/domain/types/wizard.ts` — Step data types + enums
- `src/domain/schemas/step1.ts` — Zod schema for Step1Data
- `src/stores/analysis-store.ts` — Zustand store
- `src/actions/analysis.ts` — createAnalysisAction + saveStepAction
- `src/app/analysis/new/page.tsx` — Redirect page
- `src/app/analysis/[id]/step/layout.tsx` — Wizard shell layout
- `src/app/analysis/[id]/step/[step]/page.tsx` — Step router
- `src/components/wizard/WizardStepper.tsx`
- `src/components/wizard/StepFooter.tsx`
- `src/components/wizard/RadioCardGroup.tsx`
- `src/components/wizard/steps/Step1Form.tsx`

### Modified files
- `src/components/app-header.tsx` — conditionally render WizardStepper inside wizard routes
- `docs/traceability.md` — add SPEC-WIZARD-START entries

---

## 10. Verification Plan

### Unit tests (`src/__tests__/`)
- `step1.schema.test.ts` — Zod schema happy path + rejection cases
- `analysis-store.test.ts` — store actions (setStep1, reset, persistence)

### E2E tests (`e2e/`)
- `wizard-start.spec.ts` — skipped in CI (requires auth session)
  - AC-1: clicking "Neue Analyse" creates analysis + redirects
  - AC-2: Step 1 renders both card groups
  - AC-3: intent card selection state
  - AC-5: "Weiter" saves + advances (once Step 2 exists)
  - AC-7: WizardStepper shows step 1 as active
