# PropScape — Design System

> **Status:** ✅ Finalized
> **Date:** 2026-05-18
> **Stack:** Tailwind CSS v4 · Shadcn UI (new-york) · Next.js 16

---

## 1. Design Principles

| Principle | Description |
|---|---|
| **Professional** | Financial-grade UI that inspires trust. No playful elements. |
| **Glassmorphism** | Layered glass panels, backdrop-blur, subtle depth hierarchy |
| **Progressive Disclosure** | KPIs and results unlock as the user completes wizard steps |
| **High Contrast** | Clear text hierarchy, strong foreground/background separation |
| **Responsive** | Mobile-first layouts, sticky CTAs on mobile, fluid breakpoints |
| **Accessible** | WCAG 2.1 AA compliance, semantic HTML, keyboard-navigable |

**Aesthetic:** Professional financial tool with glassmorphism accents.
Light mode only (no dark mode in MVP — see [ADR-003](adr/ADR-003-tailwind-shadcn.md)).

---

## 1b. Styling Constraints

These rules are **non-negotiable** and enforced during code review.

| Constraint | Rule |
|---|---|
| **No magic values** | Never use raw hex codes, pixel values, or ad-hoc spacing. Use semantic tokens only (`bg-primary`, `p-4`, `text-muted-foreground`). |
| **Shadcn components only** | Do not build generic HTML elements (`<button>`, `<input>`, `<select>`). Always use the corresponding Shadcn primitive. |
| **No inline styles** | All styling goes through Tailwind utility classes. No `style={{}}` attributes. |
| **Design system is law** | Do not invent new visual patterns. If a component doesn't exist in Shadcn, propose adding it via the spec process before implementing. |
| **`cn()` for merging** | Always use `cn()` from `@/lib/utils` for conditional class names. Never concatenate strings. |
| **Icons: Lucide only** | No Font Awesome, no custom SVGs, no emoji as icons. Use Lucide React exclusively. |

---

## 2. Color Palette

Extracted from the 16 HTML design mockups. All colors are defined as CSS custom
properties in `globals.css` and consumed via Tailwind semantic tokens.

### 2.1 Core Navy Palette (Primary Brand)

| Token | Hex | Usage |
|---|---|---|
| `navy-50` | `#eff6ff` | Hover backgrounds, info callout backgrounds |
| `navy-100` | `#dbeafe` | Active sidebar item background, info borders |
| `navy-200` | `#bfdbfe` | Hover borders |
| `navy-300` | `#93c5fd` | — |
| `navy-400` | `#60a5fa` | — |
| `navy-500` | `#3b82f6` | Chart accent, secondary action |
| `navy-600` | `#1e3a8a` | **Primary action color.** Buttons, active stepper, glow, links |
| `navy-700` | `#1e40af` | Hover state for primary buttons |
| `navy-800` | `#1d4ed8` | — |
| `navy-900` | `#172554` | Dark accents |
| `navy-950` | `#0f172a` | — |

### 2.2 Slate Palette (Neutrals)

| Token | Hex | Usage |
|---|---|---|
| `slate-50` | `#f8fafc` | **Page background** |
| `slate-100` | `#f1f5f9` | Table header backgrounds, subtle surfaces |
| `slate-200` | `#e2e8f0` | Borders (cards, inputs, dividers) |
| `slate-300` | `#cbd5e1` | Stepper connector lines (incomplete) |
| `slate-400` | `#94a3b8` | Placeholder text, muted captions |
| `slate-500` | `#64748b` | **Body text** |
| `slate-600` | `#475569` | Secondary text, form labels |
| `slate-700` | `#334155` | — |
| `slate-800` | `#1e293b` | Completed stepper nodes, dark surfaces |
| `slate-900` | `#0f172a` | **Headings**, card titles |

### 2.3 Semantic Colors

| Token | Hex | Usage |
|---|---|---|
| `emerald-50` | `#ecfdf5` | Positive badge background |
| `emerald-100` | `#d1fae5` | — |
| `emerald-400` | `#34d399` | Positive values on dark surfaces |
| `emerald-500` | `#10b981` | Chart: wealth building line |
| `emerald-600` | `#059669` | **Positive cashflow values**, success text |
| `emerald-700` | `#047857` | — |
| `amber-100` | `#fef3c7` | Warning badge background |
| `amber-500` | `#f59e0b` | Chart: appreciation segment |
| `amber-600` | `#d97706` | — |
| `amber-700` | `#b45309` | Warning text |
| `red-400` | `#f87171` | Error/destructive (light usage) |
| `red-500` | `#ef4444` | Error states, destructive actions |

