# Architecture

Status: Ready for demo

LiveMap MVP is a local-demo realtime location sharing system. It uses an Expo React Native mobile client, a Node.js Socket.IO server, and an in-memory room store. There is no database, login, or background tracking in the MVP.

## High-Level Architecture

```text
Expo React Native client
  Join Room UI
  Live Map UI
  expo-location foreground watcher
  socket.io-client
        |
        | join_room / location_update / stop_sharing
        v
Node.js realtime server
  Express health endpoint
  Socket.IO rooms
  In-memory room store
  Payload validators
  Per-room per-user rate limit
        |
        | room_users / location_updated / user_left
        v
Other clients in the same room
```

## Mobile Client Responsibilities

- Generate a client-side `userId` for the app session.
- Collect display name and Room ID.
- Connect to Socket.IO only when joining a room.
- Emit `join_room` with `userId`, `name`, and `roomId`.
- Keep socket connection status visible.
- Request foreground location permission only after Start Sharing is pressed.
- Start and stop the Expo foreground location watcher.
- Emit throttled `location_update` events while sharing.
- Emit `stop_sharing` when sharing stops.
- Listen for live room events and store users by `userId`.
- Render own marker from local `currentLocation`.
- Render remote markers from server events only for other sharing users with valid coordinates.
- Rejoin automatically after reconnect using the existing session state.

## Server Responsibilities

- Expose an Express health endpoint at `/health`.
- Accept Socket.IO client connections.
- Validate all event payloads.
- Use Socket.IO rooms to isolate users by Room ID.
- Store live room state in memory only.
- Use client-generated `userId` as primary user identity.
- Treat `socket.id` only as the current transport connection identifier.
- Replace a user's `socketId` when the same `userId` rejoins the same room.
- Emit `location_updated` to all users in the room, including the sender.
- Remove or mark users inactive on disconnect.
- Enforce simple location update rate limiting.

## In-Memory Room Store

The server room store is shaped around room IDs and user IDs:

```ts
type RoomState = {
  usersById: Record<string, RemoteUser>;
  socketToUser: Record<string, string>;
};
```

Behavior:
- `usersById` prevents duplicate users for the same `userId`.
- `socketToUser` maps the current transport connection back to the user.
- Rejoining with the same `userId` updates the stored `socketId`.
- Last known location is preserved when possible.
- The store is reset if the server process restarts.

## Reconnect Behavior

Client reconnect flow:
1. Socket.IO reconnects after a temporary network failure.
2. The client keeps `userId`, `name`, and `roomId` in active React state/refs.
3. On socket `connect`, the client emits `join_room` again when an active session exists.
4. When `room_users` is received, local room state is reconciled by `userId`.
5. If the user was sharing and the watcher is still active, the latest known location is resent after room sync or the next watcher callback sends a new update.

Server reconnect flow:
1. `join_room` validates the payload.
2. Existing user is found by `roomId:userId`.
3. Old `socketId` mapping is removed.
4. New `socketId` is stored.
5. Old socket leaves the room if it still exists.
6. Server sends fresh `room_users`.

This prevents duplicate users and duplicate remote markers after reconnect.

## Rate Limit Behavior

- Server accepts at most one `location_update` per `roomId:userId` per second.
- Faster updates are ignored and are not broadcast.
- Client also throttles emissions and uses a normal watcher interval of around a few seconds.
- Rate limiting is in memory and resets when the server restarts.

## Local Network Notes

- Physical phones cannot use `localhost` to reach the laptop server.
- `EXPO_PUBLIC_SOCKET_URL` must point to the laptop's LAN IP, for example `http://192.168.1.10:3000`.
- Laptop and phones should be on the same WiFi for local demo.
- Firewall must allow inbound traffic to port `3000`.
- Restart Expo after changing mobile environment variables.

## Deployment Notes

- The MVP is designed for local demo first.
- If deployed later, use HTTPS/WSS, production CORS settings, and stronger operational security.
- Database persistence, authentication, room passwords, background tracking, and location history remain future scope and are intentionally not included.
