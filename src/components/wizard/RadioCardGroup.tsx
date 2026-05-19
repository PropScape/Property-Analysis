"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface RadioCardOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  icon?: ReactNode;
}

interface RadioCardGroupProps<T extends string> {
  /** Unique name attribute for the radio group. */
  name: string;
  /** All available options. */
  options: RadioCardOption<T>[];
  /** The currently selected value. */
  value: T | undefined;
  /** Called when the user selects a different option. */
  onChange: (value: T) => void;
  /** Optional aria label for the group. */
  label?: string;
  /** Optional additional class names on the grid container. */
  className?: string;
}

/**
 * Card-style radio button group.
 *
 * @remarks
 * Renders a CSS grid of visually-rich radio cards. Each card is a real
 * `<input type="radio">` element (screen-reader accessible) with the
 * visual affordance hidden in favour of the card border/background state.
 *
 * Selected state: `border-navy-600 bg-navy-50 shadow-glow`
 * Hover state:    `hover:border-navy-200`
 *
 * See design-system.md §10.2 (Radio Card Group), §9 (interactive states).
 */
export function RadioCardGroup<T extends string>({
  name,
  options,
  value,
  onChange,
  label,
  className,
}: RadioCardGroupProps<T>) {
  return (
    <fieldset aria-label={label} className="border-none p-0 m-0">
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3",
          className
        )}
      >
        {options.map((option) => {
          const isSelected = option.value === value;
          const inputId = `radio-${name}-${option.value}`;

          return (
            <label
              key={option.value}
              htmlFor={inputId}
              className={cn(
                // Base card
                "relative flex flex-col gap-2 rounded-xl border p-5 cursor-pointer",
                "transition-all duration-200 ease-in-out",
                // Default state
                "border-slate-200 bg-white",
                // Hover
                "hover:border-navy-200",
                // Selected state
                isSelected &&
                  "border-navy-600 bg-navy-50 shadow-[0_0_0_1px_rgba(30,58,138,0.15),0_0_16px_rgba(30,58,138,0.1)]"
              )}
            >
              {/* Hidden real radio input (accessible) */}
              <input
                id={inputId}
                type="radio"
                name={name}
                value={option.value}
                checked={isSelected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />

              {/* Icon */}
              {option.icon && (
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    "transition-colors duration-200",
                    isSelected
                      ? "bg-navy-600 text-white"
                      : "bg-slate-100 text-slate-500"
                  )}
                  aria-hidden="true"
                >
                  {option.icon}
                </div>
              )}

              {/* Text */}
              <div>
                <p
                  className={cn(
                    "text-sm font-semibold leading-snug",
                    isSelected ? "text-navy-600" : "text-slate-900"
                  )}
                >
                  {option.label}
                </p>
                {option.description && (
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {option.description}
                  </p>
                )}
              </div>

              {/* Selection indicator dot */}
              <div
                className={cn(
                  "absolute top-3 right-3 w-3.5 h-3.5 rounded-full border-2",
                  "transition-all duration-200",
                  isSelected
                    ? "border-navy-600 bg-navy-600"
                    : "border-slate-300 bg-white"
                )}
                aria-hidden="true"
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
