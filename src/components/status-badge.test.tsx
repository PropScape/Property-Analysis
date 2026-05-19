import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/status-badge";

describe("StatusBadge", () => {
  it("renders 'Abgeschlossen' for completed status", () => {
    render(<StatusBadge status="completed" />);

    const badge = screen.getByText("Abgeschlossen");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("aria-label", "Status: Abgeschlossen");
  });

  it("renders 'Entwurf' for draft status", () => {
    render(<StatusBadge status="draft" />);

    const badge = screen.getByText("Entwurf");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("aria-label", "Status: Entwurf");
  });

  it("applies emerald classes for completed status", () => {
    render(<StatusBadge status="completed" />);

    const badge = screen.getByText("Abgeschlossen");
    expect(badge.className).toContain("bg-emerald-50");
    expect(badge.className).toContain("text-emerald-600");
  });

  it("applies amber classes for draft status", () => {
    render(<StatusBadge status="draft" />);

    const badge = screen.getByText("Entwurf");
    expect(badge.className).toContain("bg-amber-100");
    expect(badge.className).toContain("text-amber-700");
  });

  it("merges additional className", () => {
    render(<StatusBadge status="completed" className="mt-2" />);

    const badge = screen.getByText("Abgeschlossen");
    expect(badge.className).toContain("mt-2");
  });
});
