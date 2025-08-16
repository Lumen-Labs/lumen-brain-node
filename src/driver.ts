// File: /src/driver.ts
// Created Date: Tuesday July 22nd 2025
// Author: Christian Nonis <alch.infoemail@gmail.com>
// -----
// Last Modified: Tuesday July 22nd 2025 3:37:02 pm
// Modified By: the developer formerly known as Christian Nonis at <alch.infoemail@gmail.com>
// -----

import {
  API_KEY_HEADER,
  MemoryContentType,
  MemoryEndpoints,
  MemoryQueryResponse,
  MemoryUpdateResponse,
  QueryEntitiesResponse,
} from "./constants/endpoints";

export class LumenBrainDriver {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Lumen Brain API key is required");
    }
    this.apiKey = apiKey;
  }

  /**
   * Request body for the memory update endpoint.
   *
   * @param memoryUuid - The UUID of the memory to update, you can provide yours or let the API generate one.
   * @param content - The text content of the message to save.
   * @param role - The role of the message sender.
   * @param conversationId - The optional ID of the current conversation, if not provided a new conversation will be created.
   * @param metadata - The optional metadata to add to the memory.
   */
  async saveMessage(
    memoryUuid: string,
    content: string,
    role: "user" | "assistant",
    conversationId?: string,
    metadata?: Record<string, any>
  ): Promise<MemoryUpdateResponse> {
    let taskId: string | null = null;

    let _conversationId = conversationId;
    let _memoryId = null;

    try {
      const response = await fetch(MemoryEndpoints.UPDATE, {
        method: "POST",
        headers: {
          [API_KEY_HEADER]: this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memory_uuid: memoryUuid,
          type: "message",
          content,
          role,
          conversation_id: conversationId,
          metadata,
        }),
      });

      const result = await response.json();
      taskId = result.task_id;
      _memoryId = result.memory_id;
      _conversationId = result.conversation_id;
    } catch (e) {
      console.error("[LUMEN BRAIN] Error saving message", e);
      throw e;
    }

    if (!_conversationId || !_memoryId) {
      return {
        error: "Failed to save message",
        task_id: taskId!,
      };
    }

    return {
      result: {
        memory_id: _memoryId!,
        conversation_id: _conversationId!,
      },
      task_id: taskId!,
    };
  }

  /**
   * Request body for the memory update endpoint.
   *
   * @param memoryUuid - The UUID of the memory to update, you can provide yours or let the API generate one.
   * @param content - The text content of the message to save.
   * @param resourceType - The type of resource being saved.
   * @param metadata - The optional metadata to add to the memory.
   */
  async injectKnowledge(
    memoryUuid: string,
    content: string,
    resourceType?: MemoryContentType,
    metadata?: Record<string, any>
  ): Promise<MemoryUpdateResponse> {
    let taskId: string | null = null;

    let _memoryId = null;

    try {
      const response = await fetch(MemoryEndpoints.UPDATE, {
        method: "POST",
        headers: {
          [API_KEY_HEADER]: this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memory_uuid: memoryUuid,
          type: resourceType,
          content,
          resource_type: resourceType,
          metadata,
        }),
      });

      const result = await response.json();
      taskId = result.task_id;
      _memoryId = result.memory_id;
    } catch (e) {
      console.error("[LUMEN BRAIN] Error injecting knowledge", e);
      throw e;
    }

    if (!_memoryId) {
      return {
        error: "Failed to inject knowledge",
        task_id: taskId!,
      };
    }

    return {
      result: {
        memory_id: memoryUuid,
      },
      task_id: taskId!,
    };
  }

  /**
   * Request body for the memory query endpoint.
   *
   * @param text - The text to query the memory with (usually the same message as the one that was sent to the agent).
   * @param memoryUuid - The UUID of the memory to query (usually it's related to a user).
   * @param conversationId - The optional ID of the current conversation, if not provided a new conversation will be created.
   */
  async queryMemory(
    text: string,
    memoryUuid: string,
    conversationId: string
  ): Promise<MemoryQueryResponse> {
    const response = await fetch(MemoryEndpoints.QUERY, {
      method: "POST",
      headers: {
        [API_KEY_HEADER]: this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        memory_uuid: memoryUuid,
        conversation_id: conversationId,
      }),
    });

    return response.json();
  }

  async fetchInfo(
    memoryUuid: string,
    entities: string[],
    info: string,
    depth: number
  ): Promise<QueryEntitiesResponse> {
    try {
      const params = new URLSearchParams({
        memory_uuid: memoryUuid,
        entities: entities.join(","),
        info,
        depth: depth.toString(),
      });

      const response = await fetch(
        `${MemoryEndpoints.QUERY_ENTITIES}?${params.toString()}`,
        {
          method: "GET",
          headers: {
            [API_KEY_HEADER]: this.apiKey,
          },
        }
      );

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    } catch (e) {
      console.error("[LUMEN BRAIN] Error fetching info", e);
      throw e;
    }
  }
}
