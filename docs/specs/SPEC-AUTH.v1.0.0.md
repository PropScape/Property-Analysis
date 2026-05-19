---
id: SPEC-AUTH
version: 1.0.0
status: draft
created: 2026-05-19
author: AI Architect
---

# SPEC-AUTH — Supabase Authentication Integration

## 1. Overview

Implement email/password authentication using Supabase Auth (via `@supabase/ssr`).
Users must be authenticated before accessing any analysis. Unauthenticated
requests are redirected to `/auth/login`. After login, users are redirected
to `/` (the project overview page, SPEC-PROJECT-LIST).

This spec covers:
- Sign-up (email + password)
- Log-in (email + password)
- Log-out
- Route protection (middleware + server-side guard)
- Auth state in the UI (header user menu)

Social providers (Google, GitHub) and magic links are **out of scope for v1.0.0**.

---

## 2. Routes

| Route | Protection | Description |
|---|---|---|
| `/auth/login` | Public (redirect if authed) | Login page |
| `/auth/register` | Public (redirect if authed) | Sign-up page |
| `/auth/callback` | Public | Supabase PKCE callback handler |
| `/` | Protected | Project overview (redirect to login if unauthed) |
| `/analysis/[id]/*` | Protected | Analysis wizard steps (future) |

---

## 3. Acceptance Criteria (Gherkin)

### 3.1 Registration

```gherkin
Feature: User Registration

  Scenario: Successful registration
    GIVEN the user is on /auth/register
    WHEN they enter a valid email and password (min 8 chars)
    AND click "Registrieren"
    THEN a Supabase account is created
    AND the page shows a "Bitte bestätige deine E-Mail-Adresse" confirmation state
    AND no session is created until the email link is clicked

  Scenario: Login before email confirmed
    GIVEN the user registered but has NOT clicked the confirmation link
    WHEN they attempt to log in on /auth/login
    THEN an error "Bitte bestätige zuerst deine E-Mail-Adresse." is shown
    AND the user remains on /auth/login

  Scenario: Duplicate email
    GIVEN the user is on /auth/register
    WHEN they enter an email already registered
    AND click "Registrieren"
    THEN an inline error "Diese E-Mail-Adresse ist bereits registriert." is shown
    AND the user remains on /auth/register

  Scenario: Invalid password
    GIVEN the user is on /auth/register
    WHEN they enter a password shorter than 8 characters
    THEN a Zod validation error "Mindestens 8 Zeichen erforderlich." is shown inline
    AND the form is NOT submitted
```

### 3.2 Login

```gherkin
Feature: User Login

  Scenario: Successful login
    GIVEN the user is on /auth/login
    WHEN they enter valid credentials
    AND click "Anmelden"
    THEN the user is redirected to /
    AND the header displays the user's email

  Scenario: Invalid credentials
    GIVEN the user is on /auth/login
    WHEN they enter incorrect email or password
    AND click "Anmelden"
    THEN an error "E-Mail oder Passwort ist falsch." is shown
    AND the user remains on /auth/login

  Scenario: Already authenticated
    GIVEN the user is already logged in
    WHEN they navigate to /auth/login or /auth/register
    THEN they are redirected to /
```

### 3.3 Logout

```gherkin
Feature: User Logout

  Scenario: Successful logout
    GIVEN the user is authenticated
    WHEN they click the logout button in the header
    THEN supabase.auth.signOut() is called
    AND the user is redirected to /auth/login
    AND all protected routes require re-authentication
```

### 3.4 Route Protection

```gherkin
Feature: Route Protection

  Scenario: Unauthenticated access to protected route
    GIVEN the user is NOT authenticated
    WHEN they navigate to / or any /analysis/* route
    THEN they are redirected to /auth/login

  Scenario: Auth callback handling
    GIVEN the user has just registered or used a magic link
    WHEN Supabase redirects to /auth/callback?code=...
    THEN the code is exchanged for a session
    AND the user is redirected to /
```

---

## 4. Architecture

### 4.1 Server Actions (domain layer)

All auth mutations are **Server Actions** in `src/actions/auth.ts`. No Supabase
calls from Client Components.

```
src/actions/auth.ts
  - signUpAction(formData: FormData): Promise<ActionResult>
  - signInAction(formData: FormData): Promise<ActionResult>
  - signOutAction(): Promise<void>
```

