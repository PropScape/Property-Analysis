import { cn } from "@/lib/utils";

/** Analysis status — mirrors the DB enum `analysis_status`. */
type AnalysisStatus = "draft" | "completed";

interface StatusBadgeProps {
  status: AnalysisStatus;
  className?: string;
}

const variants: Record<
  AnalysisStatus,
  { label: string; className: string }
> = {
  completed: {
    label: "Abgeschlossen",
    className: "bg-emerald-50 text-emerald-600",
  },
  draft: {
    label: "Entwurf",
    className: "bg-amber-100 text-amber-700",
  },
};

/**
 * Status badge for analysis cards.
 *
 * @remarks
 * Uses semantic colors from the design system (emerald for completed,
 * amber for draft). Pill-shaped with small text.
 *
 * See docs/design-system.md §4.4 for styling reference.
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = variants[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant.className,
        className
      )}
      aria-label={`Status: ${variant.label}`}
    >
      {variant.label}
    </span>
  );
}
