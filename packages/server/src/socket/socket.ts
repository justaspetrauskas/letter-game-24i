import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import {
  ATTACKS_PER_WINDOW,
  ATTACK_REFILL_MS,
  PROGRESS_BROADCAST_MS,
  sanitiseAttackCount,
} from "@letter-game/protocol";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@letter-game/protocol";
import { RoomRegistry } from "@/rooms/rooms";
import { createRateLimiter } from "@/rateLimit/rateLimit";

export type GameSocketServer = Server<
  ClientToServerEvents,
  ServerToClientEvents
>;

export interface SocketServerOptions {
  clientOrigin: string;
}

function respond<T>(ack: unknown, payload: T): void {
  if (typeof ack === "function") {
    (ack as (value: T) => void)(payload);
  }
}

export function attachSocketServer(
  httpServer: HttpServer,
  registry: RoomRegistry,
  options: SocketServerOptions
): GameSocketServer {
  const io: GameSocketServer = new Server(httpServer, {
    cors: {
      origin: options.clientOrigin,
      methods: ["GET", "POST"],
    },
  });

  const attackLimiter = createRateLimiter({
    capacity: ATTACKS_PER_WINDOW,
    refillMs: ATTACK_REFILL_MS,
  });

  const pendingBroadcasts = new Map<string, ReturnType<typeof setTimeout>>();
  const lastBroadcastAtMs = new Map<string, number>();

  const forgetRoom = (code: string): void => {
    const timer = pendingBroadcasts.get(code);
    if (timer) {
      clearTimeout(timer);
      pendingBroadcasts.delete(code);
    }
    lastBroadcastAtMs.delete(code);
  };

  const broadcastRoom = (code: string): void => {
    const snapshot = registry.snapshot(code);
    if (snapshot) {
      io.to(code).emit("room:update", snapshot);
      return;
    }
    forgetRoom(code);
  };

  const scheduleBroadcast = (code: string): void => {
    if (pendingBroadcasts.has(code)) {
      return;
    }

    const elapsed = Date.now() - (lastBroadcastAtMs.get(code) ?? 0);
    const timer = setTimeout(
      () => {
        pendingBroadcasts.delete(code);
        lastBroadcastAtMs.set(code, Date.now());
        broadcastRoom(code);
      },
      Math.max(0, PROGRESS_BROADCAST_MS - elapsed)
    );

    timer.unref?.();
    pendingBroadcasts.set(code, timer);
  };

  io.on("connection", (socket) => {
    const detachFrom = (previousCode: string | null, nextCode: string): void => {
      if (previousCode && previousCode !== nextCode) {
        socket.leave(previousCode);
        broadcastRoom(previousCode);
      }
    };

    socket.on("room:create", (payload, ack) => {
      const previousCode = registry.roomOf(socket.id);
      const result = registry.create(
        socket.id,
        payload?.name ?? "",
        payload?.config
      );

      if (result.ok) {
        socket.join(result.room.code);
        detachFrom(previousCode, result.room.code);
      }

      respond(ack, result);
    });

    socket.on("room:join", (payload, ack) => {
      const previousCode = registry.roomOf(socket.id);
      const result = registry.join(
        socket.id,
        payload?.code ?? "",
        payload?.name ?? ""
      );

      if (result.ok) {
        socket.join(result.room.code);
        detachFrom(previousCode, result.room.code);
      }

      respond(ack, result);

      if (result.ok) {
        broadcastRoom(result.room.code);
      }
    });

    socket.on("room:leave", (ack) => {
      const code = registry.leave(socket.id);

      if (code) {
        socket.leave(code);
        socket.emit("room:left", { code });
        broadcastRoom(code);
      }

      respond(ack, { ok: code !== null });
    });

    socket.on("room:progress", (progress) => {
      const code = registry.updateProgress(socket.id, progress);
      if (code) {
        scheduleBroadcast(code);
      }
    });

    socket.on("room:attack", (payload) => {
      const code = registry.roomOf(socket.id);
      if (!code) {
        return;
      }

      const count = sanitiseAttackCount(payload?.count);
      if (count <= 0 || !attackLimiter.take(socket.id)) {
        return;
      }

      const sender = registry
        .snapshot(code)
        ?.players.find((player) => player.id === socket.id);

      socket.to(code).emit("room:attacked", {
        from: sender?.name ?? "Someone",
        count,
      });
    });

    socket.on("disconnect", () => {
      const code = registry.leave(socket.id);
      if (code) {
        broadcastRoom(code);
      }
    });
  });

  return io;
}
