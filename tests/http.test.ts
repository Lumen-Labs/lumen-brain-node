import { describe, expect, it } from "vitest";
import { BrainAPIError } from "../src/errors";
import { createClient, createMockFetch, jsonResponse } from "./helpers";

describe("HTTP auth and headers", () => {
  it("sends BrainPAT and Bearer plus X-Brain-ID by default", async () => {
    const { fetchImpl, calls } = createMockFetch(() =>
      jsonResponse({ text_context: "", triples: [] }),
    );
    const client = createClient(fetchImpl, { brainId: "workspace-a" });
    await client.retrieve.context({ text: "hello" });

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(
      "https://system.us-east1.brainapi.lumen-labs.ai/retrieve/context",
    );
    expect(calls[0]?.method).toBe("POST");
    expect(calls[0]?.headers.authorization).toBe("Bearer test-pat");
    expect(calls[0]?.headers.brainpat).toBe("test-pat");
    expect(calls[0]?.headers["x-brain-id"]).toBe("workspace-a");
    expect(calls[0]?.headers["content-type"]).toBe("application/json");
    expect(calls[0]?.headers.accept).toBe("application/json");
  });

  it("supports bearer-only and header-only auth schemes", async () => {
    const { fetchImpl: bearerFetch, calls: bearerCalls } = createMockFetch();
    await createClient(bearerFetch, { authScheme: "bearer" }).health();
    expect(bearerCalls[0]?.headers.authorization).toBe("Bearer test-pat");
    expect(bearerCalls[0]?.headers.brainpat).toBeUndefined();

    const { fetchImpl: headerFetch, calls: headerCalls } = createMockFetch();
    await createClient(headerFetch, { authScheme: "header" }).health();
    expect(headerCalls[0]?.headers.authorization).toBeUndefined();
    expect(headerCalls[0]?.headers.brainpat).toBe("test-pat");
  });

  it("omits X-Brain-ID on health, system, and login-info routes", async () => {
    const { fetchImpl, calls } = createMockFetch(() => jsonResponse({ status: "ok" }));
    const client = createClient(fetchImpl, { brainId: "workspace-a" });
    await client.health();
    await client.brains.list();
    await client.brains.create({ brain_id: "new-brain" });
    await client.meta.loginInfo();

    expect(calls).toHaveLength(4);
    expect(calls.map((call) => [call.method, new URL(call.url).pathname])).toEqual([
      ["GET", "/health"],
      ["GET", "/system/brains-list"],
      ["POST", "/system/brains"],
      ["GET", "/meta/login-info"],
    ]);
    expect(calls.every((call) => call.headers["x-brain-id"] === undefined)).toBe(true);
  });

  it("deletes a caller-supplied X-Brain-ID on exempt routes", async () => {
    const { fetchImpl, calls } = createMockFetch(() => jsonResponse({ status: "ok" }));
    await createClient(fetchImpl).health({
      headers: { "X-Brain-ID": "alpha" },
    });
    expect(calls[0]?.headers["x-brain-id"]).toBeUndefined();
  });

  it("rejects redirects so BrainPAT is not forwarded", async () => {
    const { fetchImpl, calls } = createMockFetch(() => jsonResponse({ status: "ok" }));
    await createClient(fetchImpl).health();
    expect(calls[0]?.redirect).toBe("error");
  });

  it("omits X-Brain-ID when the caller did not set a brain id", async () => {
    const { fetchImpl, calls } = createMockFetch(() =>
      jsonResponse({ text_context: "", triples: [] }),
    );
    await createClient(fetchImpl).retrieve.context({ text: "hello" });
    expect(calls[0]?.headers["x-brain-id"]).toBeUndefined();
  });

  it("allows a per-call X-Brain-ID override", async () => {
    const { fetchImpl, calls } = createMockFetch(() =>
      jsonResponse({ facts: [], total: 0 }),
    );
    const client = createClient(fetchImpl, { brainId: "default-brain" });
    await client.facts.list({ state: "unverified" }, { brainId: "other-brain" });
    expect(calls[0]?.headers["x-brain-id"]).toBe("other-brain");
  });

  it("clones a client with withBrain", async () => {
    const { fetchImpl, calls } = createMockFetch(() =>
      jsonResponse({ facts: [], total: 0 }),
    );
    const client = createClient(fetchImpl, { brainId: "alpha" });
    await client.withBrain("beta").facts.list();
    expect(calls[0]?.headers["x-brain-id"]).toBe("beta");
    expect(client.brainId).toBe("alpha");
  });

  it("omits undefined JSON fields", async () => {
    const { fetchImpl, calls } = createMockFetch(() =>
      jsonResponse({ text_context: "", triples: [] }),
    );
    await createClient(fetchImpl).retrieve.context({
      text: "now",
      as_of: undefined,
      max_facts: 8,
    });
    expect(calls[0]?.body).toEqual({ text: "now", max_facts: 8 });
  });

  it("wraps timeouts as BrainAPIError", async () => {
    const fetchImpl: typeof fetch = (_input, init) =>
      new Promise((_, reject) => {
        const abort = () => {
          const error = new Error("aborted");
          error.name = "AbortError";
          reject(error);
        };
        if (init?.signal?.aborted) {
          abort();
          return;
        }
        init?.signal?.addEventListener("abort", abort, { once: true });
      });
    const client = createClient(fetchImpl, { timeoutMs: 20 });
    await expect(client.health()).rejects.toMatchObject({
      name: "BrainAPIError",
      code: "REQUEST_ABORTED",
    });
  });

  it("classifies a caller abort reason as REQUEST_ABORTED", async () => {
    const reason = new Error("cancelled");
    const fetchImpl: typeof fetch = async (_input, init) => {
      if (init?.signal?.aborted) {
        throw init.signal.reason;
      }
      return await new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), {
          once: true,
        });
      });
    };
    const controller = new AbortController();
    const pending = createClient(fetchImpl).health({ signal: controller.signal });
    controller.abort(reason);
    await expect(pending).rejects.toMatchObject({
      name: "BrainAPIError",
      code: "REQUEST_ABORTED",
    });
  });

  it("wraps network failures", async () => {
    const fetchImpl: typeof fetch = async () => {
      throw new TypeError("fetch failed");
    };
    await expect(createClient(fetchImpl).health()).rejects.toBeInstanceOf(BrainAPIError);
  });

  it("uses a custom baseUrl instead of a region", async () => {
    const { fetchImpl, calls } = createMockFetch(() => jsonResponse({ status: "ok" }));
    await createClient(fetchImpl, {
      region: undefined,
      baseUrl: "https://brain.internal.example",
    }).health();
    expect(calls[0]?.url).toBe("https://brain.internal.example/health");
  });
});
