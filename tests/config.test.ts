import { describe, expect, it } from "vitest";
import {
  HOSTED_REGIONS,
  regionalBaseUrl,
  resolveBaseUrl,
} from "../src/config";
import { BrainAPI } from "../src/index";

describe("regionalBaseUrl", () => {
  it("builds hosted regional URLs", () => {
    expect(regionalBaseUrl("us-east1")).toBe(
      "https://system.us-east1.brainapi.lumen-labs.ai",
    );
    expect(regionalBaseUrl("europe-central2")).toBe(
      "https://system.europe-central2.brainapi.lumen-labs.ai",
    );
  });

  it("normalizes region case and whitespace", () => {
    expect(regionalBaseUrl("  US-East1  ")).toBe(
      "https://system.us-east1.brainapi.lumen-labs.ai",
    );
  });

  it("rejects empty or invalid regions", () => {
    expect(() => regionalBaseUrl("")).toThrow(/non-empty/);
    expect(() => regionalBaseUrl("us east 1")).toThrow(/Invalid region/);
    expect(() => regionalBaseUrl("https://evil.example")).toThrow(/Invalid region/);
  });

  it("lists documented hosted regions", () => {
    expect(HOSTED_REGIONS).toEqual(["us-east1", "europe-central2"]);
  });
});

describe("resolveBaseUrl", () => {
  it("requires region or baseUrl", () => {
    expect(() => resolveBaseUrl({})).toThrow(/Provide region/);
  });

  it("rejects both region and baseUrl", () => {
    expect(() =>
      resolveBaseUrl({ region: "us-east1", baseUrl: "https://example.test" }),
    ).toThrow(/not both/);
  });

  it("strips trailing slashes from baseUrl", () => {
    expect(resolveBaseUrl({ baseUrl: "https://example.test/v2///" })).toBe(
      "https://example.test/v2",
    );
  });
});

describe("BrainAPI constructor", () => {
  it("requires a PAT", () => {
    expect(() => new BrainAPI({ pat: "  ", region: "us-east1" })).toThrow(/pat/);
  });

  it("defaults brainId to default", () => {
    const client = new BrainAPI({
      pat: "pat",
      region: "us-east1",
      fetch: async () => new Response("{}"),
    });
    expect(client.brainId).toBe("default");
    expect(client.baseUrl).toBe("https://system.us-east1.brainapi.lumen-labs.ai");
  });
});
