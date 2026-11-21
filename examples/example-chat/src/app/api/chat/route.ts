import { BrainAPI } from "@lumenlabs/lumen-brain";

function createBrain() {
  const pat = process.env.BRAIN_PAT;
  if (!pat) {
    throw new Error("BRAIN_PAT is required");
  }
  const baseUrl = process.env.BRAIN_API_BASE_URL;
  const region = process.env.BRAIN_REGION ?? (baseUrl ? undefined : "us-east1");
  return new BrainAPI({
    pat,
    brainId: process.env.BRAIN_ID ?? "default",
    baseUrl,
    region,
  });
}

function readChatRequest(payload: unknown): { message: string; brainId?: string } | { error: string } {
  if (payload === null || typeof payload !== "object") {
    return { error: "JSON object body is required" };
  }
  const body = payload as Record<string, unknown>;
  if (typeof body.message !== "string" || body.message.trim().length === 0) {
    return { error: "message is required" };
  }
  if (body.brainId !== undefined && typeof body.brainId !== "string") {
    return { error: "brainId must be a string" };
  }
  return {
    message: body.message,
    brainId: typeof body.brainId === "string" ? body.brainId : undefined,
  };
}

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = readChatRequest(payload);
    if ("error" in parsed) {
      return Response.json({ error: parsed.error }, { status: 400 });
    }
    const { message, brainId } = parsed;

    const brain = createBrain();
    const client = brainId && brainId.trim() ? brain.withBrain(brainId) : brain;

    const ingested = await client.ingest.text({
      text: message,
      group_tracking: "example-chat",
    });

    const context = await client.query({
      text: message,
      include_validity_unknown: true,
    });

    const completionUrl = process.env.COMPLETION_URL;
    if (!completionUrl) {
      return Response.json({
        content: context.text_context || "No retrieved context yet.",
        taskId: ingested.task_id,
      });
    }

    const completionResponse = await fetch(completionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.COMPLETION_TOKEN
          ? { Authorization: `Bearer ${process.env.COMPLETION_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        input: `${context.text_context}\n\n${message}`,
      }),
      signal: AbortSignal.timeout(25_000),
    });

    if (!completionResponse.ok) {
      return Response.json({ error: "Completion request failed" }, { status: 502 });
    }

    const completion = await completionResponse.json();
    const content =
      typeof completion === "string"
        ? completion
        : completion.content ?? completion.text ?? JSON.stringify(completion);

    return Response.json({
      content,
      taskId: ingested.task_id,
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      return Response.json({ error: "Completion request timed out" }, { status: 504 });
    }
    console.error("Error in chat API:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
