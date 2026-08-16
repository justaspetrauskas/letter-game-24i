import { describe, expect, it } from "vitest";
import { modelProfile } from "@/ai/modelProfile/modelProfile";

describe("modelProfile", () => {
  it("gives Claude Opus 5 the full set", () => {
    expect(modelProfile("claude-opus-5")).toEqual({
      supportsEffort: true,
      supportsAdaptiveThinking: true,
      supportsFallbacks: true,
    });
  });

  it("gives Claude Sonnet 5 effort and adaptive thinking but not fallbacks", () => {
    expect(modelProfile("claude-sonnet-5")).toEqual({
      supportsEffort: true,
      supportsAdaptiveThinking: true,
      supportsFallbacks: false,
    });
  });

  it("gives Haiku 4.5 none of them", () => {
    expect(modelProfile("claude-haiku-4-5")).toEqual({
      supportsEffort: false,
      supportsAdaptiveThinking: false,
      supportsFallbacks: false,
    });
  });

  it("treats a dated snapshot as its base model", () => {
    expect(modelProfile("claude-haiku-4-5-20251001").supportsEffort).toBe(false);
    expect(modelProfile("claude-sonnet-4-6-20251114").supportsEffort).toBe(true);
  });

  it("ignores a bedrock prefix", () => {
    expect(modelProfile("anthropic.claude-opus-5").supportsFallbacks).toBe(true);
  });

  it("is conservative about an unknown model", () => {
    expect(modelProfile("some-future-model")).toEqual({
      supportsEffort: false,
      supportsAdaptiveThinking: false,
      supportsFallbacks: false,
    });
  });

  it("does not confuse Sonnet 4.5 with Sonnet 4.6", () => {
    expect(modelProfile("claude-sonnet-4-5").supportsEffort).toBe(false);
    expect(modelProfile("claude-sonnet-4-6").supportsEffort).toBe(true);
  });
});
