import { describe, expect, it } from "vitest";
import {
  DEFAULT_COMMENTARY_MODEL,
  DEFAULT_ROUND_MODEL,
  readEnv,
} from "@/env/env";

describe("readEnv", () => {
  it("falls back to the cheap defaults", () => {
    const env = readEnv({});

    expect(env.aiModel).toEqual(DEFAULT_ROUND_MODEL);
    expect(env.commentaryModel).toEqual(DEFAULT_COMMENTARY_MODEL);
    expect(env.anthropicApiKey).toBeNull();
    expect(env.port).toEqual(4000);
  });

  it("uses the models from the environment", () => {
    const env = readEnv({
      ANTHROPIC_MODEL: "claude-opus-5",
      ANTHROPIC_COMMENTARY_MODEL: "claude-sonnet-5",
    });

    expect(env.aiModel).toEqual("claude-opus-5");
    expect(env.commentaryModel).toEqual("claude-sonnet-5");
  });

  it("treats a blank model as unset", () => {
    const env = readEnv({ ANTHROPIC_MODEL: "   " });

    expect(env.aiModel).toEqual(DEFAULT_ROUND_MODEL);
  });

  it("trims the api key and treats blank as absent", () => {
    expect(readEnv({ ANTHROPIC_API_KEY: "  sk-test  " }).anthropicApiKey).toEqual(
      "sk-test"
    );
    expect(readEnv({ ANTHROPIC_API_KEY: "   " }).anthropicApiKey).toBeNull();
  });

  it("falls back to 4000 for an unparseable port", () => {
    expect(readEnv({ PORT: "not-a-port" }).port).toEqual(4000);
    expect(readEnv({ PORT: "5000" }).port).toEqual(5000);
  });
});
