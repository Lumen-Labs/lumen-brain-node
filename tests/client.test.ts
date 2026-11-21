import { describe, expect, it } from "vitest";
import { BrainAPI, LumenBrain } from "../src/index";
import { BrainAPIError } from "../src/errors";
import { createClient, createMockFetch, jsonResponse } from "./helpers";

const accepted = { message: "queued", task_id: "task-1" };

describe("BrainAPI resources", () => {
  it("exports LumenBrain as an alias", () => {
    expect(LumenBrain).toBe(BrainAPI);
  });

  it("ingests text, json, url, file, and structured data", async () => {
    const { fetchImpl, calls } = createMockFetch(() => jsonResponse(accepted));
    const client = createClient(fetchImpl);

    await client.ingest.text("remember this");
    expect(calls[0]?.url).toMatch(/\/ingest\/$/);
    expect(calls[0]?.body).toEqual({
      data: { data_type: "text", text_data: "remember this" },
    });

    await client.ingest.json({ json_data: { kind: "note", body: "hi" } });
    expect(calls[1]?.body).toEqual({
      json_data: { kind: "note", body: "hi" },
      data: { data_type: "json", json_data: { kind: "note", body: "hi" } },
    });

    await client.ingest.url("https://example.test/doc");
    expect(calls[2]?.url).toMatch(/\/ingest\/url$/);
    expect(calls[2]?.body).toEqual({ url: "https://example.test/doc" });

    await client.ingest.file({
      file: new Blob(["hello"], { type: "text/plain" }),
      filename: "note.txt",
      group_tracking: "batch-1",
    });
    expect(calls[3]?.url).toMatch(/\/ingest\/file$/);
    expect(calls[3]?.form).toBeInstanceOf(FormData);
    expect(calls[3]?.form?.get("group_tracking")).toBe("batch-1");
    expect(calls[3]?.headers["content-type"]).toBeUndefined();

    await client.ingest.structured({
      data: [{ object: { type: "Person", name: "Ada" } }],
    });
    expect(calls[4]?.url).toMatch(/\/ingest\/structured$/);

    await client.ingest.structuredBatch({
      data: [{ object: { type: "Person", name: "Ada" } }],
    });
    expect(calls[5]?.url).toMatch(/\/ingest\/structured\/batch$/);
  });

  it("retrieves context, search, and query with as_of", async () => {
    const { fetchImpl, calls } = createMockFetch((call) => {
      if (call.url.includes("/retrieve/context")) {
        return jsonResponse({
          text_context: "Ada invented punch cards.",
          triples: [],
          validity_unknown_count: 0,
        });
      }
      if (call.url.includes("/retrieve/search")) {
        return jsonResponse({ hits: [] });
      }
      return jsonResponse({ results: [] });
    });
    const client = createClient(fetchImpl);

    const context = await client.query({
      text: "Who is Ada?",
      as_of: "2024-01-01T00:00:00Z",
      include_validity_unknown: true,
    });
    expect(context.text_context).toContain("Ada");
    expect(calls[0]?.body).toMatchObject({
      text: "Who is Ada?",
      as_of: "2024-01-01T00:00:00Z",
      include_validity_unknown: true,
    });

    await client.retrieve.search({
      query: "Ada",
      as_of: "2024-06-01T00:00:00Z",
      channels: ["graph", "chunks"],
      k: 5,
    });
    expect(calls[1]?.method).toBe("POST");
    expect(calls[1]?.body).toMatchObject({
      query: "Ada",
      as_of: "2024-06-01T00:00:00Z",
      channels: ["graph", "chunks"],
    });

    await client.retrieve.searchGet({
      query: "Ada",
      as_of: "2024-06-01T00:00:00Z",
      channels: ["graph"],
    });
    expect(calls[2]?.method).toBe("GET");
    expect(calls[2]?.url).toContain("as_of=2024-06-01T00%3A00%3A00Z");
    expect(calls[2]?.url).toContain("channels=graph");

    await client.retrieve.query({
      text: "Ada",
      as_of: "2024-01-01T00:00:00Z",
      include_validity_unknown: false,
    });
    expect(calls[3]?.url).toContain("/retrieve/?");
    expect(calls[3]?.url).toContain("text=Ada");
  });

  it("covers remaining retrieve endpoints", async () => {
    const { fetchImpl, calls } = createMockFetch(() => jsonResponse({ ok: true }));
    const client = createClient(fetchImpl);

    await client.retrieve.entityStatus("Ada");
    await client.retrieve.entityInfo({ name: "Ada" });
    await client.retrieve.entityContext({ name: "Ada" });
    await client.retrieve.synergies({ target: "Ada", top_k: 3 });
    await client.retrieve.recommend({ target: "Ada" });
    await client.retrieve.neighbors({ entity_id: "node-1", looking_for: "Person" });
    await client.retrieve.neighbors({
      identification_params: { name: "Ada" },
      looking_for: "Project",
    });
    await client.retrieve.relationships({ limit: 10 });
    await client.retrieve.entities({ skip: 0 });
    await client.retrieve.observations({ labels: "quote" });
    await client.retrieve.observation("obs-1");
    await client.retrieve.observationLabels();
    await client.retrieve.textChunks();
    await client.retrieve.structuredData({ types: "invoice" });
    await client.retrieve.structuredDataById("sd-1");
    await client.retrieve.structuredDataTypes();
    await client.retrieve.hops({ from: "a", to: "b" });
    await client.retrieve.changelogs({ since: "2024-01-01" });
    await client.retrieve.changelog("cl-1");
    await client.retrieve.changelogTypes();
    await client.retrieve.vectorStores();
    await client.retrieve.vectors("chunks", { limit: 2 });
    await client.retrieve.exploreOverview();
    await client.retrieve.exploreCommunity("c1");
    await client.retrieve.exploreNeighbors("n1");

    const paths = calls.map((call) => new URL(call.url).pathname);
    expect(paths).toEqual([
      "/retrieve/entity/status",
      "/retrieve/entity/info",
      "/retrieve/entity/context",
      "/retrieve/entity/synergies",
      "/retrieve/recommend",
      "/retrieve/entities/neighbors",
      "/retrieve/entities/neighbors",
      "/retrieve/relationships",
      "/retrieve/entities",
      "/retrieve/observations",
      "/retrieve/observations/obs-1",
      "/retrieve/observations/labels",
      "/retrieve/text-chunks",
      "/retrieve/structured-data",
      "/retrieve/structured-data/sd-1",
      "/retrieve/structured-data/types",
      "/retrieve/hops",
      "/retrieve/changelogs",
      "/retrieve/changelogs/cl-1",
      "/retrieve/changelogs/types",
      "/retrieve/vectors/stores",
      "/retrieve/vectors/chunks",
      "/retrieve/explore/v1/overview",
      "/retrieve/explore/v1/communities/c1",
      "/retrieve/explore/v1/neighbors/n1",
    ]);
    expect(calls[5]?.method).toBe("GET");
    expect(calls[6]?.method).toBe("POST");
    expect(calls[6]?.body).toMatchObject({
      identification_params: { name: "Ada" },
    });
  });

  it("verifies, rejects, and resets facts", async () => {
    const { fetchImpl, calls } = createMockFetch(() =>
      jsonResponse({
        kind: "relationship",
        fact_id: "f1",
        verification: { state: "verified" },
      }),
    );
    const client = createClient(fetchImpl);
    await client.facts.list({ state: "unverified", limit: 20 });
    await client.facts.get("f1");
    await client.facts.verify("f1", { verified_by: "reviewer", note: "ok" });
    await client.facts.reject("f1", { note: "stale" });
    await client.facts.reset("f1");

    expect(calls[0]?.url).toContain("/model/facts?");
    expect(calls[0]?.url).toContain("state=unverified");
    expect(calls[1]?.url).toMatch(/\/model\/facts\/f1$/);
    expect(calls[2]?.method).toBe("POST");
    expect(calls[2]?.url).toMatch(/\/verify$/);
    expect(calls[2]?.body).toEqual({ verified_by: "reviewer", note: "ok" });
    expect(calls[3]?.url).toMatch(/\/reject$/);
    expect(calls[4]?.url).toMatch(/\/reset$/);
  });

  it("lists, scans, resolves, and dismisses conflicts", async () => {
    const { fetchImpl, calls } = createMockFetch(() =>
      jsonResponse({ message: "ok", conflicts: [], count: 0, total: 0, task_id: "t" }),
    );
    const client = createClient(fetchImpl);
    await client.conflicts.list({ status: "open" });
    await client.conflicts.get("c1");
    await client.conflicts.report({ format: "markdown" });
    await client.conflicts.scan({ use_llm: false });
    await client.conflicts.resolve("c1", { winning_fact_id: "f1" });
    await client.conflicts.dismiss("c1", { notes: "duplicate" });

    expect(calls[0]?.url).toContain("/retrieve/conflicts?");
    expect(calls[1]?.url).toMatch(/\/retrieve\/conflicts\/c1$/);
    expect(calls[2]?.url).toContain("/retrieve/conflicts/report");
    expect(calls[3]?.method).toBe("POST");
    expect(calls[3]?.url).toMatch(/\/scan$/);
    expect(calls[4]?.url).toMatch(/\/resolve$/);
    expect(calls[5]?.url).toMatch(/\/dismiss$/);
  });

  it("mutates graph entities and relationships", async () => {
    const { fetchImpl, calls } = createMockFetch(() => jsonResponse({ ok: true }));
    const client = createClient(fetchImpl);
    await client.graph.addEntity({ name: "Ada", labels: ["Person"] });
    await client.graph.updateEntity({ uuid: "n1", new_name: "Ada Lovelace" });
    await client.graph.addRelationship({
      subject_uuid: "n1",
      predicate_name: "invented",
      predicate_description: "created",
      object_uuid: "n2",
    });
    await client.graph.updateRelationship({ uuid: "r1", new_properties: { weight: 1 } });

    expect(calls.map((call) => [call.method, new URL(call.url).pathname])).toEqual([
      ["POST", "/model/entity"],
      ["PUT", "/model/entity"],
      ["POST", "/model/relationship"],
      ["PUT", "/model/relationship"],
    ]);
  });

  it("manages tasks including cancel, purge, and wait", async () => {
    let polls = 0;
    const { fetchImpl, calls } = createMockFetch((call) => {
      if (call.url.endsWith("/tasks/task-1") && call.method === "GET") {
        polls += 1;
        return jsonResponse({
          task_id: "task-1",
          status: polls < 2 ? "running" : "completed",
        });
      }
      if (call.url.endsWith("/cancel")) {
        return jsonResponse({
          task_id: "task-1",
          mode: "keep_saved",
          status: "cancelling",
        });
      }
      return jsonResponse({ tasks: [], ok: true });
    });
    const client = createClient(fetchImpl);

    await client.tasks.list();
    await client.tasks.activity("task-1", { limit: 10 });
    await client.tasks.cancel("task-1", { mode: "keep_saved" });
    await client.tasks.purge("task-1", { source_key: "doc-1" });
    const done = await client.tasks.wait("task-1", { intervalMs: 1, timeoutMs: 1000 });

    expect(done.status).toBe("completed");
    expect(calls.some((call) => call.url.endsWith("/tasks/"))).toBe(true);
    expect(calls.some((call) => call.url.endsWith("/tasks/task-1/cancel"))).toBe(true);
    expect(calls.some((call) => call.url.endsWith("/tasks/task-1/purge"))).toBe(true);
    expect(polls).toBe(2);
  });

  it("times out while waiting for a task", async () => {
    const { fetchImpl } = createMockFetch(() =>
      jsonResponse({ task_id: "slow", status: "running" }),
    );
    await expect(
      createClient(fetchImpl).waitForTask("slow", { intervalMs: 5, timeoutMs: 20 }),
    ).rejects.toMatchObject({
      name: "BrainAPIError",
      code: "TASK_TIMEOUT",
    });
  });

  it("covers brains and meta helpers", async () => {
    const { fetchImpl, calls } = createMockFetch((call) => {
      if (call.url.endsWith("/system/brains-list")) {
        return jsonResponse({ brains: [{ name_key: "default" }] });
      }
      return jsonResponse({ success: true, brain_id: "b1", operation: "clear" });
    });
    const client = createClient(fetchImpl, { brainId: "workspace-a" });
    expect(await client.brains.list()).toEqual([{ name_key: "default" }]);
    await client.brains.clear("b1");
    await client.brains.delete("b1");
    await client.meta.entityLabels();
    await client.meta.entityProperties();
    await client.meta.relationshipProperties();
    await client.meta.ingestGroup("g1");
    await client.meta.ingestionCapabilities();

    expect(calls[1]?.url).toMatch(/\/system\/brains\/b1\/clear$/);
    expect(calls[1]?.headers["x-brain-id"]).toBeUndefined();
    expect(calls[2]?.method).toBe("DELETE");
    expect(calls[7]?.url).toMatch(/\/meta\/ingestion-capabilities$/);
  });
});

describe("error paths", () => {
  it("surfaces TASK_TIMEOUT as BrainAPIError", () => {
    expect(new BrainAPIError("x", { status: 0, code: "TASK_TIMEOUT" }).code).toBe(
      "TASK_TIMEOUT",
    );
  });
});