### 2.4 Shadcn CSS Variable Mapping

```css
:root {
  --background: 210 40% 98%;        /* slate-50 */
  --foreground: 222 47% 11%;        /* slate-900 */
  --card: 0 0% 100%;                /* white */
  --card-foreground: 222 47% 11%;   /* slate-900 */
  --primary: 224 64% 33%;           /* navy-600 */
  --primary-foreground: 210 40% 98%;/* white-ish */
  --secondary: 210 40% 96%;         /* slate-100 */
  --secondary-foreground: 222 47% 11%;
  --muted: 210 40% 96%;             /* slate-100 */
  --muted-foreground: 215 16% 47%;  /* slate-500 */
  --accent: 210 40% 96%;            /* slate-100 */
  --accent-foreground: 222 47% 11%;
  --destructive: 0 84% 60%;         /* red-500 */
  --border: 214 32% 91%;            /* slate-200 */
  --input: 214 32% 91%;             /* slate-200 */
  --ring: 224 64% 33%;              /* navy-600 */
  --radius: 0.75rem;
}
```

---

## 3. Typography

| Role | Font | Size | Weight | Tailwind |
|---|---|---|---|---|
| **Body** | Inter | 14px | 400 | `text-sm font-normal` |
| **Body large** | Inter | 16px | 400 | `text-base font-normal` |
| **Heading 1** | Inter | 30px | 700 | `text-3xl font-bold` |
| **Heading 2** | Inter | 24px | 700 | `text-2xl font-bold` |
| **Heading 3** | Inter | 18px | 600 | `text-lg font-semibold` |
| **Section label** | Inter | 12px | 600 | `text-xs font-semibold uppercase tracking-wider` |
| **Caption** | Inter | 12px | 400 | `text-xs` |
| **KPI value** | Inter | 30px | 700 | `text-3xl font-bold` |
| **KPI label** | Inter | 12px | 600 | `text-xs font-semibold uppercase tracking-wide` |

**Loading:** Import Inter via `next/font/google` for zero layout shift.
Weight range: 400, 500, 600, 700.

---

## 4. Shadows

Three levels extracted from the design mockups:

| Token | CSS Value | Usage |
|---|---|---|
| `shadow-glass` | `0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.5)` | Glass panels (header, overlay cards) |
| `shadow-card` | `0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)` | Content cards, wizard panels |
| `shadow-glow` | `0 0 20px rgba(30,58,138,0.15)` | Active stepper node, primary CTA glow |

---

## 5. Border Radii

| Token | Value | Usage |
|---|---|---|
| `rounded-md` | 6px | Badges, small buttons |
| `rounded-lg` | 8px | Inputs, icon buttons, small cards |
| `rounded-xl` | 12px | Cards, panels, CTAs |
| `rounded-[16px]` | 16px | Main content cards (wizard panels, KPI cards) |
| `rounded-full` | 50% | Stepper nodes, avatars, icon circles |

> **Note:** `rounded-[16px]` is the one exception to the "no magic values"
> rule. It maps to the design's card radius and should be extracted to a
> CSS variable (`--radius-card: 16px`) in `globals.css`.

---

## 6. Spacing & Layout

| Token | Value | Usage |
|---|---|---|
| `p-2` | 8px | Tight internal padding (tags, badges) |
| `p-4` | 16px | Standard card padding, form field spacing |
| `p-5` | 20px | KPI card padding |
| `p-6` | 24px | Section padding, larger cards |
| `p-8` | 32px | Main content area padding |
| `gap-3` | 12px | Icon + text spacing |
| `gap-4` | 16px | Grid gap, form field spacing |
| `gap-6` | 24px | Section spacing |
| `gap-8` | 32px | Major section spacing |
| `max-w-[1440px]` | 1440px | Page content max width |
| `max-w-[1200px]` | 1200px | Dashboard content max width |
| `max-w-3xl` | 768px | Wizard form panel max width |

### Layout Patterns

**Wizard steps (Steps 1–15):**
Three-column layout on desktop (KPI sidebar — wizard form — KPI sidebar),
collapsing to single column on mobile.

