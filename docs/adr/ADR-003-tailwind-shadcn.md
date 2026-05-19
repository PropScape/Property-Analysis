# ADR-003: Tailwind CSS v4 + Shadcn UI (New York Style)

> **Status:** Accepted
> **Date:** 2026-05-18
> **Deciders:** Dennis Mende (Owner), AI Architect

## Context

The PropScape UI follows a glassmorphism-inspired, professional design language
with a navy/slate color palette, Inter typography, layered glass panels, and
subtle glow effects. The design was prototyped in 16 HTML mockups using Tailwind
CSS. A component library is needed that provides accessible, composable
primitives consistent with this aesthetic.

## Decision

Use **Tailwind CSS v4** for utility-first styling and **Shadcn UI** (new-york
style) for the component library. All design tokens are defined as CSS custom
properties in `globals.css`. The design system is documented in
`docs/design-system.md`.

## Rationale

- **Tailwind v4** provides:
  - CSS-first configuration (no `tailwind.config.js`).
  - Native CSS custom properties for theming.
  - Excellent performance (single CSS layer, no JS runtime).
- **Shadcn UI** provides:
  - Copy-paste components (not a dependency — full ownership).
  - Built on Radix UI primitives (accessible, composable).
  - `new-york` style aligns with the professional, high-contrast aesthetic.
  - `cn()` utility for conditional class merging.
- **Design system enforcement:** All color, spacing, and shadow values are
  semantic tokens. No magic values (`p-[13px]`, `color: #333`) are permitted.
- Consistent with the reference project (tonies-collection).

## Alternatives Considered

| Alternative | Pros | Cons |
|---|---|---|
| Material UI (MUI) | Comprehensive, good docs | Opinionated styling, heavy runtime CSS-in-JS |
| Chakra UI | Great DX, accessible | Runtime CSS-in-JS, larger bundle |
| Radix UI (bare) | Maximum flexibility | No styling — would need to build everything |
| Mantine | Batteries-included | Opinionated, less Tailwind-compatible |

## Consequences

### Positive

- Full ownership of component source code — no version lock-in.
- Semantic tokens ensure design consistency across the application.
- Tailwind v4's CSS-first approach eliminates configuration complexity.
- Shadcn Charts (built on Recharts) integrates natively for the dashboard.

### Negative

- Shadcn components must be maintained manually when upstream updates occur.
  Mitigated by the Shadcn CLI's `diff` command.
- No automatic design system enforcement in CI — relies on code review and
  agent rules.

### Risks

- Design drift if developers add ad-hoc utility classes. Mitigated by the
  styling constraints in `docs/design-system.md` and the Frontend Agent
  persona in `.gemini/GEMINI.md`.

## References

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com)
- [`docs/design-system.md`](../design-system.md) — full token reference
