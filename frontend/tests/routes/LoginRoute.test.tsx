import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SessionProvider } from "~/context/SessionContext";
import LoginRoute from "~/routes/login";

vi.mock("@remix-run/react", () => ({
  useNavigate: () => vi.fn(),
}));

describe("LoginRoute", () => {
  it("renders sign in and workspace registration toggles", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { code: "unauthorized" } }), { status: 401 }),
      ),
    );

    render(
      <SessionProvider>
        <LoginRoute />
      </SessionProvider>,
    );

    expect(screen.getByRole("heading", { name: "LilyAiDataNotes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Workspace" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
