import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatCardProps {
  /** The numeric count to display prominently */
  count: number;
  /** Label describing what the count represents */
  label: string;
  /** Optional trailing element (e.g. a StatusBadge) */
  trailing?: ReactNode;
  className?: string;
}

/**
 * Summary statistic card for the project overview.
 *
 * @remarks
 * Displays a large count with a label below. Used in a 3-column
 * row to show total analyses, completed count, and draft count.
 *
 * See SPEC-PROJECT-LIST §4.1 for layout reference.
 */
export function StatCard({ count, label, trailing, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-sm",
        className
      )}
    >
      <div>
        <p className="text-2xl font-bold text-foreground">{count}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      {trailing}
    </div>
  );
}
