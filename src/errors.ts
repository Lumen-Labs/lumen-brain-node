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
    const envelope = isRecord(body) ? (body as ErrorResponseBody) : undefined;
    const info = envelope?.error;
    const detail = envelope?.detail ?? body;
    const message =
      info?.message ||
      (typeof envelope?.detail === "string" ? envelope.detail : undefined) ||
      `BrainAPI request failed (${status})`;

    return new BrainAPIError(message, {
      status,
      code: info?.code,
      resolution: info?.resolution,
      requestId: info?.request_id ?? requestId,
      detail,
      body,
    });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
