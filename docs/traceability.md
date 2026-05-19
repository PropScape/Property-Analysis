# Traceability Matrix

> **Last Updated:** 2026-05-19

This table maps each specification to its implementation files and tests.
Updated as part of the [Definition of Done](../.gemini/GEMINI.md#§6-definition-of-done).

| Req ID | Version | Spec File | Description | Implementation Path | Verification Test | Status |
|---|---|---|---|---|---|---|
| SPEC-PROJECT-LIST | 1.0.0 | `docs/specs/SPEC-PROJECT-LIST.v1.0.0.md` | Project overview page with analysis list, stat cards, empty state, delete flow | `src/app/page.tsx`, `src/app/analysis/new/page.tsx`, `src/components/app-header.tsx`, `src/components/analysis-card.tsx`, `src/components/stat-card.tsx`, `src/components/status-badge.tsx`, `src/components/empty-state.tsx`, `src/lib/mock-data.ts` | `src/components/status-badge.test.tsx`, `src/components/stat-card.test.tsx`, `e2e/project-list.spec.ts`, `e2e/smoke.spec.ts` | ✅ Implemented |
| SPEC-WIZARD-START | 1.0.0 | `docs/specs/SPEC-WIZARD-START.v1.0.0.md` | Analysis wizard: name-prompt entry, wizard shell (stepper + layout), Step 1 (intent + experience), Zustand store with persist, Server Actions | `src/domain/types/wizard.ts`, `src/domain/schemas/step1.ts`, `src/domain/schemas/new-analysis.ts`, `src/stores/analysis-store.ts`, `src/actions/analysis.ts`, `src/app/analysis/new/page.tsx`, `src/app/analysis/[id]/step/layout.tsx`, `src/app/analysis/[id]/step/[step]/page.tsx`, `src/components/wizard/WizardStepper.tsx`, `src/components/wizard/StepFooter.tsx`, `src/components/wizard/RadioCardGroup.tsx`, `src/components/wizard/steps/Step1Form.tsx`, `src/components/wizard/NewAnalysisForm.tsx`, `src/components/wizard/StoreHydration.tsx` | `src/__tests__/step1.schema.test.ts`, `src/__tests__/analysis-store.test.ts`, `e2e/wizard-start.spec.ts` | ✅ Implemented |

