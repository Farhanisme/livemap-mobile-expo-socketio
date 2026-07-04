import "dotenv/config";

import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

import { canAcceptLocationUpdate } from "./rateLimit.js";
import {
  getRoomUsers,
  getUser,
  joinRoom,
  leaveRoom,
  removeBySocketId,
  stopSharing,
  updateLocation,
} from "./roomStore.js";
import type { ServerErrorCode } from "./types.js";
import {
  validateJoinRoomPayload,
  validateLeaveRoomPayload,
  validateLocationPayload,
  validateStopSharingPayload,
} from "./validators.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);
const clientOrigin = process.env.CLIENT_ORIGIN ?? "*";

app.use(cors({ origin: clientOrigin }));
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: clientOrigin,
  },
});

function emitServerError(
  socket: Parameters<Parameters<typeof io.on>[1]>[0],
  code: ServerErrorCode,
  message: string,
): void {
  socket.emit("server_error", { code, message });
}

io.on("connection", (socket) => {
  socket.on("join_room", (payload) => {
    const validation = validateJoinRoomPayload(payload);
    if (!validation.ok) {
      emitServerError(socket, "INVALID_PAYLOAD", validation.message);
      return;
    }

    const existingUser = getUser(validation.value.roomId, validation.value.userId);
    if (existingUser?.socketId && existingUser.socketId !== socket.id) {
      io.sockets.sockets.get(existingUser.socketId)?.leave(validation.value.roomId);
    }

    const user = joinRoom(validation.value, socket.id);
    socket.join(validation.value.roomId);

    socket.emit("room_users", {
      roomId: validation.value.roomId,
      users: getRoomUsers(validation.value.roomId),
    });

    io.to(validation.value.roomId).emit("user_joined", {
      roomId: validation.value.roomId,
      user,
    });
  });

  socket.on("location_update", (payload) => {
    const validation = validateLocationPayload(payload);
    if (!validation.ok) {
      emitServerError(socket, "INVALID_LOCATION", validation.message);
      return;
    }

    const existingUser = getUser(validation.value.roomId, validation.value.userId);
    if (!existingUser) {
      emitServerError(socket, "NOT_IN_ROOM", "User must join the room before sending location.");
      return;
    }

    if (existingUser.socketId !== socket.id) {
      emitServerError(socket, "NOT_IN_ROOM", "User is not associated with this socket connection.");
      return;
    }

    if (!canAcceptLocationUpdate(validation.value.roomId, validation.value.userId)) {
      return;
    }

    const user = updateLocation(validation.value);
    if (!user) {
      emitServerError(socket, "SERVER_ERROR", "Failed to update location.");
      return;
    }

    io.to(validation.value.roomId).emit("location_updated", {
      roomId: validation.value.roomId,
      user,
    });
  });

  socket.on("stop_sharing", (payload) => {
    const validation = validateStopSharingPayload(payload);
    if (!validation.ok) {
      emitServerError(socket, "INVALID_PAYLOAD", validation.message);
      return;
    }

    const existingUser = getUser(validation.value.roomId, validation.value.userId);
    if (!existingUser || existingUser.socketId !== socket.id) {
      emitServerError(socket, "NOT_IN_ROOM", "User must join the room before stopping sharing.");
      return;
    }

    const user = stopSharing(validation.value);
    if (!user) {
      emitServerError(socket, "SERVER_ERROR", "Failed to stop sharing.");
      return;
    }

    io.to(validation.value.roomId).emit("user_stopped_sharing", {
      roomId: validation.value.roomId,
      userId: validation.value.userId,
    });
  });

  socket.on("leave_room", (payload) => {
    const validation = validateLeaveRoomPayload(payload);
    if (!validation.ok) {
      emitServerError(socket, "INVALID_PAYLOAD", validation.message);
      return;
    }

    const existingUser = getUser(validation.value.roomId, validation.value.userId);
    if (!existingUser || existingUser.socketId !== socket.id) {
      emitServerError(socket, "NOT_IN_ROOM", "User must join the room before leaving.");
      return;
    }

    const user = leaveRoom(validation.value);
    socket.leave(validation.value.roomId);

    if (!user) {
      emitServerError(socket, "SERVER_ERROR", "Failed to leave room.");
      return;
    }

    io.to(validation.value.roomId).emit("user_left", {
      roomId: validation.value.roomId,
      userId: validation.value.userId,
    });
  });

  socket.on("disconnect", () => {
    const user = removeBySocketId(socket.id);
    if (!user) {
      return;
    }

    io.to(user.roomId).emit("user_left", {
      roomId: user.roomId,
      userId: user.userId,
    });
  });
});

httpServer.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log("Socket.IO ready");
});
