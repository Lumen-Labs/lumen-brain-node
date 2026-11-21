# @lumenlabs/lumen-brain

TypeScript SDK for [BrainAPI](https://brainapi.lumen-labs.ai) v2.

The client talks to a regional BrainAPI host with a personal access token (BrainPAT) and an `X-Brain-ID` workspace. It covers ingest, retrieve/search/context (including `as_of` / validity), chat-style context queries, fact verification, conflicts, and graph entity/relationship endpoints.

## Installation

```bash
npm install @lumenlabs/lumen-brain
```

Node.js 18 or later is required (`fetch` is used by default).

## Quick start

```ts
import { BrainAPI } from "@lumenlabs/lumen-brain";

const brain = new BrainAPI({
  pat: process.env.BRAIN_PAT!,
  region: "us-east1",
  brainId: process.env.BRAIN_ID!,
});

const ingested = await brain.ingest.text("Ada Lovelace wrote the first algorithm.");
await brain.tasks.wait(ingested.task_id);

const context = await brain.query({
  text: "Who wrote the first algorithm?",
  as_of: "2024-06-01T00:00:00Z",
  include_validity_unknown: true,
});

console.log(context.text_context);
```

`LumenBrain` is an alias of `BrainAPI` if you prefer that name.

## Configuration

Provide **either** `region` **or** `baseUrl`. There is no silent default host.

| Option | Description |
| --- | --- |
| `pat` | BrainAPI personal access token (required) |
| `region` | Hosted region, for example `us-east1` or `europe-central2` |
| `baseUrl` | Full origin for self-hosted or custom endpoints |
| `brainId` | Workspace sent as `X-Brain-ID`. Omitted unless you set it on the client or the call |
| `authScheme` | `both` (default), `bearer`, or `header` |
| `fetch` | Custom `fetch` implementation |
| `timeoutMs` | Request timeout |
| `userAgent` | Override the SDK `User-Agent` |
| `allowHttp` | Opt in to plaintext `http://` base URLs (rejected by default) |

Hosted regional URL:

```text
https://system.<region>.brainapi.lumen-labs.ai
```

```ts
import { regionalBaseUrl } from "@lumenlabs/lumen-brain";

regionalBaseUrl("europe-central2");
// https://system.europe-central2.brainapi.lumen-labs.ai
```

Per-call workspace override:

```ts
await brain.retrieve.context(
  { text: "latest status" },
  { brainId: "another-workspace" },
);

const other = brain.withBrain("another-workspace");
```

## Authentication

The server accepts either (or both):

- `Authorization: Bearer <pat>`
- `BrainPAT: <pat>`

The SDK sends **both** by default. Set `authScheme: "bearer"` or `authScheme: "header"` to send only one.

Workspace isolation uses `X-Brain-ID` when you set `brainId` on the client or the call. The SDK does not invent a workspace id. System routes (`/system`, `/health`, `/meta/login-info`) omit that header.

## Ingest

Ingest calls return `202` with a `task_id`. Poll or `wait` until the task is terminal.

```ts
const { task_id } = await brain.ingest.text("A short note.");
await brain.waitForTask(task_id);

await brain.ingest.json({ json_data: { title: "Note", body: "…" } });
await brain.ingest.url("https://example.com/article");
await brain.ingest.file({ file: new Blob(["…"]), filename: "notes.txt" });
await brain.ingest.structured({
  data: [{ object: { type: "Person", name: "Ada" } }],
});

await brain.tasks.cancel(task_id, { mode: "keep_saved" });
await brain.tasks.purge(task_id, { source_key: "notes.txt" });
```

`ingest.text` also accepts the full OpenAPI body (`data`, `meta_keys`, `source_timestamp`, `group_tracking`, …).

## Retrieve, search, and context

```ts
const context = await brain.retrieve.context({
  text: "What did Ada invent?",
  as_of: "2024-01-01T00:00:00Z",
  include_validity_unknown: true,
  annotate_conflicts: true,
});

const hits = await brain.retrieve.search({
  query: "Ada",
  k: 8,
  as_of: "2024-01-01T00:00:00Z",
});

await brain.retrieve.query({ text: "Ada", as_of: "2024-01-01T00:00:00Z" });
await brain.retrieve.entityStatus("Ada");
await brain.retrieve.neighbors({ entity_id: "node-uuid" });
await brain.retrieve.recommend({ target: "Ada" });
```

`as_of` is fail-closed on the server: facts whose validity cannot be decided at that timestamp are dropped unless `include_validity_unknown` is true.

`brain.query(...)` is an alias of `brain.retrieve.context(...)`.

## Facts and verification

Facts are `unverified`, `verified`, or `rejected`.

```ts
const { facts } = await brain.facts.list({ state: "unverified" });
const fact = facts[0];
if (fact) {
  await brain.facts.verify(fact.fact_id, { verified_by: "reviewer" });
  await brain.facts.reject(fact.fact_id, { note: "stale" });
  await brain.facts.reset(fact.fact_id);
}
```

## Conflicts

```ts
const open = await brain.conflicts.list({ status: "open" });
await brain.conflicts.scan();
const conflict = open.conflicts[0];
if (conflict?.id) {
  await brain.conflicts.resolve(conflict.id, { winning_fact_id: "fact-id" });
  await brain.conflicts.dismiss(conflict.id, { notes: "duplicate" });
}
```

## Graph entities and relationships

```ts
await brain.graph.addEntity({ name: "Ada", labels: ["Person"] });
await brain.graph.updateEntity({ uuid: "node-uuid", new_description: "Mathematician" });
await brain.graph.addRelationship({
  subject_uuid: "node-a",
  predicate_name: "wrote",
  predicate_description: "authored",
  object_uuid: "node-b",
});
```

## Errors

Failed responses throw `BrainAPIError` with the v2 envelope fields when present:

```ts
import { BrainAPIError } from "@lumenlabs/lumen-brain";

try {
  await brain.facts.get("missing");
} catch (error) {
  if (error instanceof BrainAPIError) {
    console.error(error.status, error.code, error.resolution, error.requestId);
  }
}
```

## Breaking changes from 1.x

| 1.x | 2.x |
| --- | --- |
| `new LumenBrainDriver(apiKey)` | `new BrainAPI({ pat, region, brainId })` |
| `X-LumenBrain-ApiKey` | `Authorization: Bearer` / `BrainPAT` + `X-Brain-ID` |
| Hardcoded `api.brain.lumen-labs.ai` / `api.brainapi.lumen-labs.ai` | `region` or `baseUrl` |
| `saveMessage` / `queryMemory` / `injectKnowledge` | `ingest.*` / `retrieve.context` / `query` |
| `memory_uuid`, `conversation_id` | `brainId` (`X-Brain-ID`) and optional `group_tracking` |

Do not publish this package from a fork unless you own the npm package. Publishing requires the owner's npm access.

## Development

```bash
npm install
npm run lint
npm test
npm run build
```

Tests mock `fetch`. They do not call a live BrainAPI host or require secrets.

## License

MIT
