# Lumen Brain TypeScript SDK

A TypeScript SDK for interacting with the Lumen Brain API, providing seamless integration with Lumen Brain's memory and knowledge management capabilities.

## Features

- 🔑 **API Key Authentication**: Secure access to Lumen Brain services
- 💾 **Memory Management**: Save and query memory entries
- 🧠 **Knowledge Injection**: Add various types of content to your knowledge base
- 🔄 **Async Task Handling**: Built-in polling for long-running operations
- 📝 **Type Safety**: Full TypeScript support with comprehensive type definitions

## Installation

```bash
npm install lumen-brain

# or with yarn
yarn add lumen-brain

# or with pnpm
pnpm add lumen-brain
```

## Quick Start

```typescript
import { LumenBrainDriver } from "lumen-brain";

// Initialize the driver with your API key
const brain = new LumenBrainDriver("your-api-key");

// Save a message to memory
const saveResult = await brain.saveMessage(
  "memory-uuid",
  "Hello, this is a test message",
  "user",
  "conversation-123"
);

// Query memory
const queryResult = await brain.queryMemory(
  "What was the test message?",
  "memory-uuid",
  "conversation-123"
);

// Inject knowledge
const knowledgeResult = await brain.injectKnowledge(
  "memory-uuid",
  "Important information to remember",
  "event"
);
```

## API Reference

### LumenBrainDriver

The main class for interacting with the Lumen Brain API.

```typescript
class LumenBrainDriver {
  constructor(apiKey: string);

  // Save a message to memory
  async saveMessage(
    memoryUuid: string,
    content: string,
    role?: "user" | "assistant",
    conversationId?: string,
    metadata?: Record<string, any>
  ): Promise<MemoryUpdateResponse>;

  // Inject knowledge into memory
  async injectKnowledge(
    memoryUuid: string,
    content: string,
    resourceType?: MemoryContentType,
    metadata?: Record<string, any>
  ): Promise<MemoryUpdateResponse>;

  // Query memory for relevant information
  async queryMemory(
    text: string,
    memoryUuid: string,
    conversationId: string
  ): Promise<MemoryQueryResponse>;
}
```

### Content Types

The SDK supports various content types for knowledge injection:

- `file`
- `event`
- `webpage`
- `email`
- `message` (for conversation messages)

### Response Types

```typescript
interface MemoryQueryResponse {
  context: string; // The textual context relevant for the query
}

interface MemoryUpdateResponse {
  task_id: string;
  memory_id: string;
  conversation_id: string;
}
```

## Error Handling

The SDK includes built-in error handling and logging:

```typescript
try {
  const result = await brain.saveMessage("uuid", "content");
} catch (error) {
  console.error("Failed to save message:", error);
}
```

## Development

To build the project:

```bash
npm run build
```

## License

MIT

## Author

Christian Nonis <alch.infoemail@gmail.com>
