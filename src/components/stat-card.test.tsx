import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "@/components/stat-card";

describe("StatCard", () => {
  it("renders count and label", () => {
    render(<StatCard count={5} label="Analysen" />);

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Analysen")).toBeInTheDocument();
  });

  it("renders zero count", () => {
    render(<StatCard count={0} label="Entwurf" />);

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("Entwurf")).toBeInTheDocument();
  });

  it("renders trailing element when provided", () => {
    render(
      <StatCard
        count={3}
        label="Abgeschlossen"
        trailing={<span data-testid="trailing">Badge</span>}
      />
    );

    expect(screen.getByTestId("trailing")).toBeInTheDocument();
  });

  it("does not render trailing element when not provided", () => {
    const { container } = render(<StatCard count={1} label="Test" />);

    // Should only contain the count and label divs
    const children = container.firstElementChild?.children;
    expect(children?.length).toBe(1);
  });

  it("merges additional className", () => {
    const { container } = render(
      <StatCard count={1} label="Test" className="mt-4" />
    );

    expect(container.firstElementChild?.className).toContain("mt-4");
  });
});
