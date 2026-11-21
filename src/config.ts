export const BRAIN_ID_HEADER = "X-Brain-ID";
export const BRAIN_PAT_HEADER = "BrainPAT";

export const HOSTED_REGIONS = ["us-east1", "europe-central2"] as const;

export type HostedRegion = (typeof HOSTED_REGIONS)[number] | (string & {});

export type AuthScheme = "bearer" | "header" | "both";

export function regionalBaseUrl(region: string): string {
  const normalized = region.trim().toLowerCase();
  if (!normalized) {
    throw new Error("region must be a non-empty string");
  }
  if (!/^[a-z0-9-]+$/.test(normalized)) {
    throw new Error(
      `Invalid region "${region}". Use a hosted region such as us-east1 or europe-central2.`,
    );
  }
  return `https://system.${normalized}.brainapi.lumen-labs.ai`;
}

export function normalizeBaseUrl(
  baseUrl: string,
  options: { allowHttp?: boolean } = {},
): string {
  const trimmed = baseUrl.trim();
  if (!trimmed) {
    throw new Error("baseUrl must be a non-empty string");
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`Invalid baseUrl "${baseUrl}"`);
  }

  if (parsed.search || parsed.hash) {
    throw new Error("baseUrl must not include a query string or fragment");
  }

  if (parsed.protocol === "http:") {
    if (!options.allowHttp) {
      throw new Error(
        "baseUrl must use HTTPS. Set allowHttp: true for local plaintext development.",
      );
    }
  } else if (parsed.protocol !== "https:") {
    throw new Error("baseUrl must use HTTPS");
  }

  const pathname = parsed.pathname.replace(/\/+$/, "");
  return `${parsed.origin}${pathname === "/" ? "" : pathname}`;
}

export function resolveBaseUrl(options: {
  baseUrl?: string;
  region?: string;
  allowHttp?: boolean;
}): string {
  if (options.baseUrl && options.region) {
    throw new Error("Provide either baseUrl or region, not both");
  }
  if (options.baseUrl) {
    return normalizeBaseUrl(options.baseUrl, { allowHttp: options.allowHttp });
  }
  if (options.region) {
    return regionalBaseUrl(options.region);
  }
  throw new Error(
    "Provide region (for example 'us-east1' or 'europe-central2') or baseUrl",
  );
}

export interface BrainAPIClientOptions {
  pat: string;
  brainId?: string;
  baseUrl?: string;
  region?: HostedRegion;
  authScheme?: AuthScheme;
  fetch?: typeof fetch;
  timeoutMs?: number;
  userAgent?: string;
  allowHttp?: boolean;
}

export function resolvePat(pat: string): string {
  const trimmed = pat.trim();
  if (!trimmed) {
    throw new Error("A BrainAPI personal access token (pat) is required");
  }
  return trimmed;
}

export function resolveBrainId(brainId?: string): string | undefined {
  const trimmed = brainId?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}
