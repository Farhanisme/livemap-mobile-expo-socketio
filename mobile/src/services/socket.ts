import { io, type Socket } from "socket.io-client";

declare const process: {
  env: {
    EXPO_PUBLIC_SOCKET_URL?: string;
  };
};

let socket: Socket | null = null;

export function getSocket(): Socket {
  const socketUrl = process.env.EXPO_PUBLIC_SOCKET_URL;

  if (!socketUrl) {
    throw new Error("EXPO_PUBLIC_SOCKET_URL is not configured.");
  }

  if (!socket) {
    socket = io(socketUrl, {
      autoConnect: false,
      transports: ["websocket"],
    });
  }

  return socket;
}

export function disconnectSocket(): void {
  if (!socket) {
    return;
  }

  socket.removeAllListeners();
  socket.io.removeAllListeners();
  socket.disconnect();
  socket = null;
}
