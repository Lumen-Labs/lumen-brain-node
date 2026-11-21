import {
  BRAIN_ID_HEADER,
  BRAIN_PAT_HEADER,
  type AuthScheme,
} from "./config";
import { BrainAPIError } from "./errors";

export interface HttpRequestOptions {
  method?: string;
  path: string;
  query?: object;
  body?: unknown;
  form?: FormData;
  headers?: Record<string, string>;
  brainId?: string | null;
  signal?: AbortSignal;
}

export type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean>;

const BRAIN_EXEMPT_PREFIXES = ["/system", "/health", "/openapi.json", "/meta/login-info"];

export class HttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly pat: string,
    private readonly defaultBrainId: string,
    private readonly authScheme: AuthScheme,
    private readonly fetchImpl: typeof fetch,
    private readonly timeoutMs?: number,
    private readonly userAgent?: string,
  ) {}

  async request<T>(options: HttpRequestOptions): Promise<T> {
    const url = this.buildUrl(options.path, options.query);
    const headers = this.buildHeaders(options);
    const controller = new AbortController();
    const timeout =
      this.timeoutMs && this.timeoutMs > 0
        ? setTimeout(() => controller.abort(), this.timeoutMs)
        : undefined;

    if (options.signal) {
      if (options.signal.aborted) {
        controller.abort(options.signal.reason);
      } else {
        options.signal.addEventListener("abort", () => controller.abort(options.signal?.reason), {
          once: true,
        });
      }
    }

    try {
      const response = await this.fetchImpl(url, {
        method: options.method ?? "GET",
        headers,
        body: options.form
          ? options.form
          : options.body === undefined
            ? undefined
            : JSON.stringify(omitUndefined(options.body)),
        signal: controller.signal,
      });

      const requestId = response.headers.get("X-Request-ID") ?? undefined;
      const payload = await readBody(response);

      if (!response.ok) {
        throw BrainAPIError.fromResponse(response.status, payload, requestId);
      }

      return payload as T;
    } catch (error) {
      if (error instanceof BrainAPIError) {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw new BrainAPIError("BrainAPI request timed out or was aborted", {
          status: 0,
          code: "REQUEST_ABORTED",
          cause: error,
        });
      }
      throw new BrainAPIError("BrainAPI request failed", {
        status: 0,
        code: "NETWORK_ERROR",
        cause: error,
      });
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }

  private buildUrl(path: string, query?: object): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${normalizedPath}`);
    if (query) {
      for (const [key, value] of Object.entries(query as Record<string, QueryValue>)) {
        if (value === undefined || value === null) {
          continue;
        }
        if (Array.isArray(value)) {
          const joined = value.map(String).filter((item) => item.length > 0);
          if (joined.length > 0) {
            url.searchParams.set(key, joined.join(","));
          }
          continue;
        }
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  private buildHeaders(options: HttpRequestOptions): Headers {
    const headers = new Headers(options.headers);
    if (this.authScheme === "bearer" || this.authScheme === "both") {
      headers.set("Authorization", `Bearer ${this.pat}`);
    }
    if (this.authScheme === "header" || this.authScheme === "both") {
      headers.set(BRAIN_PAT_HEADER, this.pat);
    }
    if (this.userAgent && !headers.has("User-Agent")) {
      headers.set("User-Agent", this.userAgent);
    }

    const skipBrainId =
      options.brainId === null || isBrainExempt(options.path);
    if (!skipBrainId) {
      headers.set(BRAIN_ID_HEADER, options.brainId?.trim() || this.defaultBrainId);
    }

    if (options.form) {
      headers.delete("Content-Type");
    } else if (options.body !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }

    return headers;
  }
}

function isBrainExempt(path: string): boolean {
  return BRAIN_EXEMPT_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

function omitUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(omitUndefined);
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (item !== undefined) {
        result[key] = omitUndefined(item);
      }
    }
    return result;
  }
  return value;
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
