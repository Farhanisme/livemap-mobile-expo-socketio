# API

Status: Ready for demo

This document defines the Socket.IO event contract for the LiveMap MVP. The contract uses client-generated `userId` as the primary identity. `socket.id` is only a transport connection identifier.

## Shared Types

```ts
type RemoteUser = {
  userId: string;
  socketId?: string;
  name: string;
  roomId: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  isSharing: boolean;
  updatedAt?: number;
  connectedAt: number;
};
```

```ts
type LocationPayload = {
  userId: string;
  roomId: string;
  name: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: number;
};
```

## Client to Server Events

### `join_room`

Purpose:
- Join or rejoin a realtime room.

Payload:
```ts
{
  userId: string;
  name: string;
  roomId: string;
}
```

Validation:
- `userId` is required, trimmed, and at most 128 characters.
- `name` is required, trimmed, and at most 24 characters.
- `roomId` is required, trimmed, at most 32 characters, and may contain letters, numbers, dash, and underscore.

Server behavior:
- Adds or updates the user in the room store.
- If the same `userId` rejoins the same room, updates `socketId` instead of creating a duplicate.
- Makes any old socket for the same user leave the room when replaced.
- Emits `room_users` to the joining socket.
- Emits `user_joined` to the room.

### `location_update`

Purpose:
- Send the current user's foreground location to the room.

Payload:
```ts
{
  userId: string;
  roomId: string;
  name: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: number;
}
```

Validation:
- User must already be joined to the room.
- The socket must match the stored connection for the same `roomId:userId`.
- `latitude` must be a finite number between `-90` and `90`.
- `longitude` must be a finite number between `-180` and `180`.
- `timestamp` must be a positive number.
- `accuracy`, `speed`, and `heading` may be finite numbers, `null`, or omitted.

Server behavior:
- Applies rate limit of one accepted update per `roomId:userId` per second.
- Updates the in-memory user location.
- Sets `isSharing` to `true`.
- Emits `location_updated` to all users in the room, including the sender.

### `stop_sharing`

Purpose:
- Stop foreground location sharing while keeping the user in the room.

Payload:
```ts
{
  userId: string;
  roomId: string;
}
```

Validation:
- User must already be joined to the room.
- The socket must match the stored connection for the same `roomId:userId`.

Server behavior:
- Sets `isSharing` to `false`.
- Emits `user_stopped_sharing` to the room.

### `leave_room`

Purpose:
- Manually remove a user from a room.

Payload:
```ts
{
  userId: string;
  roomId: string;
}
```

Validation:
- User must already be joined to the room.
- The socket must match the stored connection for the same `roomId:userId`.

Server behavior:
- Removes the user from the in-memory room store.
- Makes the socket leave the Socket.IO room.
- Emits `user_left` to the room.

## Server to Client Events

### `room_users`

Purpose:
- Send the current connected users for a room after join or reconnect.

Payload:
```ts
{
  roomId: string;
  users: RemoteUser[];
}
```

Client behavior:
- Replace local room users by `userId`.
- Use this event to restore room state after reconnect.

### `user_joined`

Purpose:
- Notify room members that a user joined or rejoined.

Payload:
```ts
{
  roomId: string;
  user: RemoteUser;
}
```

Client behavior:
- Upsert the user by `userId`.

### `location_updated`

Purpose:
- Notify room members that a user's location changed.

Payload:
```ts
{
  roomId: string;
  user: RemoteUser;
}
```

Broadcast rule:
- Emitted to all users in the room, including the sender.

Client behavior:
- Upsert the user by `userId`.
- Render a remote marker only when `user.userId !== currentUserId`, `isSharing === true`, and coordinates are valid.
- Keep own marker sourced from local device location to avoid duplicate self markers.

### `user_stopped_sharing`

Purpose:
- Notify room members that a user stopped sharing location.

Payload:
```ts
{
  roomId: string;
  userId: string;
}
```

Client behavior:
- Mark that user as not sharing.
- Hide their remote marker in the MVP UI.

### `user_left`

Purpose:
- Notify room members that a user left or disconnected.

Payload:
```ts
{
  roomId: string;
  userId: string;
}
```

Client behavior:
- Remove that user from local room state.
- Remove that user's remote marker.

### `server_error`

Purpose:
- Notify a client about validation or server-side errors.

Payload:
```ts
{
  code: "INVALID_PAYLOAD" | "INVALID_LOCATION" | "NOT_IN_ROOM" | "RATE_LIMITED" | "SERVER_ERROR";
  message: string;
}
```

Client behavior:
- Show an event-level error message.
- Do not treat all `server_error` events as fatal socket disconnects.
