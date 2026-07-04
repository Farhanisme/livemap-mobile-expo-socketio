import type {
  JoinRoomPayload,
  LeaveRoomPayload,
  LocationPayload,
  StopSharingPayload,
} from "./types.js";

type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

const NAME_MAX_LENGTH = 24;
const ROOM_ID_MAX_LENGTH = 32;
const USER_ID_MAX_LENGTH = 128;
const ROOM_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function validateName(value: unknown): ValidationResult<string> {
  const name = normalizeString(value);
  if (!name) {
    return { ok: false, message: "Name is required." };
  }

  if (name.length > NAME_MAX_LENGTH) {
    return { ok: false, message: `Name must be at most ${NAME_MAX_LENGTH} characters.` };
  }

  return { ok: true, value: name };
}

export function validateRoomId(value: unknown): ValidationResult<string> {
  const roomId = normalizeString(value);
  if (!roomId) {
    return { ok: false, message: "Room ID is required." };
  }

  if (roomId.length > ROOM_ID_MAX_LENGTH) {
    return { ok: false, message: `Room ID must be at most ${ROOM_ID_MAX_LENGTH} characters.` };
  }

  if (!ROOM_ID_PATTERN.test(roomId)) {
    return {
      ok: false,
      message: "Room ID may only contain letters, numbers, dash, and underscore.",
    };
  }

  return { ok: true, value: roomId };
}

export function validateUserId(value: unknown): ValidationResult<string> {
  const userId = normalizeString(value);
  if (!userId) {
    return { ok: false, message: "User ID is required." };
  }

  if (userId.length > USER_ID_MAX_LENGTH) {
    return { ok: false, message: `User ID must be at most ${USER_ID_MAX_LENGTH} characters.` };
  }

  return { ok: true, value: userId };
}

export function validateLatitude(value: unknown): ValidationResult<number> {
  if (typeof value !== "number" || !Number.isFinite(value) || value < -90 || value > 90) {
    return { ok: false, message: "Latitude must be a number between -90 and 90." };
  }

  return { ok: true, value };
}

export function validateLongitude(value: unknown): ValidationResult<number> {
  if (typeof value !== "number" || !Number.isFinite(value) || value < -180 || value > 180) {
    return { ok: false, message: "Longitude must be a number between -180 and 180." };
  }

  return { ok: true, value };
}

export function validateTimestamp(value: unknown): ValidationResult<number> {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return { ok: false, message: "Timestamp must be a positive number." };
  }

  return { ok: true, value };
}

function validateOptionalNumber(value: unknown, field: string): ValidationResult<number | null | undefined> {
  if (value === undefined) {
    return { ok: true, value: undefined };
  }

  if (value === null) {
    return { ok: true, value: null };
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { ok: false, message: `${field} must be a number or null.` };
  }

  return { ok: true, value };
}

export function validateJoinRoomPayload(payload: unknown): ValidationResult<JoinRoomPayload> {
  if (!isObject(payload)) {
    return { ok: false, message: "Payload must be an object." };
  }

  const userId = validateUserId(payload.userId);
  if (!userId.ok) return userId;

  const name = validateName(payload.name);
  if (!name.ok) return name;

  const roomId = validateRoomId(payload.roomId);
  if (!roomId.ok) return roomId;

  return {
    ok: true,
    value: {
      userId: userId.value,
      name: name.value,
      roomId: roomId.value,
    },
  };
}

export function validateLocationPayload(payload: unknown): ValidationResult<LocationPayload> {
  if (!isObject(payload)) {
    return { ok: false, message: "Payload must be an object." };
  }

  const userId = validateUserId(payload.userId);
  if (!userId.ok) return userId;

  const name = validateName(payload.name);
  if (!name.ok) return name;

  const roomId = validateRoomId(payload.roomId);
  if (!roomId.ok) return roomId;

  const latitude = validateLatitude(payload.latitude);
  if (!latitude.ok) return latitude;

  const longitude = validateLongitude(payload.longitude);
  if (!longitude.ok) return longitude;

  const timestamp = validateTimestamp(payload.timestamp);
  if (!timestamp.ok) return timestamp;

  const accuracy = validateOptionalNumber(payload.accuracy, "Accuracy");
  if (!accuracy.ok) return accuracy;

  const speed = validateOptionalNumber(payload.speed, "Speed");
  if (!speed.ok) return speed;

  const heading = validateOptionalNumber(payload.heading, "Heading");
  if (!heading.ok) return heading;

  return {
    ok: true,
    value: {
      userId: userId.value,
      roomId: roomId.value,
      name: name.value,
      latitude: latitude.value,
      longitude: longitude.value,
      accuracy: accuracy.value,
      speed: speed.value,
      heading: heading.value,
      timestamp: timestamp.value,
    },
  };
}

export function validateStopSharingPayload(payload: unknown): ValidationResult<StopSharingPayload> {
  if (!isObject(payload)) {
    return { ok: false, message: "Payload must be an object." };
  }

  const userId = validateUserId(payload.userId);
  if (!userId.ok) return userId;

  const roomId = validateRoomId(payload.roomId);
  if (!roomId.ok) return roomId;

  return { ok: true, value: { userId: userId.value, roomId: roomId.value } };
}

export function validateLeaveRoomPayload(payload: unknown): ValidationResult<LeaveRoomPayload> {
  if (!isObject(payload)) {
    return { ok: false, message: "Payload must be an object." };
  }

  const userId = validateUserId(payload.userId);
  if (!userId.ok) return userId;

  const roomId = validateRoomId(payload.roomId);
  if (!roomId.ok) return roomId;

  return { ok: true, value: { userId: userId.value, roomId: roomId.value } };
}
