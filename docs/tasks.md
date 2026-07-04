# tasks.md — LiveMap MVP Implementation Checklist

**Project:** Realtime Location Sharing Mobile App  
**Source of Truth:** `docs/prd.md`  
**Execution Mode:** Phase-based AI-assisted coding  
**Compatible With:** Codex GPT-5.5, Gemini, Antigravity, Cursor, Windsurf, or manual implementation  
**Rule:** Build one phase at a time. Do not skip validation gates.

---

## 0. How to Use This File

This file is the execution checklist for building the LiveMap MVP.

Use it like this:

1. Open `docs/prd.md`.
2. Open this `docs/tasks.md`.
3. Pick the next incomplete phase.
4. Give only that phase to the coding agent.
5. Make the agent modify only the allowed scope.
6. Run the validation steps.
7. Commit the working phase.
8. Continue to the next phase only after the current phase passes.

Do **not** ask the coding agent to build the whole application in one prompt.

---

## 1. Global Implementation Rules

These rules apply to every phase.

### 1.1 Scope Rules

- Do not add database.
- Do not add login/register.
- Do not add background tracking.
- Do not add route navigation.
- Do not add chat.
- Do not add push notification.
- Do not add map search/place search.
- Do not add production security features beyond MVP requirements.
- Do not implement optional features until the mandatory MVP works.

### 1.2 Technical Decisions

- Client: Expo React Native + TypeScript.
- Server: Node.js + Express + Socket.IO.
- Realtime: Socket.IO rooms.
- Map: `react-native-maps`.
- Location: `expo-location`.
- Storage: in-memory server store only.
- User identity: client-generated `userId`.
- `socket.id`: transport identifier only.
- `location_updated`: server emits to all room users including sender.
- Reconnect: client re-emits `join_room` after connect/reconnect.
- Rate limit: server accepts at most 1 `location_update` per user per second.

### 1.3 AI Agent Rules

When using a coding agent:

- Tell it to read `docs/prd.md` and `docs/tasks.md`.
- Tell it which phase to implement.
- Tell it not to implement future phases.
- Tell it to list changed files.
- Tell it to run build/typecheck where possible.
- Tell it to provide manual test steps.
- Review its changes before moving on.

### 1.4 Git Rules

Commit after each working phase.

Suggested commit pattern:

```bash
git add .
git commit -m "feat(scope): short description"
```

Do not accumulate many phases in one commit.

---

## 2. Phase Overview

| Phase | Name | Main Goal | Must Pass Before Next |
|---|---|---|---|
| 0 | Repository Preparation | Create structure and docs | Repo initialized |
| 1 | Server Core | Socket.IO backend with rooms | Server can join/update/broadcast |
| 2 | Mobile Setup | Expo app runs | App opens in Expo Go |
| 3 | Join Room | User can join room from app | Client receives `room_users` |
| 4 | Map Screen | Map UI displays | Map renders with dummy marker |
| 5 | Own Location Sharing | User can share own location | Server receives location updates |
| 6 | Remote Markers | Multi-user realtime map | Two devices see each other |
| 7 | Reconnect & Stability | Robust socket behavior | Reconnect without duplicates |
| 8 | Polish & Demo | Presentable MVP | Demo-ready |
| 9 | Final Review | Clean docs and validation | Project ready to submit/demo |

---

# Phase 0 — Repository Preparation

## Goal

Create a clean project structure and documentation foundation.

## Allowed Scope

- Root project folder.
- `docs/`.
- Git initialization.
- Placeholder files only.

## Tasks

### T0.1 — Create Root Structure

Create:

```text
realtime-location-sharing/
  docs/
    prd.md
    tasks.md
    design.md
    architecture.md
    api.md
    test-plan.md
  server/
  mobile/
  README.md
```

### T0.2 — Place Existing Docs

- Put the finalized PRD into `docs/prd.md`.
- Put this file into `docs/tasks.md`.

### T0.3 — Create Placeholder Docs

Create placeholders:

```text
docs/design.md
docs/architecture.md
docs/api.md
docs/test-plan.md
```

Each placeholder should contain:

```md
# Title

Status: Draft

This file will be completed later.
```

### T0.4 — Initialize Git

Run:

```bash
git init
git add .
git commit -m "chore: initialize project docs"
```

## Validation

- Folder structure exists.
- `docs/prd.md` exists.
- `docs/tasks.md` exists.
- Git repository initialized.
- Initial commit created.

## Definition of Done

Phase 0 is done when the repository has the expected folder structure, docs are present, and the first commit exists.

---

# Phase 1 — Server Core

## Goal

Build a working realtime backend with Node.js, Express, Socket.IO, rooms, in-memory store, payload validation, and simple rate limit.

