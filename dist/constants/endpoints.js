"use strict";
// File: /src/constants/endpoints.ts
// Created Date: Tuesday July 22nd 2025
// Author: Christian Nonis <alch.infoemail@gmail.com>
// -----
// Last Modified: Tuesday July 22nd 2025 3:36:36 pm
// Modified By: the developer formerly known as Christian Nonis at <alch.infoemail@gmail.com>
// -----
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryEndpoints = exports.API_KEY_HEADER = exports.BASE_URL = exports.API_VERSION = void 0;
exports.API_VERSION = "v1";
exports.BASE_URL = `https://brainapi.lumen-labs.ai/${exports.API_VERSION}`;
exports.API_KEY_HEADER = "X-LumenBrain-ApiKey";
var MemoryEndpoints;
(function (MemoryEndpoints) {
    MemoryEndpoints["UPDATE"] = "https://brainapi.lumen-labs.ai/v1/memory/update";
    MemoryEndpoints["QUERY"] = "https://brainapi.lumen-labs.ai/v1/memory/query";
    MemoryEndpoints["TASKS"] = "https://brainapi.lumen-labs.ai/v1/tasks";
})(MemoryEndpoints || (exports.MemoryEndpoints = MemoryEndpoints = {}));
