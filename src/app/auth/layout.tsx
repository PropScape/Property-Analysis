import { Building2 } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Shared layout for all /auth/* pages.
 *
 * @remarks
 * Centres the auth card on the slate-50 page background.
 * Does NOT include AppHeader — auth pages are intentionally header-free.
 *
 * See SPEC-AUTH v1.0.0 §6 for the visual spec.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      {/* Brand mark */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-600 text-white shadow-glow">
          <Building2 className="h-6 w-6" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-foreground">
          PropScape
        </span>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-[16px] border border-border bg-card p-8 shadow-card">
        {children}
      </div>
    </div>
  );
}