## Allowed Scope

Only modify:

```text
server/
```

Do not modify mobile app in this phase.

## Expected Server Structure

```text
server/
  package.json
  tsconfig.json
  .env.example
  src/
    index.ts
    types.ts
    roomStore.ts
    validators.ts
    rateLimit.ts
```

## Dependencies

Install:

```bash
npm install express socket.io cors dotenv
npm install -D typescript tsx @types/node @types/express @types/cors
```

## Tasks

### T1.1 — Initialize Server Package

Create `server/package.json` with scripts:

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts",
    "build": "tsc --noEmit"
  }
}
```

### T1.2 — Add TypeScript Config

Create `server/tsconfig.json`.

Requirements:
- Target modern Node.
- Strict or near-strict mode.
- No emit for typecheck build.

### T1.3 — Add Environment Example

Create `server/.env.example`:

```env
PORT=3000
CLIENT_ORIGIN=*
```

### T1.4 — Define Shared Server Types

Create `server/src/types.ts`.

Include:

```ts
export type RemoteUser = {
  userId: string;
  socketId: string;
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

export type JoinRoomPayload = {
  userId: string;
  name: string;
  roomId: string;
};

export type LocationPayload = {
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

export type StopSharingPayload = {
  userId: string;
  roomId: string;
};

export type LeaveRoomPayload = {
  userId: string;
  roomId: string;
};
```

### T1.5 — Implement Validators

Create `server/src/validators.ts`.

Implement:
- `normalizeName(name: unknown): string | null`
- `normalizeRoomId(roomId: unknown): string | null`
- `isValidUserId(userId: unknown): userId is string`
- `isValidLatitude(value: unknown): value is number`
- `isValidLongitude(value: unknown): value is number`
- `validateJoinRoomPayload(payload: unknown)`
- `validateLocationPayload(payload: unknown)`
- `validateStopSharingPayload(payload: unknown)`
- `validateLeaveRoomPayload(payload: unknown)`

Validation rules:
- `name`: required, string, trimmed, 1–24 chars.
- `roomId`: required, string, trimmed, 1–32 chars.
- `userId`: required, string, trimmed, 1–64 chars.
- `latitude`: number between -90 and 90.
- `longitude`: number between -180 and 180.
- `timestamp`: number.

### T1.6 — Implement In-Memory Room Store

Create `server/src/roomStore.ts`.

Required functions:

```ts
joinRoom(params: { socketId: string; userId: string; name: string; roomId: string }): RemoteUser
leaveRoom(params: { socketId: string; userId: string; roomId: string }): RemoteUser | null
removeBySocketId(socketId: string): { roomId: string; user: RemoteUser } | null
updateLocation(params: LocationPayload & { socketId: string }): RemoteUser | null
stopSharing(params: { userId: string; roomId: string }): RemoteUser | null
getRoomUsers(roomId: string): RemoteUser[]
getUser(roomId: string, userId: string): RemoteUser | null
```

Store shape:

```ts
type RoomState = {
  usersById: Record<string, RemoteUser>;
  socketToUser: Record<string, string>;
};

const rooms: Record<string, RoomState> = {};
```

Reconnect behavior:
- If same `userId` joins same `roomId`, update `socketId`.
- Remove old socket mapping for that user if needed.
- Preserve last known location if available.
- Preserve `isSharing` if already true, unless explicitly stopped.

### T1.7 — Implement Rate Limit

Create `server/src/rateLimit.ts`.

Rule:
- Maximum 1 accepted `location_update` per `roomId:userId` per second.
- If update is too fast, return false.
- Do not crash.

Example API:

```ts
export function canAcceptLocationUpdate(roomId: string, userId: string): boolean
```

### T1.8 — Implement Socket.IO Server

Create `server/src/index.ts`.

Server must:
- Load `.env`.
- Start Express server.
- Start Socket.IO server.
- Enable CORS.
- Listen on `PORT`.

Socket events:
- `join_room`
- `location_update`
- `stop_sharing`
- `leave_room`
- `disconnect`

Server-to-client events:
- `room_users`
- `user_joined`
- `location_updated`
- `user_stopped_sharing`
- `user_left`
- `server_error`

Important:
- `location_updated` must be emitted to all users in the room including sender.
- Use `io.to(roomId).emit(...)`.
- Do not broadcast to all sockets globally.
- Do not write database code.

### T1.9 — Add Basic Server Logging

Log:
- server started.
- socket connected.
- user joined room.
- location update accepted.
- location update rate-limited.
- user stopped sharing.
- user left/disconnected.

Do not log excessive sensitive location details in production style. For MVP, brief logs are okay.

## Validation

Run:

```bash
cd server
npm install
npm run build
npm run dev
```

Manual check:
- Server starts on port 3000.
- No TypeScript errors.
- Logs show Socket.IO ready.

Optional quick socket test:
- Use a small temporary Node client or browser console if desired.
- Verify `join_room` returns `room_users`.

## Definition of Done

Phase 1 is done when:

- Server starts successfully.
- Typecheck passes.
- `join_room` works.
- `location_update` validates and broadcasts.
- Rate limit exists.
- Different rooms are isolated by design.
- No database exists.

## Suggested Commit

```bash
git add .
git commit -m "feat(server): implement socket room core"
```

---

# Phase 2 — Mobile Project Setup

## Goal

Create an Expo React Native TypeScript app that opens in Expo Go.

## Allowed Scope

Only modify:

```text
mobile/
```

Do not modify server in this phase unless a tiny config fix is required.

## Expected Mobile Structure

```text
mobile/
  package.json
  app.json
  tsconfig.json
  .env.example
  src/
    components/
    screens/
    hooks/
    services/
    types/
    utils/
```

## Dependencies

Install or ensure available:

```bash
npx create-expo-app@latest mobile --template
cd mobile
npx expo install expo-location react-native-maps
npm install socket.io-client
```

If the template does not use TypeScript, convert to TypeScript.

## Tasks

### T2.1 — Initialize Expo App

Create an Expo app in `mobile/`.

Requirements:
- TypeScript.
- Runs in Expo Go.
- No complex navigation required yet.

### T2.2 — Add Dependencies

Install:
- `expo-location`
- `react-native-maps`
- `socket.io-client`

Optional:
- `react-native-safe-area-context` if needed.
- AsyncStorage only if the implementation chooses to persist `userId`.

### T2.3 — Create Folder Structure

Create:

```text
src/
  components/
  screens/
  hooks/
  services/
  types/
  utils/
```

### T2.4 — Add Mobile Environment Example

Create `mobile/.env.example`:

```env
EXPO_PUBLIC_SOCKET_URL=http://192.168.1.10:3000
```

### T2.5 — Add Basic App Shell

App should show a simple placeholder screen:

```text
LiveMap MVP
App is running.
```

## Validation

Run:

```bash
cd mobile
npm install
npx expo start
```

Open in Expo Go.

## Definition of Done

Phase 2 is done when:

- Expo app starts.
- Expo Go opens the app.
- No runtime crash.
- Required dependencies are installed.

## Suggested Commit

```bash
git add .
git commit -m "feat(mobile): initialize expo app"
```

---

# Phase 3 — Join Room UI and Socket Connection

## Goal

Allow user to enter name and Room ID, connect to server, emit `join_room`, and receive `room_users`.

## Allowed Scope

Modify:

```text
mobile/src/
mobile/App.tsx or app entry file
mobile/.env.example
```

Do not implement map or location sharing yet.

## Tasks

### T3.1 — Add Realtime Types

Create `mobile/src/types/realtime.ts`.

Mirror server event payload types:
- `RemoteUser`
- `JoinRoomPayload`
- `LocationPayload`
- `StopSharingPayload`
- `LeaveRoomPayload`

### T3.2 — Add User ID Utility

Create `mobile/src/utils/generateUserId.ts`.

Requirements:
- Generate a stable random user ID for the current app session.
- Format can be simple: `user_${Date.now()}_${randomString}`.
- Do not use `socket.id` as user ID.

Optional:
- Use AsyncStorage later, but not required in this phase.

### T3.3 — Add Socket Service

Create `mobile/src/services/socket.ts`.

Requirements:
- Read `EXPO_PUBLIC_SOCKET_URL`.
- Create Socket.IO client.
- Do not auto-connect until needed, or allow controlled connection.
- Export helper to get socket instance.

### T3.4 — Add `useSocket` Hook

Create `mobile/src/hooks/useSocket.ts`.

Responsibilities:
- Connect/disconnect socket.
- Track connection status:
  - `idle`
  - `connecting`
  - `connected`
  - `disconnected`
  - `reconnecting`
  - `error`
- Emit `join_room`.
- Listen to `room_users`.
- Listen to `server_error`.

### T3.5 — Build Join Room Screen

Create `mobile/src/screens/JoinRoomScreen.tsx`.

UI:
- App title.
- Short description.
- Name input.
- Room ID input.
- Join button.
- Error text.

Validation:
- Name required.
- Room ID required.
- Trim input.
- Name max 24 chars.
- Room ID max 32 chars.

### T3.6 — Wire Join Flow

In app entry:
- Show Join Room Screen initially.
- On join success:
  - Save `userId`, `name`, `roomId`.
  - Save initial `roomUsers`.
  - Navigate/switch to placeholder "Live Map Screen coming next".

For now, a simple state switch is enough. Navigation library is not required.

## Validation

Manual test:
1. Start server.
2. Start mobile app.
3. Enter name and Room ID.
4. Press Join Room.
5. Server logs user joined.
6. Client receives `room_users`.
7. App shows joined state or placeholder map state.

Error test:
1. Submit empty name.
2. Submit empty Room ID.
3. Confirm validation prevents join.

## Definition of Done

Phase 3 is done when:

- User can join room from the mobile app.
- Server receives `join_room`.
- Client receives `room_users`.
- Invalid input is blocked.
- No map or location feature is implemented yet.

## Suggested Commit

```bash
git add .
git commit -m "feat(mobile): add join room flow"
```

---

# Phase 4 — Map Screen with Dummy Marker

## Goal

Show a fullscreen map with basic UI overlays and a dummy marker.

## Allowed Scope

Modify:

```text
mobile/src/
```

Do not implement real location watcher yet.

## Tasks

### T4.1 — Create Live Map Screen

Create `mobile/src/screens/LiveMapScreen.tsx`.

Props:
- `userId`
- `name`
- `roomId`
- `roomUsers`
- connection status

### T4.2 — Render MapView

Use `react-native-maps`.

Fallback region:

```ts
{
  latitude: -2.5489,
  longitude: 118.0149,
  latitudeDelta: 20,
  longitudeDelta: 20
}
```

### T4.3 — Add Dummy Marker

Render one dummy marker for development.

Example:
- latitude: -5.1477
- longitude: 119.4327
- title: "Demo Marker"

### T4.4 — Add Header Overlay

Display:
- Room ID.
- Connection status.

### T4.5 — Add Action Buttons

Add UI buttons:
- Start Sharing.
- My Location.

They do not need full behavior yet.

### T4.6 — Add Active Users Panel Placeholder

Display:
- Active users count.
- User names from `roomUsers`.
- Empty room text if no other users.

### T4.7 — Connect Join Screen to Map Screen

After successful join, show `LiveMapScreen`.

## Validation

Manual test:
1. Start mobile app.
2. Join room.
3. Map screen appears.
4. Map renders.
5. Dummy marker appears.
6. Header and buttons appear.
7. App does not crash.

## Definition of Done

Phase 4 is done when:

- Map screen renders in Expo Go.
- Dummy marker appears.
- UI overlay appears.
- No real location logic exists yet.

## Suggested Commit

```bash
git add .
git commit -m "feat(mobile): add live map screen"
```

---

# Phase 5 — Own Location Sharing

## Goal

Allow the current user to start/stop foreground location sharing and send location updates to server.

## Allowed Scope

Modify:

```text
mobile/src/
```

Server should not need changes unless a bug is found.

## Tasks

### T5.1 — Create Location Types and Utilities

Create or update:
- `mobile/src/utils/locationUtils.ts`

Implement:
- coordinate validation if useful.
- optional distance helper only if needed for throttling.
- no distance UI yet.

### T5.2 — Create `useLocationSharing` Hook

Create `mobile/src/hooks/useLocationSharing.ts`.

Responsibilities:
- Request foreground location permission.
- Start location watcher.
- Stop location watcher.
- Track `isSharing`.
- Track `currentLocation`.
- Track `locationError`.
- Emit `location_update` to server.
- Throttle client emits to at most 1 per second, preferably 2–5 seconds normal interval.

Use Expo Location:
- requestForegroundPermissionsAsync
- getCurrentPositionAsync
- watchPositionAsync

### T5.3 — Add Permission Handling

When Start Sharing is pressed:
- Ask permission.
- If denied, show error.
- Do not emit location.
- Do not start watcher.

### T5.4 — Render Own Marker

In `LiveMapScreen`:
- If current location exists, show own marker.
- Marker title: user name or "You".
- Use a visually distinct marker color if possible.

### T5.5 — Emit Location Updates

Payload:

```ts
{
  userId,
  roomId,
  name,
  latitude,
  longitude,
  accuracy,
  speed,
  heading,
  timestamp
}
```

### T5.6 — Stop Sharing

When Stop Sharing is pressed:
- Stop watcher.
- Set `isSharing = false`.
- Emit `stop_sharing`.
- Keep user in room.
- Keep socket connected.

### T5.7 — My Location Button

Implement:
- If current location exists, animate/center map to it.
- If not available, show a simple message or no-op safely.

## Validation

One-device test:
1. Start server.
2. Start mobile app.
3. Join room.
4. Press Start Sharing.
5. Permission prompt appears.
6. Grant permission.
7. Own marker appears.
8. Server logs location update.
9. Press Stop Sharing.
10. Server logs stop sharing.
11. Location updates stop.

Permission denied test:
1. Deny permission.
2. App shows error.
3. App does not crash.
4. No location update is emitted.

## Definition of Done

Phase 5 is done when:

- User can start sharing.
- User can stop sharing.
- Own marker appears.
- Server receives valid location updates.
- Permission denied is handled.
- My Location button works safely.

## Suggested Commit

```bash
git add .
git commit -m "feat(mobile): add own location sharing"
```

---

# Phase 6 — Remote User Markers

## Goal

Display other users in the same room as realtime map markers.

## Allowed Scope

Modify:

```text
mobile/src/
```

Server changes only if event contract bug is found.

## Tasks

### T6.1 — Manage Remote Users State

In socket hook or map screen:
- Store users by `userId`.
- Avoid duplicate users.
- Do not key users by `socket.id`.

State shape example:

```ts
Record<string, RemoteUser>
```

### T6.2 — Listen to `room_users`

When received:
- Replace or reconcile remote users from server.
- Include self in state if useful, but avoid duplicate self marker.
- Filter users by `roomId`.

### T6.3 — Listen to `user_joined`

When received:
- Add/update user by `userId`.

### T6.4 — Listen to `location_updated`

When received:
- Upsert user by `userId`.
- If user has latitude/longitude and `isSharing = true`, show marker.
- If event is for current user, tolerate it and do not duplicate marker.

### T6.5 — Listen to `user_stopped_sharing`

When received:
- Set `isSharing = false` for that user.
- Hide marker or show inactive state.
- MVP recommendation: hide marker if no longer sharing.

### T6.6 — Listen to `user_left`

When received:
- Remove user from state by `userId`.

### T6.7 — Render Remote Markers

For each remote user:
- If `userId !== currentUserId`.
- If `isSharing === true`.
- If latitude/longitude exist.
- Render Marker.
- Show name in marker/callout.
- Show last updated if available.

### T6.8 — Active Users List

Update user list:
- Show current user.
- Show remote users.
- Show sharing/stopped status.
- Show last updated text.

### T6.9 — Format Last Updated

Create `mobile/src/utils/formatTimeAgo.ts`.

Examples:
- `now`
- `5s ago`
- `2m ago`

## Validation

Two-device test:
1. Start server.
2. Start app on Phone A.
3. Start app on Phone B.
4. Join same room.
5. Start sharing on Phone A.
6. Phone B sees Phone A marker.
7. Start sharing on Phone B.
8. Phone A sees Phone B marker.
9. Move one phone.
10. Marker updates on the other phone.

Stop sharing test:
1. Phone A presses Stop Sharing.
2. Phone B no longer sees active marker or sees inactive status.

Disconnect test:
1. Close app on Phone A.
2. Phone B receives user left/removal.

## Definition of Done

Phase 6 is done when:

- Multi-user realtime map works.
- Remote markers update automatically.
- Stop sharing updates remote UI.
- Disconnect removes remote user.
- No duplicate markers by `userId`.

## Suggested Commit

```bash
git add .
git commit -m "feat(mobile): add remote realtime markers"
```

---

# Phase 7 — Reconnect and Stability

## Goal

Make socket reconnect behavior reliable and prevent duplicate users/markers.

## Allowed Scope

Modify:

```text
mobile/src/
server/src/
```

Only make changes related to reconnect/stability.

## Tasks

### T7.1 — Client Session State

Ensure client stores during active session:
- `userId`
- `name`
- `roomId`
- `wasSharing`

This can be React state. AsyncStorage is optional.

### T7.2 — Auto Rejoin on Connect

In `useSocket`:
- On `connect`, if session exists, emit `join_room`.
- This handles both first connect and reconnect.
- Avoid emitting duplicate joins unnecessarily.

### T7.3 — Restore Room Users

On `room_users`:
- Replace/reconcile local users state.
- Avoid duplicate self marker.
- Remove stale users not in room list if appropriate.

### T7.4 — Maintain Sharing State

If user was sharing before reconnect:
- Keep watcher running if it is still active.
- Send latest known location after rejoin if available.
- Otherwise next watcher callback sends location.

### T7.5 — Server Reconnect Support

Verify server:
- Replaces old socket mapping for same `userId`.
- Updates socketId.
- Does not create duplicate user for same `userId`.
- Emits clean `room_users`.

### T7.6 — Connection Status UI

Connection states:
- Connected.
- Disconnected.
- Reconnecting.
- Error.

Show these in map header.

### T7.7 — Stale User Cleanup

Optional for MVP but useful:
- If disconnect event fires, remove user.
- Do not implement complex heartbeat beyond Socket.IO defaults.

## Validation

Reconnect test:
1. Two phones join same room.
2. Start sharing.
3. Turn WiFi off/on on one phone.
4. App shows disconnected/reconnecting.
5. App reconnects.
6. App rejoins room.
7. No duplicate marker appears.
8. Location sharing resumes or can be resumed cleanly.

Server restart test:
1. Two phones join same room.
2. Restart server.
3. Clients show disconnected/reconnecting.
4. After server returns, clients rejoin.
5. No crash.

## Definition of Done

Phase 7 is done when:

- Reconnect works without duplicate users.
- Client automatically rejoins room.
- Connection status is visible.
- App remains stable through temporary disconnect.

## Suggested Commit

```bash
git add .
git commit -m "fix(realtime): handle reconnect cleanly"
```

---

# Phase 8 — Polish and Demo Readiness

## Goal

Improve UI and documentation so the app is presentable for demo.

## Allowed Scope

Modify:

```text
mobile/src/
README.md
docs/test-plan.md
```

Server only if minor bug fixes are needed.

## Tasks

### T8.1 — Improve UI Layout

Polish:
- Better spacing.
- Better button placement.
- Better header overlay.
- Better user list.
- Clear sharing state.

### T8.2 — Improve Button States

Start/Stop button:
- Start Sharing when not sharing.
- Stop Sharing when sharing.
- Disabled while permission is being requested.

### T8.3 — Improve Error Messages

Add clear messages for:
- Permission denied.
- Server unreachable.
- Location unavailable.
- Disconnected/reconnecting.

### T8.4 — Active Users Panel

Show:
- Active user count.
- Current user.
- Remote users.
- Sharing status.
- Last updated.

Keep it simple. No complex bottom sheet library required unless already installed.

### T8.5 — Remove Dummy Marker

Ensure dummy marker from Phase 4 is removed or guarded behind development flag.

### T8.6 — README Setup Guide

Update root `README.md`.

Include:
- Project description.
- Tech stack.
- How to run server.
- How to run mobile.
- How to find laptop IP.
- How to set `EXPO_PUBLIC_SOCKET_URL`.
- Two-device test steps.
- Known limitations.

### T8.7 — Test Plan Doc

Fill `docs/test-plan.md`.

Include:
- One-device test.
- Two-device same room test.
- Different room isolation test.
- Stop sharing test.
- Disconnect test.
- Reconnect test.
- Permission denied test.

## Validation

Demo readiness test:
1. Fresh install dependencies.
2. Start server.
3. Start Expo.
4. Test with two devices.
5. Confirm all MVP features work.
6. README is enough for another person to run the project.

## Definition of Done

Phase 8 is done when:

- UI is presentable.
- README is complete.
- Test plan is complete.
- Dummy marker removed.
- Two-device demo works.

## Suggested Commit

```bash
git add .
git commit -m "chore: prepare demo-ready mvp"
```

---

# Phase 9 — Final Review and Handoff

## Goal

Perform final quality review before submission/demo.

## Allowed Scope

All files, but only for fixes and documentation cleanup.

## Tasks

### T9.1 — Verify Against PRD

Check:
- No database.
- No login.
- No background tracking.
- No routing/navigation feature.
- Realtime location works.
- Multi-user room works.
- Reconnect works.
- Rate limit exists.

### T9.2 — Verify File Structure

Expected:

```text
docs/prd.md
docs/tasks.md
docs/design.md
docs/architecture.md
docs/api.md
docs/test-plan.md
server/
mobile/
README.md
```

### T9.3 — Fill `docs/api.md`

Copy/clean final Socket.IO event contract:
- `join_room`
- `location_update`
- `stop_sharing`
- `leave_room`
- `room_users`
- `user_joined`
- `location_updated`
- `user_stopped_sharing`
- `user_left`
- `server_error`

### T9.4 — Fill `docs/architecture.md`

Include:
- High-level architecture.
- Client responsibilities.
- Server responsibilities.
- In-memory room store.
- Reconnect design.
- Deployment notes.

### T9.5 — Fill `docs/design.md`

If Google Stitch was used:
- Summarize final screen design from Stitch.
- Join Room Screen.
- Live Map Screen.
- Marker design.
- Button states.
- Error states.

If Google Stitch was not used:
- Write manual UI spec from implemented UI.

### T9.6 — Final Manual Test

Run:
- Server.
- Mobile app.
- Two-device test.
- Stop sharing.
- Disconnect.
- Reconnect.
- Different room isolation.

### T9.7 — Final Commit

```bash
git add .
git commit -m "docs: finalize mvp handoff"
```

## Definition of Done

Phase 9 is done when:

- Project matches PRD.
- All docs are updated.
- MVP demo passes.
- Final commit exists.

---

# 3. AI Prompt Templates Per Phase

Use these prompts when working with Codex/Gemini/Antigravity.

---

## Prompt Template — Phase 1 Server Core

```text
Context:
Read docs/prd.md and docs/tasks.md. Implement Phase 1 only: Server Core.

Scope:
Only modify the server/ folder.

Task:
Create a Node.js + Express + Socket.IO TypeScript backend with in-memory room store, validators, and simple rate limit.

Must implement:
- join_room
- location_update
- stop_sharing
- leave_room
- disconnect
- room_users
- user_joined
- location_updated
- user_stopped_sharing
- user_left
- server_error

Rules:
- No database.
- No login.
- Use client-generated userId.
- Do not use socket.id as primary user identity.
- location_updated must be emitted to all users in the room including sender.
- Apply max 1 location_update per user per second.
- Do not modify mobile/.

Validation:
- Run npm install if needed.
- Run npm run build.
- Explain how to run npm run dev.
- List changed files.
```

---

## Prompt Template — Phase 2 Mobile Setup

```text
Context:
Read docs/prd.md and docs/tasks.md. Implement Phase 2 only: Mobile Project Setup.

Scope:
Only modify the mobile/ folder.

Task:
Create an Expo React Native TypeScript app that runs in Expo Go. Install expo-location, react-native-maps, and socket.io-client. Add folder structure and .env.example.

Rules:
- Do not implement map screen yet.
- Do not implement socket join yet.
- Do not modify server/.
- Keep app simple and runnable.

Validation:
- Run npm install if needed.
- Explain how to run npx expo start.
- List changed files.
```

---

## Prompt Template — Phase 3 Join Room

```text
Context:
Read docs/prd.md and docs/tasks.md. Implement Phase 3 only: Join Room UI and Socket Connection.

Scope:
Modify only mobile/src and mobile app entry files.

Task:
Build JoinRoomScreen, generate client userId, connect to Socket.IO server, emit join_room, listen for room_users, and switch to a placeholder joined/map state.

Rules:
- Do not implement MapView yet.
- Do not implement location sharing yet.
- Use EXPO_PUBLIC_SOCKET_URL.
- userId must be client-generated, not socket.id.
- Validate name and roomId.

Validation:
- Explain manual test with local server.
- List changed files.
```

---

## Prompt Template — Phase 4 Map Screen

```text
Context:
Read docs/prd.md and docs/tasks.md. Implement Phase 4 only: Map Screen with Dummy Marker.

Scope:
Modify only mobile/src.

Task:
Create LiveMapScreen with react-native-maps, fallback Indonesia region, one dummy marker, room/status header, Start Sharing button, My Location button, and active users placeholder.

Rules:
- Do not implement real location sharing yet.
- Do not emit location_update yet.
- Do not modify server/.

Validation:
- Explain how to test in Expo Go.
- List changed files.
```

---

## Prompt Template — Phase 5 Own Location Sharing

```text
Context:
Read docs/prd.md and docs/tasks.md. Implement Phase 5 only: Own Location Sharing.

Scope:
Modify only mobile/src unless a server bug is found.

Task:
Implement foreground location permission, location watcher using expo-location, own marker rendering, location_update emission, Stop Sharing cleanup, and My Location button behavior.

Rules:
- No background tracking.
- Do not implement remote markers yet except preserving existing state.
- Emit no more than 1 location_update per second from client.
- Handle permission denied without crash.

Validation:
- Explain one-device test.
- Explain permission denied test.
- List changed files.
```

---

## Prompt Template — Phase 6 Remote Markers

```text
Context:
Read docs/prd.md and docs/tasks.md. Implement Phase 6 only: Remote User Markers.

Scope:
Modify only mobile/src unless event contract bug is found.

Task:
Listen to room_users, user_joined, location_updated, user_stopped_sharing, and user_left. Store users by userId. Render remote markers and active users list with last updated.

Rules:
- Do not key remote users by socket.id.
- Do not create duplicate marker for self.
- Hide or inactive marker when user stops sharing.
- Remove marker when user leaves.
- Do not add distance/routing/history.

Validation:
- Explain two-device same room test.
- Explain stop sharing test.
- Explain disconnect test.
- List changed files.
```

---

## Prompt Template — Phase 7 Reconnect

```text
Context:
Read docs/prd.md and docs/tasks.md. Implement Phase 7 only: Reconnect and Stability.

Scope:
Modify mobile/src and server/src only where necessary.

Task:
Make client auto rejoin room after socket connect/reconnect using stored userId, name, and roomId. Ensure server replaces socketId for same userId and avoids duplicates. Show connection status.

Rules:
- Do not add database.
- Do not add auth.
- Do not change event names.
- Do not create duplicate users after reconnect.

Validation:
- Explain reconnect test.
- Explain server restart test.
- List changed files.
```

---

## Prompt Template — Phase 8 Polish

```text
Context:
Read docs/prd.md and docs/tasks.md. Implement Phase 8 only: Polish and Demo Readiness.

Scope:
Modify mobile/src, README.md, and docs/test-plan.md.

Task:
Polish UI, improve error messages, remove dummy marker, complete README run instructions, and write test plan.

Rules:
- Do not add new major features.
- Do not add database/login/background tracking.
- Keep MVP focused.

Validation:
- Explain final two-device demo test.
- List changed files.
```

---

# 4. Manual Testing Quick Checklist

Use this checklist during development.

## Server

- [ ] `cd server && npm run dev` starts server.
- [ ] Server logs port.
- [ ] Server accepts socket connection.
- [ ] `join_room` does not crash.
- [ ] Invalid payload returns `server_error`.
- [ ] Rate limit does not crash server.

## Mobile

- [ ] `cd mobile && npx expo start` starts app.
- [ ] App opens in Expo Go.
- [ ] Join Room screen appears.
- [ ] Empty input validation works.
- [ ] App can connect to server via laptop IP.
- [ ] Map renders.
- [ ] Start Sharing requests permission.
- [ ] Own marker appears.
- [ ] Stop Sharing works.

## Multi-User

- [ ] Phone A and Phone B join same room.
- [ ] Phone A sees Phone B.
- [ ] Phone B sees Phone A.
- [ ] Marker updates automatically.
- [ ] Different rooms are isolated.
- [ ] Stop Sharing updates other phone.
- [ ] Disconnect removes user.
- [ ] Reconnect does not duplicate user.

---

# 5. Common Problems and Fix Hints

## Problem: Phone cannot connect to server

Likely causes:
- Using `localhost` in mobile app.
- Phone and laptop are not on same WiFi.
- Wrong laptop IP.
- Firewall blocks port 3000.
- Server is not running.

Fix:
- Use laptop IP in `EXPO_PUBLIC_SOCKET_URL`.
- Example: `http://192.168.1.10:3000`.
- Allow port 3000 in firewall.
- Restart Expo after env change.

## Problem: Map does not show

Likely causes:
- `react-native-maps` dependency not installed correctly.
- Expo Go issue.
- MapView has no height/flex style.

Fix:
- Ensure `MapView` style has `flex: 1`.
- Run `npx expo install react-native-maps`.
- Restart Expo.

## Problem: Location permission does not appear

Likely causes:
- Permission already denied.
- App did not call permission request.
- Device location service disabled.

Fix:
- Reset permission in device settings.
- Ensure `requestForegroundPermissionsAsync` is called after button press.
- Enable GPS/location services.

## Problem: Own marker appears but remote marker does not

Likely causes:
- Phones are in different rooms.
- Server URL differs.
- `location_updated` not received.
- User keyed by socket.id instead of userId.
- Stop sharing state hides marker.

Fix:
- Check same Room ID.
- Check server logs.
- Check event listener.
- Ensure markers are keyed by `userId`.

## Problem: Duplicate markers after reconnect

Likely causes:
- Client generates new userId after reconnect.
- Server treats same user as new because userId changed.
- Client keys markers by socket.id.

Fix:
- Keep userId stable during session.
- Use userId as marker key.
- Server replaces socket mapping on rejoin.

## Problem: Too many location updates

Likely causes:
- Watcher sends too frequently.
- Client throttle missing.
- Server rate limit missing.

Fix:
- Client throttle to max 1/s.
- Prefer 2–5s interval.
- Server rate limit by `roomId:userId`.

---

# 6. Final MVP Checklist

Before declaring the MVP complete, verify:

- [ ] No database added.
- [ ] No login added.
- [ ] No background tracking added.
- [ ] Server uses Socket.IO rooms.
- [ ] Client uses Expo Go.
- [ ] Client uses `expo-location`.
- [ ] Client uses `react-native-maps`.
- [ ] `userId` is client-generated.
- [ ] `socket.id` is not primary user identity.
- [ ] `location_updated` goes to all room users including sender.
- [ ] Reconnect re-emits `join_room`.
- [ ] Server rate limit exists.
- [ ] Two users can see each other.
- [ ] Marker updates automatically.
- [ ] Stop Sharing works.
- [ ] Disconnect works.
- [ ] README is complete.
- [ ] Test plan is complete.

---

# 7. Recommended Next File Order

After this file, create or refine:

1. `docs/api.md`
2. `docs/architecture.md`
3. `docs/design.md`
4. `docs/test-plan.md`
5. `README.md`

For implementation, start with Phase 0 and Phase 1.
