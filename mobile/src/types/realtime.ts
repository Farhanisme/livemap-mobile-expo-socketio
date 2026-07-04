export type UserId = string;
export type RoomId = string;

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "error";

export type RemoteUser = {
  userId: UserId;
  socketId?: string;
  name: string;
  roomId: RoomId;
  latitude?: number;
  longitude?: number;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  isSharing: boolean;
  updatedAt?: number;
  connectedAt: number;
};

export type JoinRoomPayload = {
  userId: UserId;
  name: string;
  roomId: RoomId;
};

export type LocationPayload = {
  userId: UserId;
  roomId: RoomId;
  name: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: number;
};

export type StopSharingPayload = {
  userId: UserId;
  roomId: RoomId;
};

export type LeaveRoomPayload = {
  userId: UserId;
  roomId: RoomId;
};

export type RoomUsersPayload = {
  roomId: RoomId;
  users: RemoteUser[];
};

export type UserJoinedPayload = {
  roomId: RoomId;
  user: RemoteUser;
};

export type LocationUpdatedPayload = {
  roomId: RoomId;
  user: RemoteUser;
};

export type UserStoppedSharingPayload = {
  roomId: RoomId;
  userId: UserId;
};

export type UserLeftPayload = {
  roomId: RoomId;
  userId: UserId;
};

export type ServerErrorPayload = {
  code: string;
  message: string;
};