```
┌─────────┬────────────────────┬─────────┐
│ KPIs    │   Wizard Form      │  KPIs   │  Desktop (lg+)
│ (left)  │   (center)         │ (right) │
└─────────┴────────────────────┴─────────┘

┌──────────────────────────────────────────┐
│         Wizard Form (full width)         │  Mobile
│         KPIs (below form)                │
└──────────────────────────────────────────┘
```

**Expert Dashboard (Step 16):**
Sidebar navigation + main content area.

```
┌────────┬──────────────────────────────────┐
│ Sidebar│   Main Content                   │  Desktop (lg+)
│ (nav)  │   (KPI row, charts, tables)      │
└────────┴──────────────────────────────────┘
```

---

## 7. Component Inventory

### 7.1 Shadcn Primitives (install via CLI)

| Component | Usage in PropScape |
|---|---|
| `Button` | Primary actions, secondary actions, icon buttons |
| `Card` | KPI cards, wizard panels, analysis list items |
| `Input` | Text fields with optional icon prefix or unit suffix |
| `Label` | Form field labels |
| `Select` | Dropdowns (property type, Bundesland, etc.) |
| `Checkbox` | Toggle options |
| `Badge` | Status indicators (Positiv, Risk, OK, Fix, Schätzung) |
| `Dialog` / `AlertDialog` | Confirmations (delete analysis) |
| `Table` | Expert Dashboard detailed cashflow table |
| `Tabs` | Dashboard section switcher (Cashflow, Rendite, Stresstest) |
| `Separator` | Visual dividers |
| `Skeleton` | Loading states |
| `Toast` / `Sonner` | Success/error notifications |
| `Chart` | Recharts-based charts (cashflow projection, IRR donut) |
| `Progress` | Wizard progress bar (mobile) |

### 7.2 Custom Components (to be built)

| Component | Description |
|---|---|
| `WizardStepper` | 16-step horizontal stepper with completed/active/disabled states |
| `GlassHeader` | Fixed header with glass-panel effect and stepper |
| `KpiCard` | Numeric KPI display with label, value, subtitle, and optional trend |
| `RadioCardGroup` | Card-style radio buttons (property type selection) |
| `InputWithUnit` | Input field with suffix unit (€, %, Jahre) |
| `InputWithIcon` | Input field with prefix icon |
| `StepFooter` | Desktop + mobile navigation (Back / Next) |
| `AnalysisCard` | Project overview card showing analysis name, status, KPI summary |
| `AuditTimeline` | Vertical timeline for change history |

---

## 8. Glass Panel Effect

The header and overlay cards use a glass panel effect:

```css
.glass-panel {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.8);
}
```

This should be defined as a Tailwind utility or CSS class in `globals.css`.

---

## 9. Interactive States

| State | Style |
|---|---|
| **Hover (card)** | `hover:border-navy-200 transition-colors`, cursor pointer |
| **Hover (button, primary)** | `hover:bg-navy-700` + `hover:shadow-lg` |
| **Hover (button, secondary)** | `hover:bg-slate-50 hover:text-slate-900` |
| **Hover (icon button)** | `hover:text-navy-600 hover:border-navy-200 hover:bg-navy-50` |
| **Focus** | `focus:outline-none focus:ring-2 focus:ring-navy-600/20 focus:border-navy-600` |
| **Active (stepper)** | `bg-navy-600 text-white shadow-glow` |
| **Completed (stepper)** | `bg-slate-800 text-white` with check icon |
| **Disabled (stepper)** | `bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed` |
| **Disabled (button)** | `opacity-50 pointer-events-none` |
| **Loading** | Spinner icon + disabled state |

**Transitions:** `transition-all duration-200 ease-in-out` on interactive
elements. `transition-colors` for simple color changes.

---

## 10. Form Patterns

### 10.1 Standard Input

```
┌─────────────────────────────────────┐
│  Label *                            │
│  ┌────────────────────────────────┐ │
│  │ [icon] Placeholder...     [€] │ │
│  └────────────────────────────────┘ │
│  Helper text or error message       │
└─────────────────────────────────────┘
```

- Label: `text-sm font-medium text-slate-700`
- Input: `rounded-lg border-slate-200 focus:ring-navy-600/20`
- Required: Red asterisk `*` next to label
- Error: `text-sm text-destructive`, linked via `aria-describedby`
- Unit suffix: `text-slate-400` inside the input

