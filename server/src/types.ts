export type UserId = string;
export type RoomId = string;

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

export type ServerErrorCode =
  | "INVALID_PAYLOAD"
  | "INVALID_LOCATION"
  | "NOT_IN_ROOM"
  | "RATE_LIMITED"
  | "SERVER_ERROR";

export type ServerErrorPayload = {
  code: ServerErrorCode;
  message: string;
};
