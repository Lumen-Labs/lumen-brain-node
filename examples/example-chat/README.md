# BrainAPI example chat

Minimal Next.js app that ingests a user message into BrainAPI v2 and retrieves context for a reply.

## Setup

From the SDK repo root:

```bash
npm install
npm run build
```

Then in this directory:

```bash
npm install
```

Copy environment variables (do not commit secrets):

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
| --- | --- | --- |
| `BRAIN_PAT` | yes | BrainAPI personal access token |
| `BRAIN_ID` | no | Workspace id sent as `X-Brain-ID` when set |
| `BRAIN_REGION` | no | Hosted region such as `us-east1` or `europe-central2` |
| `BRAIN_API_BASE_URL` | no | Custom origin; mutually exclusive with `BRAIN_REGION` |
| `COMPLETION_URL` | no | Optional HTTP endpoint that turns retrieved context into a reply |
| `COMPLETION_TOKEN` | no | Bearer token for `COMPLETION_URL` |

If `COMPLETION_URL` is unset, the API route returns the retrieved BrainAPI context as the assistant message.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
