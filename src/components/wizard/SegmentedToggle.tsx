"use client";

import { cn } from "@/lib/utils";

interface SegmentedToggleOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedToggleProps<T extends string> {
  /** Unique name attribute for the underlying radio group. */
  name: string;
  options: SegmentedToggleOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  /** Optional aria label for the group. */
  label?: string;
  /** Optional additional class names on the outer container. */
  className?: string;
}

/**
 * Segmented radio-button control ("pill toggle").
 *
 * @remarks
 * Renders a `<fieldset>` with a pill-shaped container. The selected option
 * gets a white background and shadow; inactive options show as plain text.
 * Uses real hidden radio inputs for full keyboard / screen-reader support.
 *
 * Used for binary or small-set choices: Vermietet / Leerstehend / Eigennutzung.
 *
 * See design-system.md §10.3 (Segmented Toggle).
 */
export function SegmentedToggle<T extends string>({
  name,
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedToggleProps<T>) {
  return (
    <fieldset aria-label={label} className="border-none p-0 m-0">
      <div
        className={cn(
          "inline-flex p-1 bg-slate-100 rounded-lg",
          className
        )}
      >
        {options.map((option) => {
          const isSelected = option.value === value;
          const inputId = `toggle-${name}-${option.value}`;

          return (
            <label
              key={option.value}
              htmlFor={inputId}
              className="cursor-pointer"
            >
              <input
                id={inputId}
                type="radio"
                name={name}
                value={option.value}
                checked={isSelected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <div
                className={cn(
                  "px-5 py-2 rounded-md text-sm font-medium text-center",
                  "transition-all duration-150 ease-in-out",
                  isSelected
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {option.label}
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
