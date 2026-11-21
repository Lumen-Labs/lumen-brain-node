import { BrainAPI, type BrainAPIClientOptions } from "../src/index";

export interface MockCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
  form: FormData | null;
  redirect?: RequestRedirect;
}

export function headerMap(headers?: HeadersInit): Record<string, string> {
  const result: Record<string, string> = {};
  new Headers(headers).forEach((value, key) => {
    result[key.toLowerCase()] = value;
  });
  return result;
}

export function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

export function createMockFetch(
  handler: (call: MockCall) => Response | Promise<Response> = () => jsonResponse({ ok: true }),
) {
  const calls: MockCall[] = [];
  const fetchImpl: typeof fetch = async (input, init = {}) => {
    const headers = headerMap(init.headers);
    const rawBody = init.body;
    let body: unknown = undefined;
    let form: FormData | null = null;
    if (rawBody instanceof FormData) {
      form = rawBody;
    } else if (typeof rawBody === "string" && rawBody.length > 0) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        body = rawBody;
      }
    }
    const call: MockCall = {
      url: String(input),
      method: (init.method ?? "GET").toUpperCase(),
      headers,
      body,
      form,
      redirect: init.redirect,
    };
    calls.push(call);
    return handler(call);
  };
  return { fetchImpl, calls };
}

export function createClient(
  fetchImpl: typeof fetch,
  extras: Partial<BrainAPIClientOptions> = {},
): BrainAPI {
  return new BrainAPI({
    pat: "test-pat",
    region: "us-east1",
    fetch: fetchImpl,
    ...extras,
  });
}