### 10.2 Radio Card Group

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   [icon]        │  │   [icon]        │  │   [icon]        │
│   Eigentums-    │  │   Mehrfamilien-  │  │   Gewerbe       │
│   wohnung       │  │   haus          │  │                  │
│                 │  │                 │  │                  │
│  ○ selected     │  │  ○              │  │  ○              │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

- Card: `rounded-xl border-slate-200 p-5`
- Selected: `border-navy-600 bg-navy-50 shadow-glow`
- Hover: `hover:border-navy-200`

### 10.3 Segmented Toggle

For binary choices (e.g., Neubau / Bestand, Ja / Nein):

- Use Shadcn `ToggleGroup` with navy active state
- Active: `bg-navy-600 text-white`
- Inactive: `bg-white text-slate-600`

---

## 11. Animations

| Element | Animation | Spec |
|---|---|---|
| Step content | Fade in + slide up | `opacity 0→1, translateY 5px→0, 300ms ease-in-out` |
| Tab content | Fade in + slide up | Same as step content |
| Card hover | Scale + shadow | `transition-transform group-hover:scale-105` (stepper nodes) |
| KPI reveal | Fade in | On step completion, new KPIs fade in |
| Status badge pulse | Pulse animation | `animate-pulse` on status indicator dot |
| CTA glow | Glow shadow | `shadow-[0_0_20px_rgba(30,58,138,0.3)]` on primary buttons |
| Arrow icon | Translate on hover | `group-hover:translate-x-1 transition-transform` |

---

## 12. Iconography (Lucide React)

Font Awesome icons from the HTML mockups mapped to Lucide equivalents:

| Design (FA) | Lucide Equivalent | Usage |
|---|---|---|
| `fa-building-user` | `Building2` | Logo / brand icon |
| `fa-check` | `Check` | Completed stepper node |
| `fa-arrow-left` | `ArrowLeft` | Back navigation |
| `fa-arrow-right` | `ArrowRight` | Forward navigation, CTAs |
| `fa-download` | `Download` | Export / download |
| `fa-share-nodes` | `Share2` | Share action |
| `fa-user` | `User` | User profile / avatar |
| `fa-pen-to-square` | `Pencil` | Edit action |
| `fa-money-bill-wave` | `Banknote` | Purchase price KPI |
| `fa-building-columns` | `Landmark` | Financing KPI |
| `fa-chart-line` | `TrendingUp` | Cashflow / ROI |
| `fa-chart-pie` | `PieChart` | Dashboard icon |
| `fa-coins` | `Coins` | Cashflow & Taxes |
| `fa-bolt` | `Zap` | Stress test |
| `fa-house` | `Home` | Overview / dashboard home |
| `fa-filter` | `Filter` | Filter action |
| `fa-magnifying-glass` | `Search` | Search |
| `fa-piggy-bank` | `PiggyBank` | Savings / reserves |
| `fa-arrow-trend-up` | `TrendingUp` | Value appreciation |
| `fa-scale-balanced` | `Scale` | Tax effect callout |
| `fa-house-crack` | `Building` | Vacancy risk |
| `fa-percent` | `Percent` | Interest rate risk |
| `fa-wrench` | `Wrench` | Maintenance |
| `fa-money-bill-trend-up` | `TrendingUp` | Cashflow tab icon |
| `fa-pen` | `Pencil` | Inline edit |
| `fa-plus` | `Plus` | Add new analysis |
| `fa-trash` | `Trash2` | Delete action |
| `fa-loader` | `Loader2` | Loading spinner (`animate-spin`) |

---

## 13. Self-Review Checklist (UI)

Before submitting any UI change, verify:

- [ ] All colors use semantic tokens (no raw hex values).
- [ ] All interactive elements use Shadcn components.
- [ ] All form inputs have associated `<Label>` elements.
- [ ] Focus states are visible and meet WCAG 2.1 AA.
- [ ] The layout is responsive across 360px–1440px.
- [ ] Animations use the specified durations and easings.
- [ ] Icons use Lucide React (no Font Awesome, no inline SVGs).
- [ ] All text uses `next-intl` translation keys (no hardcoded strings).
- [ ] `cn()` is used for conditional class merging.
- [ ] No magic values in utility classes.

---

## 14. Governance

The general **Devil's Advocate Protocol** (for both code and UI violations) is
defined in [`architecture.md`](architecture.md) §11. For UI-specific violations,
also cite the relevant section from this document.

The **Design System is Law.** All UI contributions must use the tokens,
components, and patterns defined in this document. Deviations require a spec
update approved before implementation.
