import type {
  JoinRoomPayload,
  LeaveRoomPayload,
  LocationPayload,
  RemoteUser,
  StopSharingPayload,
} from "./types.js";

type RoomState = {
  usersById: Record<string, RemoteUser>;
  socketToUser: Record<string, string>;
};

type RoomStore = Record<string, RoomState>;

const rooms: RoomStore = {};

function getOrCreateRoom(roomId: string): RoomState {
  rooms[roomId] ??= {
    usersById: {},
    socketToUser: {},
  };

  return rooms[roomId];
}

function cleanupRoom(roomId: string): void {
  const room = rooms[roomId];
  if (!room) {
    return;
  }

  if (Object.keys(room.usersById).length === 0) {
    delete rooms[roomId];
  }
}

export function joinRoom(payload: JoinRoomPayload, socketId: string): RemoteUser {
  const room = getOrCreateRoom(payload.roomId);
  const existingUser = room.usersById[payload.userId];

  if (existingUser?.socketId) {
    delete room.socketToUser[existingUser.socketId];
  }

  const user: RemoteUser = {
    ...existingUser,
    userId: payload.userId,
    socketId,
    name: payload.name,
    roomId: payload.roomId,
    isSharing: existingUser?.isSharing ?? false,
    connectedAt: existingUser?.connectedAt ?? Date.now(),
  };

  room.usersById[payload.userId] = user;
  room.socketToUser[socketId] = payload.userId;

  return user;
}

export function leaveRoom(payload: LeaveRoomPayload): RemoteUser | null {
  const room = rooms[payload.roomId];
  const user = room?.usersById[payload.userId];
  if (!room || !user) {
    return null;
  }

  if (user.socketId) {
    delete room.socketToUser[user.socketId];
  }

  delete room.usersById[payload.userId];
  cleanupRoom(payload.roomId);

  return user;
}

export function removeBySocketId(socketId: string): RemoteUser | null {
  for (const [roomId, room] of Object.entries(rooms)) {
    const userId = room.socketToUser[socketId];
    if (!userId) {
      continue;
    }

    const user = room.usersById[userId] ?? null;
    delete room.socketToUser[socketId];

    if (user) {
      const disconnectedUser: RemoteUser = {
        ...user,
        socketId: undefined,
        isSharing: false,
      };

      room.usersById[userId] = disconnectedUser;
    }

    cleanupRoom(roomId);
    return user;
  }

  return null;
}

export function updateLocation(payload: LocationPayload): RemoteUser | null {
  const room = rooms[payload.roomId];
  const user = room?.usersById[payload.userId];
  if (!room || !user) {
    return null;
  }

  const updatedUser: RemoteUser = {
    ...user,
    name: payload.name,
    latitude: payload.latitude,
    longitude: payload.longitude,
    accuracy: payload.accuracy,
    speed: payload.speed,
    heading: payload.heading,
    isSharing: true,
    updatedAt: Date.now(),
  };

  room.usersById[payload.userId] = updatedUser;
  return updatedUser;
}

export function stopSharing(payload: StopSharingPayload): RemoteUser | null {
  const room = rooms[payload.roomId];
  const user = room?.usersById[payload.userId];
  if (!room || !user) {
    return null;
  }

  const updatedUser: RemoteUser = {
    ...user,
    isSharing: false,
  };

  room.usersById[payload.userId] = updatedUser;
  return updatedUser;
}

export function getRoomUsers(roomId: string): RemoteUser[] {
  return Object.values(rooms[roomId]?.usersById ?? {}).filter((user) => user.socketId);
}

export function getUser(roomId: string, userId: string): RemoteUser | null {
  return rooms[roomId]?.usersById[userId] ?? null;
}
