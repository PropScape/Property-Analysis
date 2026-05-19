---
spec_id: SPEC-PROJECT-LIST
version: 1.0.0
status: draft
author: AI Architect
date: 2026-05-19
related_adrs:
  - ADR-001 (Next.js App Router)
  - ADR-003 (Tailwind/Shadcn)
  - ADR-004 (Clean Architecture)
---

# SPEC-PROJECT-LIST v1.0.0 — Project Overview (Analysis List)

## 1. Overview

The project overview page (`/`) is the **entry point** for authenticated users.
It displays a list of all saved analyses, summary statistics, and a prominent
CTA to create a new analysis. This page replaces the current placeholder.

> **Note:** Authentication is not yet implemented. For the MVP implementation
> of this spec, the page will render with mock/empty data. Auth integration
> will be handled by `SPEC-AUTH`.

---

## 2. User Stories

### US-1: View Analysis List
As a user, I want to see all my saved investment analyses on a single page,
so that I can quickly find and continue working on any analysis.

### US-2: Create New Analysis
As a user, I want to start a new analysis with a single click,
so that I can begin evaluating a new property.

### US-3: View Summary Statistics
As a user, I want to see at-a-glance statistics (total, completed, draft),
so that I can understand my portfolio of analyses.

### US-4: Manage Analyses
As a user, I want to edit, duplicate, or delete an analysis,
so that I can manage my portfolio efficiently.

### US-5: Empty State
As a new user, I want to see a welcoming empty state with a clear CTA,
so that I know how to get started.

---

## 3. Acceptance Criteria (Gherkin)

### Feature: Project Overview Page

```gherkin
Feature: Project Overview (Analysis List)

  Background:
    Given I am on the project overview page "/"

  Scenario: Empty state for new users
    Given I have no saved analyses
    When the page loads
    Then I see a welcome illustration
    And I see the heading "Starten Sie Ihre erste Analyse"
    And I see a primary "Neue Analyse" button

  Scenario: Display analysis list
    Given I have 3 saved analyses
    When the page loads
    Then I see the heading "Meine Analysen"
    And I see 3 analysis cards
    And each card shows the analysis name
    And each card shows a status badge ("Abgeschlossen" or "Entwurf")
    And each card shows the last edited date

  Scenario: Display summary statistics
    Given I have 3 analyses (2 completed, 1 draft)
    When the page loads
    Then I see a stat card showing "3 Analysen"
    And I see a stat card showing "2 Abgeschlossen"
    And I see a stat card showing "1 Entwurf"

  Scenario: Create new analysis
    When I click the "Neue Analyse" button
    Then I am navigated to "/analysis/new"

  Scenario: Display KPI summary on analysis card
    Given I have a completed analysis with KPIs
    When the page loads
    Then the card shows the Kaufpreis value
    And the card shows the monthly Cashflow value
    And the card shows the Rendite percentage

  Scenario: Delete analysis
    Given I have at least 1 saved analysis
    When I click the delete icon on an analysis card
    Then I see a confirmation dialog
    When I confirm the deletion
    Then the analysis is removed from the list

  Scenario: Responsive layout
    Given I am on a mobile device (< 768px)
    When the page loads
    Then analysis cards are displayed in a single column
    And the "Neue Analyse" button is full-width

  Scenario: Responsive layout (desktop)
    Given I am on a desktop (>= 1024px)
    When the page loads
    Then analysis cards are displayed in a 3-column grid
```

---

## 4. UI Specification

### 4.1 Page Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  [Header] Glass panel, logo "Immoverse", user avatar               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─ Page Title ──────────────────────── [+ Neue Analyse] ─────────┐ │
│  │ Meine Analysen                                                  │ │
│  │ Verwalten Sie Ihre Immobilien-Investmentanalysen               │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌── Stat Cards (3 columns) ──────────────────────────────────────┐ │
│  │ [3 Analysen]  [2 Abgeschlossen ●]  [1 Entwurf ●]             │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌── Analysis Cards Grid (3 columns on lg, 1 on mobile) ─────────┐ │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐                       │ │
│  │ │ Card 1   │ │ Card 2   │ │ Card 3   │                       │ │
│  │ │          │ │          │ │          │                       │ │
│  │ └──────────┘ └──────────┘ └──────────┘                       │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.2 Analysis Card Anatomy

```
┌─────────────────────────────────────────────────┐
│  [🏢]                              [Abgeschlossen] │  ← icon + status badge
│                                                     │
│  Eigentumswohnung München Schwabing                │  ← name (font-semibold)
│  München, Schwabing                                │  ← location (muted)
│                                                     │
│  Kaufpreis    Cashflow      Rendite                │  ← KPI labels (xs, muted)
│  350.000 €   +620 €/M      16.5 %                 │  ← KPI values (bold)
│                                                     │
│  ──────────────────────────────────────────────── │
│  Zuletzt bearbeitet: 18.05.2026    [✏] [📋] [🗑]  │  ← footer
└─────────────────────────────────────────────────┘
```

### 4.3 Empty State

```
┌─────────────────────────────────────────────────┐
│                                                   │
│              [🏢 Building icon, large]           │
│                                                   │
│     Starten Sie Ihre erste Analyse               │
│     Analysieren Sie Ihre Immobilieninvestments    │
│     mit professionellen Kennzahlen.              │
│                                                   │
│          [+ Neue Analyse starten]                │
│                                                   │
└─────────────────────────────────────────────────┘
```

### 4.4 Styling Tokens (from design-system.md)

