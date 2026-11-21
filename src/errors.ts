export interface ErrorInfo {
  code: string;
  message: string;
  resolution: string;
  request_id: string;
}

export interface ErrorResponseBody {
  detail?: unknown;
  error?: ErrorInfo;
}

export class BrainAPIError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly resolution?: string;
  readonly requestId?: string;
  readonly detail?: unknown;
  readonly body?: unknown;

  constructor(
    message: string,
    options: {
      status: number;
      code?: string;
      resolution?: string;
      requestId?: string;
      detail?: unknown;
      body?: unknown;
      cause?: unknown;
    },
  ) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "BrainAPIError";
    this.status = options.status;
    this.code = options.code;
    this.resolution = options.resolution;
    this.requestId = options.requestId;
    this.detail = options.detail;
    this.body = options.body;
  }

  static fromResponse(
    status: number,
    body: unknown,
    requestId?: string,
  ): BrainAPIError {
    const envelope = isRecord(body) ? body : undefined;
    const info = envelope && isRecord(envelope.error) ? envelope.error : undefined;
    const detail = envelope?.detail ?? body;
    const message =
      extractServerMessage(body) || `BrainAPI request failed (${status})`;

    return new BrainAPIError(message, {
      status,
      code: asNonEmptyString(info?.code),
      resolution: asNonEmptyString(info?.resolution),
      requestId: asNonEmptyString(info?.request_id) ?? requestId,
      detail,
      body,
    });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

export function extractServerMessage(body: unknown): string | undefined {
  if (typeof body === "string") {
    return asNonEmptyString(body);
  }
  if (!isRecord(body)) {
    return undefined;
  }

  return (
    messageFromUnknown(body.error) ||
    messageFromUnknown(body.detail) ||
    asNonEmptyString(body.message)
  );
}

function messageFromUnknown(value: unknown): string | undefined {
  const direct = asNonEmptyString(value);
  if (direct) {
    return direct;
  }
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => messageFromUnknown(item))
      .filter((part): part is string => Boolean(part));
    return parts.length > 0 ? parts.join("; ") : undefined;
  }
  if (isRecord(value)) {
    return (
      asNonEmptyString(value.message) ||
      asNonEmptyString(value.msg) ||
      asNonEmptyString(value.detail)
    );
  }
  return undefined;
}
