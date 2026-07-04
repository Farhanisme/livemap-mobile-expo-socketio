import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

import { disconnectSocket, getSocket } from "../services/socket";
import type {
  ConnectionStatus,
  JoinRoomPayload,
  LocationUpdatedPayload,
  RemoteUser,
  RoomUsersPayload,
  ServerErrorPayload,
  UserJoinedPayload,
  UserLeftPayload,
  UserStoppedSharingPayload,
} from "../types/realtime";

type JoinRoomResult = {
  roomId: string;
  users: RemoteUser[];
};

type PendingJoin = {
  payload: JoinRoomPayload;
  resolve: (result: JoinRoomResult) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
};

const JOIN_TIMEOUT_MS = 10000;
const SERVER_UNREACHABLE_MESSAGE =
  "Cannot connect to realtime server. Check EXPO_PUBLIC_SOCKET_URL, WiFi, and whether the server is running.";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const pendingJoinRef = useRef<PendingJoin | null>(null);
  const activeSessionRef = useRef<JoinRoomPayload | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [roomUsersById, setRoomUsersById] = useState<Record<string, RemoteUser>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [roomSyncVersion, setRoomSyncVersion] = useState(0);

  const clearPendingJoin = useCallback(() => {
    const pendingJoin = pendingJoinRef.current;
    if (pendingJoin) {
      clearTimeout(pendingJoin.timeoutId);
      pendingJoinRef.current = null;
    }
  }, []);

  const rejectPendingJoin = useCallback((message: string) => {
    const pendingJoin = pendingJoinRef.current;
    if (!pendingJoin) {
      return;
    }

    clearTimeout(pendingJoin.timeoutId);
    pendingJoinRef.current = null;
    pendingJoin.reject(new Error(message));
  }, []);

  const attachSocketListeners = useCallback(
    (socket: Socket) => {
      socket.removeAllListeners();
      socket.io.removeAllListeners();

      socket.on("connect", () => {
        setConnectionStatus("connected");
        setErrorMessage(null);

        const pendingJoin = pendingJoinRef.current;
        if (pendingJoin) {
          socket.emit("join_room", pendingJoin.payload);
          return;
        }

        const activeSession = activeSessionRef.current;
        if (activeSession) {
          socket.emit("join_room", activeSession);
        }
      });

      socket.on("disconnect", () => {
        setConnectionStatus("disconnected");
      });

      socket.on("connect_error", (error) => {
        setConnectionStatus("error");
        const message = error.message ? `${SERVER_UNREACHABLE_MESSAGE} (${error.message})` : SERVER_UNREACHABLE_MESSAGE;
        setErrorMessage(message);
        rejectPendingJoin(message);
      });

      socket.io.on("reconnect_attempt", () => {
        setConnectionStatus("reconnecting");
      });

      socket.io.on("reconnect", () => {
        setConnectionStatus("connected");
      });

      socket.io.on("reconnect_error", (error) => {
        setConnectionStatus("error");
        setErrorMessage(
          error.message
            ? `Realtime reconnect failed. Check network and server status. (${error.message})`
            : "Realtime reconnect failed. Check network and server status.",
        );
      });

      socket.on("room_users", (payload: RoomUsersPayload) => {
        setRoomUsersById(
          payload.users.reduce<Record<string, RemoteUser>>((usersById, user) => {
            usersById[user.userId] = user;
            return usersById;
          }, {}),
        );
        setRoomSyncVersion((version) => version + 1);

        const pendingJoin = pendingJoinRef.current;
        if (pendingJoin && payload.roomId === pendingJoin.payload.roomId) {
          activeSessionRef.current = pendingJoin.payload;
          clearPendingJoin();
          pendingJoin.resolve({
            roomId: payload.roomId,
            users: payload.users,
          });
        }
      });

      socket.on("user_joined", (payload: UserJoinedPayload) => {
        setRoomUsersById((currentUsers) => ({
          ...currentUsers,
          [payload.user.userId]: payload.user,
        }));
      });

      socket.on("location_updated", (payload: LocationUpdatedPayload) => {
        setRoomUsersById((currentUsers) => ({
          ...currentUsers,
          [payload.user.userId]: payload.user,
        }));
      });

      socket.on("user_stopped_sharing", (payload: UserStoppedSharingPayload) => {
        setRoomUsersById((currentUsers) => {
          const user = currentUsers[payload.userId];
          if (!user) {
            return currentUsers;
          }

          return {
            ...currentUsers,
            [payload.userId]: {
              ...user,
              isSharing: false,
            },
          };
        });
      });

      socket.on("user_left", (payload: UserLeftPayload) => {
        setRoomUsersById((currentUsers) => {
          const nextUsers = { ...currentUsers };
          delete nextUsers[payload.userId];
          return nextUsers;
        });
      });

      socket.on("server_error", (payload: ServerErrorPayload) => {
        const message = payload.message || "Server returned an error.";
        if (pendingJoinRef.current) {
          setConnectionStatus(socket.connected ? "connected" : "idle");
        }
        setErrorMessage(message);
        rejectPendingJoin(message);
      });
    },
    [clearPendingJoin, rejectPendingJoin],
  );

  const joinRoom = useCallback(
    (payload: JoinRoomPayload): Promise<JoinRoomResult> => {
      setConnectionStatus("connecting");
      setErrorMessage(null);

      return new Promise((resolve, reject) => {
        let socket: Socket;

        try {
          socket = socketRef.current ?? getSocket();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unable to create socket.";
          setConnectionStatus("error");
          setErrorMessage(message);
          reject(new Error(message));
          return;
        }

        if (socketRef.current !== socket) {
          socketRef.current = socket;
          attachSocketListeners(socket);
        }

        clearPendingJoin();

        const timeoutId = setTimeout(() => {
          pendingJoinRef.current = null;
          setConnectionStatus("error");
          setErrorMessage(SERVER_UNREACHABLE_MESSAGE);
          reject(new Error(SERVER_UNREACHABLE_MESSAGE));
        }, JOIN_TIMEOUT_MS);

        pendingJoinRef.current = {
          payload,
          resolve,
          reject,
          timeoutId,
        };

        if (socket.connected) {
          socket.emit("join_room", payload);
          return;
        }

        socket.connect();
      });
    },
    [attachSocketListeners, clearPendingJoin],
  );

  useEffect(() => {
    return () => {
      clearPendingJoin();
      disconnectSocket();
      socketRef.current = null;
    };
  }, [clearPendingJoin]);

  return {
    connectionStatus,
    errorMessage,
    joinRoom,
    roomSyncVersion,
    roomUsers: Object.values(roomUsersById),
  };
}
