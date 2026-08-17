import { readAccessKeys } from "@/access/access";

export interface ServerEnv {
  port: number;
  host: string;
  clientOrigin: string;
  anthropicApiKey: string | null;
  aiModel: string;
  commentaryModel: string;
  accessKeys: string[];
}

export const DEFAULT_ROUND_MODEL = "claude-sonnet-5";

export const DEFAULT_COMMENTARY_MODEL = "claude-haiku-4-5";

export function readEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  const port = Number(source.PORT ?? 4000);
  const apiKey = source.ANTHROPIC_API_KEY?.trim();

  return {
    port: Number.isFinite(port) ? port : 4000,
    host: source.HOST ?? "0.0.0.0",
    clientOrigin: source.CLIENT_ORIGIN ?? "http://localhost:3000",
    anthropicApiKey: apiKey ? apiKey : null,
    aiModel: source.ANTHROPIC_MODEL?.trim() || DEFAULT_ROUND_MODEL,
    commentaryModel:
      source.ANTHROPIC_COMMENTARY_MODEL?.trim() || DEFAULT_COMMENTARY_MODEL,
    accessKeys: readAccessKeys(source.AI_ACCESS_KEYS),
  };
}
