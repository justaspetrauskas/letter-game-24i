import Anthropic from "@anthropic-ai/sdk";
import { RIVAL_HISTORY_SIZE, sanitiseRivalLine } from "@letter-game/protocol";
import type { RivalSnapshot } from "@letter-game/protocol";
import { modelProfile } from "@/ai/modelProfile/modelProfile";

const MAX_OUTPUT_TOKENS = 4096;

export const rivalSystemPrompt = `You are the player's rival in a falling-letters reaction game.

Letters fall from the top of the screen. The player clears a letter by pressing its key, but only while two or more copies of that letter are on screen at once. A letter that reaches the floor costs a life. Pressing a key without enough copies on screen is a misfire.

You watch them play and comment on it. You are dry, competitive, and faintly smug: you think you would have handled that better. You are never cruel, and never encouraging.

Rules:
- Reply with one line and nothing else. Twelve words maximum.
- No quotation marks, no emoji, no preamble, no stage directions.
- React to the specific thing that just happened, using the numbers you are given.
- A miss where another copy of the same letter was still falling is the player's worst mistake. Notice it.
- Never reuse a line you have already said this game.`;

export class CommentaryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommentaryError";
  }
}

export type CommentaryCompletion = (
  snapshot: RivalSnapshot,
  recentLines: string[]
) => Promise<string>;

export interface CommentaryServiceOptions {
  apiKey?: string | null;
  model?: string;
  complete?: CommentaryCompletion;
}

export interface CommentaryService {
  available: boolean;
  comment: (snapshot: RivalSnapshot, recentLines: string[]) => Promise<string>;
}

export function buildRivalPrompt(
  snapshot: RivalSnapshot,
  recentLines: string[]
): string {
  const lines = recentLines
    .slice(-RIVAL_HISTORY_SIZE)
    .map((line) => `- ${line}`)
    .join("\n");

  const alreadySaid =
    lines.length > 0 ? `\n\nLines you have already used:\n${lines}` : "";

  return `What just happened:\n${JSON.stringify(snapshot)}${alreadySaid}`;
}

function createAnthropicCompletion(
  apiKey: string,
  model: string
): CommentaryCompletion {
  const client = new Anthropic({ apiKey });

  const profile = modelProfile(model);

  return async (snapshot, recentLines) => {
    const params: Anthropic.Beta.Messages.MessageCreateParamsNonStreaming = {
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: rivalSystemPrompt,
      messages: [
        { role: "user", content: buildRivalPrompt(snapshot, recentLines) },
      ],
      ...(profile.supportsEffort ? { output_config: { effort: "low" } } : {}),
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
      throw new CommentaryError("The rival had nothing to say.");
    }

    const block = message.content.find((entry) => entry.type === "text");
    if (!block || block.type !== "text") {
      throw new CommentaryError("The rival returned no line.");
    }

    return block.text;
  };
}

export function createCommentaryService(
  options: CommentaryServiceOptions = {}
): CommentaryService {
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

    async comment(snapshot, recentLines) {
      if (complete === null) {
        throw new CommentaryError("Commentary is not configured.");
      }

      const line = sanitiseRivalLine(await complete(snapshot, recentLines));
      if (line.length === 0) {
        throw new CommentaryError("The rival returned an empty line.");
      }
      return line;
    },
  };
}
