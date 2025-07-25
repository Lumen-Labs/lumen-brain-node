// File: /src/constants/endpoints.ts
// Created Date: Tuesday July 22nd 2025
// Author: Christian Nonis <alch.infoemail@gmail.com>
// -----
// Last Modified: Tuesday July 22nd 2025 3:36:36 pm
// Modified By: the developer formerly known as Christian Nonis at <alch.infoemail@gmail.com>
// -----

export const API_VERSION = "v1";
export const BASE_URL = `https://brain.lumen-labs.ai/api/${API_VERSION}`;

export type MemoryContentType =
  | "file"
  | "file_chunk"
  | "event"
  | "webpage"
  | "webpage_chunk"
  | "email"
  | "email_chunk";

export type AllMemoryContentType = MemoryContentType | "message";

export const API_KEY_HEADER = "X-LumenBrain-ApiKey";

export enum MemoryEndpoints {
  UPDATE = `${BASE_URL}/memory/update`,
  QUERY = `${BASE_URL}/memory/query`,
  TASKS = `${BASE_URL}/tasks`,
}

/**
 * Response for the memory query endpoint.
 */
export interface MemoryQueryResponse {
  /** The textual context relevant for the query. */
  context: string;
}

export interface MemoryUpdateResponse {
  error?: string;
  task_id?: string;
  result?: {
    memory_id: string;
    conversation_id?: string;
  };
}

export interface ApiHeaders {
  [API_KEY_HEADER]: string;
}