`ActionResult` follows the existing typed Result pattern:
```typescript
type ActionResult =
  | { success: true }
  | { success: false; error: string }
```

### 4.2 Route Handler (callback)

```
src/app/auth/callback/route.ts   — Supabase PKCE code exchange
```

### 4.3 Pages (Server Components)

```
src/app/auth/login/page.tsx      — Login page (SSC, renders LoginForm)
src/app/auth/register/page.tsx   — Register page (SSC, renders RegisterForm)
src/app/auth/verify-email/page.tsx — Static "check your inbox" confirmation page
```

### 4.4 Client Components (form UI only)

```
src/components/auth/LoginForm.tsx
src/components/auth/RegisterForm.tsx
```

Forms use **`react-hook-form`** + **`@hookform/resolvers/zod`** for real-time
client-side validation. The same Zod schema also validates inside the Server
Action (defence in depth). On `handleSubmit`, the action is called via
`useTransition` — no full-page reload.

### 4.5 Middleware update

`src/middleware.ts` already calls `updateSession`. Add redirect logic:
- Unauthenticated → protected route: redirect to `/auth/login`
- Authenticated → auth route: redirect to `/`

### 4.6 AppHeader update

Add user avatar/email + logout button to `AppHeader` component.
Reads user from Server Component via `createClient().auth.getUser()`.

### 4.7 Supabase config update

Enable email confirmation in `supabase/config.toml`:
```toml
[auth.email]
enable_confirmations = true
```

The `/auth/callback` route already handles the PKCE code exchange, so
the confirmation link from Supabase's email will complete the session.

---

## 5. Validation Schema (Zod)

```typescript
// src/domain/auth/auth.schema.ts
const loginSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse."),
  password: z.string().min(1, "Passwort erforderlich."),
});

const registerSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse."),
  password: z.string().min(8, "Mindestens 8 Zeichen erforderlich."),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwörter stimmen nicht überein.",
  path: ["confirmPassword"],
});
```

---

## 6. UI Design

- **Layout:** Centered card (`max-w-md`) on `bg-slate-50` background.
- **Card:** `rounded-[16px] shadow-card p-8`.
- **Logo:** `Building2` Lucide icon + "PropScape" wordmark.
- **Inputs:** Shadcn `Input` + `Label` (email, password, confirm password).
- **CTA Button:** Full-width Shadcn `Button` variant `default` (navy).
- **Error display:** Inline below field via `text-sm text-destructive`.
- **Loading state:** Button shows `Loader2 animate-spin` while pending.
- **Navigation link:** "Noch kein Konto? Registrieren →" / "Bereits registriert? Anmelden →"
- **No magic values.** All spacing via design system tokens.

---

## 7. Files to Create / Modify

### New files
| File | Type |
|---|---|
| `src/actions/auth.ts` | Server Actions |
| `src/app/auth/login/page.tsx` | Server Component page |
| `src/app/auth/register/page.tsx` | Server Component page |
| `src/app/auth/verify-email/page.tsx` | Static confirmation page |
| `src/app/auth/callback/route.ts` | Route Handler |
| `src/components/auth/LoginForm.tsx` | Client Component |
| `src/components/auth/RegisterForm.tsx` | Client Component |
| `src/domain/auth/auth.schema.ts` | Zod schemas |

### Modified files
| File | Change |
|---|---|
| `src/middleware.ts` | Add redirect logic for protected/auth routes |
| `src/components/AppHeader.tsx` | Add user menu + logout button |
| `src/app/layout.tsx` | Add Toaster (Sonner) if not present |

### Test files
| File | Type |
|---|---|
| `src/__tests__/auth.schema.test.ts` | Vitest unit tests for Zod schemas |
| `e2e/auth.spec.ts` | Playwright E2E: login, register, logout, redirect |

---

## 8. Dependencies

| Package | Version | Reason |
|---|---|---|
| `react-hook-form` | latest | Real-time per-field validation |
| `@hookform/resolvers` | latest | Zod schema integration |

Install: `npm install react-hook-form @hookform/resolvers`

---

## 9. Out of Scope (v1.0.0)

- Social login (Google, GitHub)
- Magic link / OTP
- Password reset flow
- Account settings / profile page
- Resend confirmation email UI (Supabase handles this via the email template)
