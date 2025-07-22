"use strict";
// File: /src/driver.ts
// Created Date: Tuesday July 22nd 2025
// Author: Christian Nonis <alch.infoemail@gmail.com>
// -----
// Last Modified: Tuesday July 22nd 2025 3:37:02 pm
// Modified By: the developer formerly known as Christian Nonis at <alch.infoemail@gmail.com>
// -----
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LumenBrainDriver = void 0;
const endpoints_1 = require("./constants/endpoints");
class LumenBrainDriver {
    constructor(apiKey) {
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
    saveMessage(memoryUuid, content, role, conversationId, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            let taskId = null;
            try {
                const response = yield fetch(endpoints_1.MemoryEndpoints.UPDATE, {
                    method: "POST",
                    headers: {
                        [endpoints_1.API_KEY_HEADER]: this.apiKey,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        memory_id: memoryUuid,
                        type: "message",
                        content,
                        role,
                        conversation_id: conversationId,
                        metadata,
                    }),
                });
                const result = yield response.json();
                taskId = result.task_id;
            }
            catch (e) {
                console.error("[LUMEN BRAIN] Error saving message", e);
                throw e;
            }
            let result = null;
            while (!result) {
                try {
                    const resultRes = yield fetch(`${endpoints_1.MemoryEndpoints.TASKS}/${taskId}`, {
                        headers: {
                            [endpoints_1.API_KEY_HEADER]: this.apiKey,
                        },
                    });
                    if (resultRes.status === 200) {
                        result = yield resultRes.json();
                        break;
                    }
                }
                catch (e) {
                    console.error("[LUMEN BRAIN] Error polling task", e);
                    throw e;
                }
                yield new Promise((resolve) => setTimeout(resolve, 1000));
            }
            return result;
        });
    }
    /**
     * Request body for the memory update endpoint.
     *
     * @param memoryUuid - The UUID of the memory to update, you can provide yours or let the API generate one.
     * @param content - The text content of the message to save.
     * @param resourceType - The type of resource being saved.
     * @param metadata - The optional metadata to add to the memory.
     */
    injectKnowledge(memoryUuid, content, resourceType, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            let taskId = null;
            try {
                const response = yield fetch(endpoints_1.MemoryEndpoints.UPDATE, {
                    method: "POST",
                    headers: {
                        [endpoints_1.API_KEY_HEADER]: this.apiKey,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        memory_id: memoryUuid,
                        type: resourceType,
                        content,
                        resource_type: resourceType,
                        metadata,
                    }),
                });
                const result = yield response.json();
                taskId = result.task_id;
            }
            catch (e) {
                console.error("[LUMEN BRAIN] Error injecting knowledge", e);
                throw e;
            }
            let result = null;
            while (!result) {
                try {
                    const resultRes = yield fetch(`${endpoints_1.MemoryEndpoints.TASKS}/${taskId}`, {
                        headers: {
                            [endpoints_1.API_KEY_HEADER]: this.apiKey,
                        },
                    });
                    if (resultRes.status === 200) {
                        result = yield resultRes.json();
                        break;
                    }
                }
                catch (e) {
                    console.error("[LUMEN BRAIN] Error polling knowledge injection task", e);
                    throw e;
                }
                yield new Promise((resolve) => setTimeout(resolve, 1000));
            }
            return result;
        });
    }
    /**
     * Request body for the memory query endpoint.
     *
     * @param text - The text to query the memory with (usually the same message as the one that was sent to the agent).
     * @param memoryUuid - The UUID of the memory to query (usually it's related to a user).
     * @param conversationId - The optional ID of the current conversation, if not provided a new conversation will be created.
     */
    queryMemory(text, memoryUuid, conversationId) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(endpoints_1.MemoryEndpoints.QUERY, {
                method: "POST",
                headers: {
                    [endpoints_1.API_KEY_HEADER]: this.apiKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text,
                    memory_id: memoryUuid,
                    conversation_id: conversationId,
                }),
            });
            return response.json();
        });
    }
}
exports.LumenBrainDriver = LumenBrainDriver;
