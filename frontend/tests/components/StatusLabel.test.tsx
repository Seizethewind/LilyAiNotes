import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusLabel } from "~/components/documents/StatusLabel";

describe("StatusLabel", () => {
  it("renders explicit status text alongside semantic styling", () => {
    render(<StatusLabel status="verified" />);
    expect(screen.getByText("Verified")).toBeInTheDocument();

    render(<StatusLabel status="disputed" />);
    expect(screen.getByText("Disputed")).toBeInTheDocument();
  });
});
