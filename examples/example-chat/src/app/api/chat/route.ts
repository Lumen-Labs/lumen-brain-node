import OpenAI from "openai";
import { LumenBrainDriver } from "@lumenlabs/lumen-brain";

// Init the openai client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Init the lumen brain driver
const brain = new LumenBrainDriver(process.env.LUMEN_BRAIN_API_KEY!);

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Receive the frontend request =============================
    const {
      message, // The user text message

      // The id of the memory (unique for each user)
      // used to to keep track of all the memories for the specific
      // user, it's not related to the current conversation and is used
      // to identity the knowledge base for the specific user
      memoryId,

      // The id of the conversation current conversation,
      // used to keep track of the conversation history
      conversationId,
    } = await req.json();
    // ============================================================

    // Save the last message to the brain =========================
    const brainResponse = await brain.saveMessage(
      memoryId, // Save the message to the user's memory
      message,
      "user",

      // Optional: conversation_id received from previous savings,
      // if not provided, a new conversation id will be generated
      // and returned as result
      conversationId
    );

    const {
      result: { memory_id, conversation_id },
      task_id,
    } = brainResponse;
    console.log(memory_id, conversation_id, task_id);
    // ============================================================

    // Retrieve the relevant context from the brain ============================
    const queryResponse = await brain.queryMemory(
      message,
      memory_id,
      conversation_id
    );
    console.log(JSON.stringify(queryResponse, null, 2));
    // Add it to the user message, it will contain:
    // - relevant memories
    // - past conversation messages
    // - connection between memories
    const prompt = message + queryResponse.context;
    // ============================================================

    // Send the request to the llm ================================
    // we are using the responses api instead of the completions
    // because it allows us to send the context and also a system
    // prompt alongside the user message so in general it's more
    // flexible than the completions api
    const stream = await openai.responses.create({
      model: "gpt-4o",
      input: prompt,
      stream: true,
    });
    // ============================================================

    // Send the stream to the frontend ============================
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === "response.output_text.delta") {
              const content = chunk.delta || "";
              if (content) {
                const data = `data: ${JSON.stringify({
                  content,
                  conversationId: conversation_id,
                })}\n\n`;
                controller.enqueue(encoder.encode(data));
              }
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    // Keep the connection alive to send the chunks
    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
    // ============================================================
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
