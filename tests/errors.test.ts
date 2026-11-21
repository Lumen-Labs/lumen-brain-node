import { describe, expect, it } from "vitest";
import { BrainAPIError } from "../src/errors";
import { createClient, createMockFetch, jsonResponse } from "./helpers";

describe("BrainAPIError", () => {
  it("parses the v2 ErrorResponse envelope", () => {
    const error = BrainAPIError.fromResponse(
      403,
      {
        detail: "brain isolation required",
        error: {
          code: "BRAIN_ISOLATION_REQUIRED",
          message: "X-Brain-ID is required",
          resolution: "Pass X-Brain-ID",
          request_id: "req-1",
        },
      },
      "header-id",
    );
    expect(error).toBeInstanceOf(BrainAPIError);
    expect(error.status).toBe(403);
    expect(error.code).toBe("BRAIN_ISOLATION_REQUIRED");
    expect(error.message).toBe("X-Brain-ID is required");
    expect(error.resolution).toBe("Pass X-Brain-ID");
    expect(error.requestId).toBe("req-1");
    expect(error.detail).toBe("brain isolation required");
  });

  it("falls back to detail strings and status", () => {
    expect(BrainAPIError.fromResponse(500, { detail: "boom" }).message).toBe("boom");
    expect(BrainAPIError.fromResponse(502, "gateway").message).toBe(
      "BrainAPI request failed (502)",
    );
  });

  it("is thrown by the client on non-2xx responses", async () => {
    const { fetchImpl } = createMockFetch(() =>
      jsonResponse(
        {
          error: {
            code: "NOT_FOUND",
            message: "fact missing",
            resolution: "list facts",
            request_id: "abc",
          },
        },
        404,
        { "X-Request-ID": "hdr" },
      ),
    );
    const client = createClient(fetchImpl);
    await expect(client.facts.get("missing")).rejects.toMatchObject({
      name: "BrainAPIError",
      status: 404,
      code: "NOT_FOUND",
      message: "fact missing",
      requestId: "abc",
    });
  });
});