| Element | Tailwind Classes |
|---|---|
| Page background | `bg-background` (slate-50) |
| Card | `bg-card rounded-[16px] shadow-card border border-border` |
| Card hover | `hover:border-navy-200 transition-colors` |
| Status badge (completed) | `bg-emerald-50 text-emerald-600 text-xs font-medium px-2.5 py-0.5 rounded-full` |
| Status badge (draft) | `bg-amber-100 text-amber-700 text-xs font-medium px-2.5 py-0.5 rounded-full` |
| KPI value | `text-lg font-bold text-foreground` |
| KPI label | `text-xs font-semibold uppercase tracking-wider text-muted-foreground` |
| CTA button | `bg-primary hover:bg-navy-700 text-primary-foreground shadow-glow` |
| Footer text | `text-xs text-muted-foreground` |
| Action icons | `text-muted-foreground hover:text-navy-600 transition-colors` |

---

## 5. Components

### 5.1 New Components

| Component | File | Description |
|---|---|---|
| `AppHeader` | `src/components/app-header.tsx` | Glass-panel header with logo and user area |
| `AnalysisCard` | `src/components/analysis-card.tsx` | Individual analysis card with KPIs and actions |
| `StatCard` | `src/components/stat-card.tsx` | Summary statistic card (count + label + optional badge) |
| `EmptyState` | `src/components/empty-state.tsx` | Empty state with icon, heading, description, CTA |
| `StatusBadge` | `src/components/status-badge.tsx` | Styled badge for analysis status |

### 5.2 Shadcn Primitives Required

Install via `npx shadcn@latest add`:

- `card` — analysis cards, stat cards
- `badge` — status indicators (may use custom variant instead)
- `alert-dialog` — delete confirmation
- `separator` — card footer divider
- `skeleton` — loading state
- `sonner` — toast notifications (already installed)

### 5.3 Page Component

| File | Description |
|---|---|
| `src/app/page.tsx` | Server component. Renders header, stats, card grid or empty state. |

---

## 6. Data Types

```typescript
/** Analysis status */
type AnalysisStatus = "draft" | "completed";

/** Analysis summary for the project list */
interface AnalysisSummary {
  id: string;
  name: string;
  status: AnalysisStatus;
  currentStep: number;
  /** Location description, if available from step data */
  location?: string;
  /** KPI snapshot (populated only for completed analyses) */
  kpiSnapshot?: {
    purchasePriceCents: number;
    monthlyCashflowCents: number;
    returnOnEquityPercent: number;
  };
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

---

## 7. Implementation Notes

### 7.1 Data Source (MVP)

Since Supabase is not yet connected, use **mock data** for the initial
implementation:

- Export a `MOCK_ANALYSES` array from `src/lib/mock-data.ts`
- Include 3 analyses: 2 completed with KPI snapshots, 1 draft
- The page component uses this mock data directly
- A `TODO` comment marks where Supabase fetch will be added

### 7.2 Navigation

- "Neue Analyse" button links to `/analysis/new` (a placeholder page for now)
- Card click navigates to `/analysis/[id]/step/[currentStep]` (placeholder)
- Edit icon = same as card click
- Duplicate icon = future feature (show toast: "Kommt bald")
- Delete icon = AlertDialog → remove from mock list (client-side only for now)

### 7.3 Responsive Breakpoints

| Breakpoint | Stat Cards | Analysis Cards |
|---|---|---|
| < 640px (mobile) | 1 column | 1 column |
| 640–1023px (tablet) | 3 columns | 2 columns |
| ≥ 1024px (desktop) | 3 columns | 3 columns |

### 7.4 Accessibility

- Cards are focusable and keyboard-navigable (`tabIndex={0}`, `role="article"`)
- Action buttons have `aria-label` descriptions
- Delete dialog is properly trapped for keyboard focus
- Status badges include `aria-label` for screen readers

---

## 8. Test Plan

### 8.1 Unit Tests (Vitest)

| Test | File |
|---|---|
| `StatusBadge` renders correct variant | `src/components/status-badge.test.tsx` |
| `StatCard` renders count and label | `src/components/stat-card.test.tsx` |

### 8.2 E2E Tests (Playwright)

| Test | File |
|---|---|
| Homepage loads with mock analyses | `e2e/project-list.spec.ts` |
| Empty state renders when no analyses | `e2e/project-list.spec.ts` |
| "Neue Analyse" button navigates | `e2e/project-list.spec.ts` |
| Delete flow shows confirmation dialog | `e2e/project-list.spec.ts` |

---

## 9. Traceability

| Spec ID | Files Created/Modified | Tests |
|---|---|---|
| SPEC-PROJECT-LIST v1.0.0 | `src/app/page.tsx`, `src/components/app-header.tsx`, `src/components/analysis-card.tsx`, `src/components/stat-card.tsx`, `src/components/empty-state.tsx`, `src/components/status-badge.tsx`, `src/lib/mock-data.ts` | `status-badge.test.tsx`, `stat-card.test.tsx`, `e2e/project-list.spec.ts` |

---

## 10. Open Questions

> [!IMPORTANT]
> **Q1: Header navigation.** Should the header on the project overview page
> show the wizard stepper (disabled), or a simplified header with just
> logo + user actions? The generated mockup shows a simplified header.
> **Recommendation:** Simplified header for the list page; wizard stepper
> appears only inside `/analysis/[id]/step/*` routes.

> [!NOTE]
> **Q2: Sorting/Filtering.** Should the analysis list support sorting
> (by date, name, status) or filtering? For v1.0.0, we propose a simple
> "most recently edited first" sort with no filtering UI. Sorting/filtering
> can be added in a future spec version.
