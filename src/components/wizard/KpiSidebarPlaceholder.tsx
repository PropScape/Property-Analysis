import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";

interface KpiSidebarPlaceholderProps {
  /** KPI label shown above the blurred value. */
  label: string;
  /** Helper text shown below the blurred value. */
  helperText: string;
  /** Decorative background icon (Lucide). */
  icon: ReactNode;
  /** Optional additional class names. */
  className?: string;
}

/**
 * Locked, blurred KPI placeholder card for the wizard desktop sidebars.
 *
 * @remarks
 * Shown at 50% opacity in the left and right sidebars of each wizard step.
 * The value is intentionally blurred (`blur-[2px]`) and non-selectable to
 * signal that it will unlock as the user completes more steps.
 *
 * Rendered only on desktop (`hidden lg:flex` on the parent `<aside>`).
 *
 * See HTML mockup "2-Real Estate - General Property.html" sidebar section.
 * See design-system.md §1 (Progressive Disclosure).
 */
export function KpiSidebarPlaceholder({
  label,
  helperText,
  icon,
  className,
}: KpiSidebarPlaceholderProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl p-5 shadow-sm border border-slate-100",
        "relative overflow-hidden",
        className
      )}
    >
      {/* Decorative background icon */}
      <div
        className="absolute top-0 right-0 p-4 opacity-10 text-slate-400"
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* Label */}
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
        {label}
      </h3>

      {/* Blurred value placeholder */}
      <div
        className="text-3xl font-bold text-slate-300 blur-[2px] select-none"
        aria-hidden="true"
      >
        --,-- %
      </div>

      {/* Helper */}
      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
        <Lock className="w-2.5 h-2.5" aria-hidden="true" />
        {helperText}
      </p>
    </div>
  );
}
