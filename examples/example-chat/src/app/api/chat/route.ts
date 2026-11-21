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

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { message, brainId } = await req.json();
    if (typeof message !== "string" || message.trim().length === 0) {
      return Response.json({ error: "message is required" }, { status: 400 });
    }

    const brain = createBrain();
    const client = typeof brainId === "string" && brainId.trim() ? brain.withBrain(brainId) : brain;

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
    console.error("Error in chat API:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
