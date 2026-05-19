"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Lightbulb, ChevronDown } from "lucide-react";

interface HelpAccordionProps {
  /** Accordion trigger label. */
  triggerLabel?: string;
  children: React.ReactNode;
  /** Optional additional class names on the outer container. */
  className?: string;
}

/**
 * Collapsible inline help accordion.
 *
 * @remarks
 * Follows the design in the HTML mockup: navy-50 background, lightbulb icon,
 * chevron that rotates 180° when open. CSS max-height transition for smooth
 * open/close animation.
 *
 * Content is passed as `children` so each step can provide its own copy.
 * Closed by default.
 *
 * See SPEC-WIZARD-STEP2 v1.0.0 AC-6.
 */
export function HelpAccordion({
  triggerLabel = "Warum brauchen wir diese Daten?",
  children,
  className,
}: HelpAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={cn(
        "border border-navy-100 rounded-xl overflow-hidden bg-navy-50/30",
        className
      )}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-5 py-3 flex items-center justify-between hover:bg-navy-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-navy-500" aria-hidden="true" />
          <span className="font-medium text-sm text-navy-900">
            {triggerLabel}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-navy-400 transition-transform duration-300",
            isOpen && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {/* Animated content panel */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
        aria-hidden={!isOpen}
      >
        <div className="px-5 py-4 bg-white border-t border-navy-100/50 text-sm text-slate-600 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}
