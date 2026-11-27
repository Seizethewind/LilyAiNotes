import { describe, expect, it, vi } from "vitest";

import { ApiClientError, apiRequest } from "~/services/api/apiClient";

describe("apiRequest", () => {
  it("parses structured backend error envelopes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ error: { code: "secret_detected", message: "Key blocked" } }),
          { status: 422 },
        ),
      ),
    );

    await expect(apiRequest("/notes", { method: "POST", body: {} })).rejects.toMatchObject({
      name: "Error",
      code: "secret_detected",
      status: 422,
    });

    vi.unstubAllGlobals();
  });

  it("throws network_unreachable when fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    try {
      await apiRequest("/health");
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(ApiClientError);
      expect((err as ApiClientError).code).toBe("network_unreachable");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
