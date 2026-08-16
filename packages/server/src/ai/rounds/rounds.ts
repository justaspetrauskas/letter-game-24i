import Anthropic from "@anthropic-ai/sdk";
import {
  MIN_GENERATED_POOL_SIZE,
  sanitiseGameConfig,
  sanitiseTheme,
} from "@letter-game/protocol";
import type { RoundErrorCode, ThemedRound } from "@letter-game/protocol";
import { modelProfile } from "@/ai/modelProfile/modelProfile";

const MAX_NAME_LENGTH = 40;

const MAX_DESCRIPTION_LENGTH = 160;

const DEFAULT_CACHE_TTL_MS = 60 * 60 * 1000;

const DEFAULT_CACHE_LIMIT = 200;

const MAX_OUTPUT_TOKENS = 16000;

export const roundSystemPrompt = `You design rounds for a falling-letters reaction game.

Letters fall from the top of the screen. The player clears a letter by pressing its key, but only while at least minMatch copies of that same letter are on screen at once. A letter that reaches the floor costs a life.

Given a theme, design a round that evokes it.

letterPool is the set of letters that can fall. Draw it from words associated with the theme, so the letters players actually type feel connected to the subject. Use only a-z. Four to ten distinct letters plays best: fewer than four is trivial, more than ten makes matches too rare.

Tune the difficulty to the mood of the theme. Something frantic or dangerous should fall fast with few lives. Something calm or vast should fall slowly with more.

name is two to four words, the round's title. description is one short sentence the player reads before starting: evocative, not instructional.

Stay inside these ranges: minMatch 2 to 4, lives 5 to 40, spawnDelayMs each between 300 and 4000 with the first no larger than the second, fallSpeed each between 0.02 and 0.4 with the first no larger than the second, measured in screen heights per second.`;

export const roundSchema = {
  type: "object",
  properties: {
    name: { type: "string", description: "Two to four words." },
    description: { type: "string", description: "One short evocative sentence." },
    letterPool: {
      type: "string",
      description: "Four to ten distinct lowercase letters a-z, no separators.",
    },
    minMatch: { type: "integer", description: "Copies needed to clear, 2 to 4." },
    lives: { type: "integer", description: "Letters allowed to land, 5 to 40." },
    spawnDelayMs: {
      type: "array",
      items: { type: "integer" },
      description: "Two integers, min and max spawn gap in ms, 300 to 4000.",
    },
    fallSpeed: {
      type: "array",
      items: { type: "number" },
      description: "Two numbers, min and max screen heights per second, 0.02 to 0.4.",
    },
  },
  required: [
    "name",
    "description",
    "letterPool",
    "minMatch",
    "lives",
    "spawnDelayMs",
    "fallSpeed",
  ],
  additionalProperties: false,
} as const;

export class RoundGenerationError extends Error {
  readonly code: RoundErrorCode;

  constructor(code: RoundErrorCode, message: string) {
    super(message);
    this.name = "RoundGenerationError";
    this.code = code;
  }
}

export type RoundCompletion = (theme: string) => Promise<unknown>;

export interface RoundServiceOptions {
  apiKey?: string | null;
  model?: string;
  complete?: RoundCompletion;
  cacheTtlMs?: number;
  cacheLimit?: number;
  now?: () => number;
}

export interface RoundService {
  available: boolean;
  generate: (theme: string) => Promise<ThemedRound>;
  cacheSize: () => number;
}

interface CacheEntry {
  round: ThemedRound;
  expiresAtMs: number;
}

function themeKey(theme: string): string {
  return theme.toLowerCase();
}

function roundId(theme: string): string {
  const slug = themeKey(theme)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug.length > 0 ? `round-${slug}` : "round";
}

function readText(value: unknown, fallback: string, limit: number): string {
  if (typeof value !== "string") {
    return fallback;
  }
  const cleaned = value.replace(/\s+/g, " ").trim().slice(0, limit);
  return cleaned.length > 0 ? cleaned : fallback;
}

export function toThemedRound(theme: string, raw: unknown): ThemedRound {
  if (raw === null || typeof raw !== "object") {
    throw new RoundGenerationError(
      "generation_failed",
      "The model did not return a round."
    );
  }

  const source = raw as Record<string, unknown>;
  const config = sanitiseGameConfig(source);

  if (
    config.letterPool === undefined ||
    config.letterPool.length < MIN_GENERATED_POOL_SIZE
  ) {
    throw new RoundGenerationError(
      "generation_failed",
      "The generated round had no usable letter pool."
    );
  }

  return {
    id: roundId(theme),
    theme,
    name: readText(source.name, theme, MAX_NAME_LENGTH),
    description: readText(source.description, "", MAX_DESCRIPTION_LENGTH),
    config,
  };
}

function createAnthropicCompletion(
  apiKey: string,
  model: string
): RoundCompletion {
  const client = new Anthropic({ apiKey });

  const profile = modelProfile(model);

  return async (theme) => {
    const params: Anthropic.Beta.Messages.MessageCreateParamsNonStreaming = {
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: roundSystemPrompt,
      output_config: {
        format: { type: "json_schema", schema: roundSchema },
        ...(profile.supportsEffort ? { effort: "medium" } : {}),
      },
      messages: [{ role: "user", content: `Theme: ${theme}` }],
      ...(profile.supportsAdaptiveThinking
        ? { thinking: { type: "adaptive" } }
        : {}),
      ...(profile.supportsFallbacks
        ? {
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
          }
        : {}),
    };

    const message = await client.beta.messages.create(params);

    if (message.stop_reason === "refusal") {
      throw new RoundGenerationError(
        "refused",
        "That theme was declined. Try a different one."
      );
    }

    const block = message.content.find((entry) => entry.type === "text");
    if (!block || block.type !== "text") {
      throw new RoundGenerationError(
        "generation_failed",
        "The model returned no round."
      );
    }

    try {
      return JSON.parse(block.text);
    } catch {
      throw new RoundGenerationError(
        "generation_failed",
        "The model returned invalid JSON."
      );
    }
  };
}

export function createRoundService(
  options: RoundServiceOptions = {}
): RoundService {
  const now = options.now ?? (() => Date.now());
  const cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
  const cacheLimit = options.cacheLimit ?? DEFAULT_CACHE_LIMIT;
  const cache = new Map<string, CacheEntry>();

  const complete =
    options.complete ??
    (options.apiKey
      ? createAnthropicCompletion(
          options.apiKey,
          options.model ?? "claude-opus-5"
        )
      : null);

  return {
    available: complete !== null,

    cacheSize() {
      return cache.size;
    },

    async generate(rawTheme) {
      if (complete === null) {
        throw new RoundGenerationError(
          "ai_unavailable",
          "Round generation is not configured on this server."
        );
      }

      const theme = sanitiseTheme(rawTheme);
      if (theme.length === 0) {
        throw new RoundGenerationError("invalid_theme", "Enter a theme first.");
      }

      const key = themeKey(theme);
      const cached = cache.get(key);
      if (cached && cached.expiresAtMs > now()) {
        return cached.round;
      }
      cache.delete(key);

      const round = toThemedRound(theme, await complete(theme));

      if (cache.size >= cacheLimit) {
        const oldest = cache.keys().next();
        if (!oldest.done) {
          cache.delete(oldest.value);
        }
      }
      cache.set(key, { round, expiresAtMs: now() + cacheTtlMs });

      return round;
    },
  };
}
