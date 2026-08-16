import { useCallback, useEffect, useRef, useState } from "react";
import { io as createClient } from "socket.io-client";
import type { Socket } from "socket.io-client";
import {
  isValidPlayerName,
  isValidRoomCode,
  normaliseRoomCode,
} from "@letter-game/protocol";
import type {
  AttackedPayload,
  ClientToServerEvents,
  PlayerProgress,
  RoomSnapshot,
  ServerToClientEvents,
} from "@letter-game/protocol";
import type { GameConfig } from "@letter-game/engine";

export type ConnectionStatus = "offline" | "connecting" | "online";

export interface UseRoomOptions {
  onAttacked?: (payload: AttackedPayload) => void;
}

export interface UseRoomResult {
  status: ConnectionStatus;
  room: RoomSnapshot | null;
  playerId: string | null;
  error: string | null;
  createRoom: (name: string, config?: Partial<GameConfig>) => void;
  joinRoom: (code: string, name: string) => void;
  leaveRoom: () => void;
  reportProgress: (progress: PlayerProgress) => void;
  sendAttack: (count: number) => void;
}

type ClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const RECONNECTION_ATTEMPTS = 4;

export function useRoom(options: UseRoomOptions = {}): UseRoomResult {
  const socketRef = useRef<ClientSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("offline");
  const [room, setRoom] = useState<RoomSnapshot | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onAttackedRef = useRef(options.onAttacked);

  useEffect(() => {
    onAttackedRef.current = options.onAttacked;
  }, [options.onAttacked]);

  const ensureSocket = useCallback((): ClientSocket => {
    if (socketRef.current !== null) {
      return socketRef.current;
    }

    const socket: ClientSocket = createClient({
      reconnectionAttempts: RECONNECTION_ATTEMPTS,
    });

    socket.on("connect", () => {
      setStatus("online");
      setError(null);
    });

    socket.on("disconnect", () => {
      setStatus("offline");
      setRoom(null);
    });

    socket.on("connect_error", () => {
      setStatus("offline");
      setError("Cannot reach the game server. Is it running on port 4000?");
    });

    socket.on("room:update", (snapshot) => {
      setRoom(snapshot);
    });

    socket.on("room:left", () => {
      setRoom(null);
    });

    socket.on("room:attacked", (payload) => {
      onAttackedRef.current?.(payload);
    });

    socketRef.current = socket;
    setStatus("connecting");
    return socket;
  }, []);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  const createRoom = useCallback(
    (name: string, config?: Partial<GameConfig>) => {
      if (!isValidPlayerName(name)) {
        setError("Enter a name first.");
        return;
      }

      setError(null);
      ensureSocket().emit("room:create", { name, config }, (result) => {
        if (result.ok) {
          setRoom(result.room);
          setPlayerId(result.playerId);
        } else {
          setError(result.message);
        }
      });
    },
    [ensureSocket]
  );

  const joinRoom = useCallback(
    (code: string, name: string) => {
      if (!isValidPlayerName(name)) {
        setError("Enter a name first.");
        return;
      }
      if (!isValidRoomCode(code)) {
        setError("Room codes are four letters or digits.");
        return;
      }

      setError(null);
      ensureSocket().emit(
        "room:join",
        { code: normaliseRoomCode(code), name },
        (result) => {
          if (result.ok) {
            setRoom(result.room);
            setPlayerId(result.playerId);
          } else {
            setError(result.message);
          }
        }
      );
    },
    [ensureSocket]
  );

  const sendAttack = useCallback((count: number) => {
    if (count > 0) {
      socketRef.current?.emit("room:attack", { count });
    }
  }, []);

  const reportProgress = useCallback((progress: PlayerProgress) => {
    socketRef.current?.emit("room:progress", progress);
  }, []);

  const leaveRoom = useCallback(() => {
    const socket = socketRef.current;
    if (socket === null) {
      return;
    }

    socket.emit("room:leave", () => {
      setRoom(null);
    });
  }, []);

  return {
    status,
    room,
    playerId,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    reportProgress,
    sendAttack,
  };
}
