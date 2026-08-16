import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { STEP_MS, createGame, stepMany } from "@letter-game/engine";
import {
  sanitiseRecentLines,
  sanitiseRivalSnapshot,
  shouldCommentate,
} from "@letter-game/protocol";
import type {
  CapabilitiesResponse,
  RivalResponse,
  ThemedRound,
} from "@letter-game/protocol";
import { RoomRegistry } from "@/rooms/rooms";
import { attachSocketServer } from "@/socket/socket";
import type { GameSocketServer } from "@/socket/socket";
import type { ServerEnv } from "@/env/env";
import { RoundGenerationError, createRoundService } from "@/ai/rounds/rounds";
import type { RoundService } from "@/ai/rounds/rounds";
import { CommentaryError, createCommentaryService } from "@/ai/commentary/commentary";
import type { CommentaryService } from "@/ai/commentary/commentary";
import { createRateLimiter } from "@/rateLimit/rateLimit";
import type { RateLimiter } from "@/rateLimit/rateLimit";

const CLIENT_DIST = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../client/dist"
);

const MAX_SIMULATED_SECONDS = 120;

const ROUND_REQUESTS_PER_WINDOW = 5;

const ROUND_REFILL_MS = 60_000;

const RIVAL_REQUESTS_PER_WINDOW = 10;

const RIVAL_REFILL_MS = 6_000;

const statusByRoundError: Record<string, number> = {
  ai_unavailable: 503,
  invalid_theme: 400,
  rate_limited: 429,
  generation_failed: 502,
  refused: 422,
};

export interface BuildServerOptions {
  roundService?: RoundService;
  commentaryService?: CommentaryService;
  rateLimiter?: RateLimiter;
  rivalRateLimiter?: RateLimiter;
}

export interface BuiltServer {
  app: FastifyInstance;
  io: GameSocketServer;
  registry: RoomRegistry;
  rounds: RoundService;
  commentary: CommentaryService;
  close: () => Promise<void>;
}

function clientKey(request: FastifyRequest): string {
  return request.ip ?? "unknown";
}

export function buildServer(
  env: ServerEnv,
  options: BuildServerOptions = {}
): BuiltServer {
  const app = Fastify({ logger: env.port !== 0 });
  const registry = new RoomRegistry();
  const io = attachSocketServer(app.server, registry, {
    clientOrigin: env.clientOrigin,
  });

  const rounds =
    options.roundService ??
    createRoundService({ apiKey: env.anthropicApiKey, model: env.aiModel });

  const commentary =
    options.commentaryService ??
    createCommentaryService({
      apiKey: env.anthropicApiKey,
      model: env.commentaryModel,
    });

  const roundLimiter =
    options.rateLimiter ??
    createRateLimiter({
      capacity: ROUND_REQUESTS_PER_WINDOW,
      refillMs: ROUND_REFILL_MS,
    });

  const rivalLimiter =
    options.rivalRateLimiter ??
    createRateLimiter({
      capacity: RIVAL_REQUESTS_PER_WINDOW,
      refillMs: RIVAL_REFILL_MS,
    });

  app.get("/health", async () => ({
    status: "ok",
    stepMs: STEP_MS,
    rooms: registry.roomCount,
    players: registry.playerCount,
  }));

  app.get("/api/capabilities", async (): Promise<CapabilitiesResponse> => ({
    ai: rounds.available,
  }));

  app.post<{ Body: { theme?: unknown } }>(
    "/api/rounds",
    async (request, reply): Promise<ThemedRound | { error: string; message: string }> => {
      if (!rounds.available) {
        return reply
          .status(statusByRoundError.ai_unavailable)
          .send({
            error: "ai_unavailable",
            message: "Round generation is not configured on this server.",
          });
      }

      if (!roundLimiter.take(clientKey(request))) {
        const retryAfterMs = roundLimiter.retryAfterMs(clientKey(request));
        return reply
          .status(statusByRoundError.rate_limited)
          .header("retry-after", Math.ceil(retryAfterMs / 1000))
          .send({
            error: "rate_limited",
            message: "Too many rounds generated. Wait a moment and try again.",
          });
      }

      try {
        return await rounds.generate(request.body?.theme as string);
      } catch (error) {
        if (error instanceof RoundGenerationError) {
          return reply
            .status(statusByRoundError[error.code] ?? 500)
            .send({ error: error.code, message: error.message });
        }
        request.log.error(error);
        return reply.status(502).send({
          error: "generation_failed",
          message: "Round generation failed. Try again.",
        });
      }
    }
  );

  app.post<{ Body: { snapshot?: unknown; recentLines?: unknown } }>(
    "/api/commentary",
    async (request, reply): Promise<RivalResponse | { error: string; message: string }> => {
      if (!commentary.available) {
        return reply.status(503).send({
          error: "ai_unavailable",
          message: "Commentary is not configured on this server.",
        });
      }

      if (!rivalLimiter.take(clientKey(request))) {
        return reply
          .status(429)
          .header(
            "retry-after",
            Math.ceil(rivalLimiter.retryAfterMs(clientKey(request)) / 1000)
          )
          .send({ error: "rate_limited", message: "Slow down." });
      }

      const snapshot = sanitiseRivalSnapshot(request.body?.snapshot);
      if (!shouldCommentate(snapshot)) {
        return reply
          .status(204)
          .send() as unknown as RivalResponse;
      }

      try {
        const line = await commentary.comment(
          snapshot,
          sanitiseRecentLines(request.body?.recentLines)
        );
        return { line };
      } catch (error) {
        if (error instanceof CommentaryError) {
          return reply
            .status(502)
            .send({ error: "commentary_failed", message: error.message });
        }
        request.log.error(error);
        return reply.status(502).send({
          error: "commentary_failed",
          message: "The rival went quiet.",
        });
      }
    }
  );

  app.get<{ Querystring: { seed?: string; seconds?: string } }>(
    "/api/simulate",
    async (request) => {
      const seed = Number(request.query.seed ?? 1);
      const seconds = Math.min(
        Number(request.query.seconds ?? 10),
        MAX_SIMULATED_SECONDS
      );
      const state = stepMany(
        createGame(seed),
        Math.round((seconds * 1000) / STEP_MS)
      );

      return {
        seed,
        seconds,
        tick: state.tick,
        status: state.status,
        spawned: state.spawned,
        missed: state.missed,
        level: state.level,
        letters: state.letters.map((letter) => letter.char),
      };
    }
  );

  if (existsSync(CLIENT_DIST)) {
    app.register(fastifyStatic, { root: CLIENT_DIST });
  }

  const close = async (): Promise<void> => {
    await io.close();
    await app.close();
  };

  return { app, io, registry, rounds, commentary, close };
}
