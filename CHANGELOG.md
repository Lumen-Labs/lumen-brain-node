# Changelog

## 2.0.0

Breaking rewrite of `@lumenlabs/lumen-brain` for BrainAPI v2.

- Replace `LumenBrainDriver` and the v1 memory API (`memory_uuid`, `conversation_id`, `X-LumenBrain-ApiKey`, hardcoded `api.brain.lumen-labs.ai` / `api.brainapi.lumen-labs.ai`) with the `BrainAPI` client.
- Authenticate with a BrainPAT (`Authorization: Bearer <pat>` and `BrainPAT` by default) and isolate workspaces with `X-Brain-ID`.
- Require `region` or `baseUrl`. Hosted regions resolve to `https://system.<region>.brainapi.lumen-labs.ai` (`us-east1`, `europe-central2`).
- Cover ingest, retrieve/search/context (`as_of`, validity unknown), chat-style `query`, facts, conflicts, graph entities/relationships, tasks, brains, and meta endpoints.
- Dual ESM/CJS build via tsup. `LumenBrain` remains as an alias of `BrainAPI`.

## 1.2.2

Published on npm but previously missing from git `main`. Brought back for history:

- Version bump `1.2.1` → `1.2.2`.
- Host rename: `https://api.brain.lumen-labs.ai` → `https://api.brainapi.lumen-labs.ai`.

No other source, README, or API changes were in the 1.2.2 tarball versus git `main` at `aef465a`.

## 1.2.1

Last version present on git `main` before this rewrite.
