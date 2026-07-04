# PRD.md — Realtime Location Sharing Mobile App

**Project Name:** LiveMap MVP  
**Project Type:** Mobile Computing / Realtime Location Sharing  
**Primary Target:** Expo React Native mobile app tested with Expo Go  
**Backend:** Node.js + Express + Socket.IO  
**Database:** Not used in MVP  
**PRD Version:** 2.0  
**Status:** Ready for AI-assisted implementation  
**Workflow Compatibility:** Codex GPT-5.5, Gemini, Antigravity, Cursor, Windsurf, or any coding agent  

---

## 1. Executive Summary

LiveMap MVP is a mobile computing application that allows multiple users to share their realtime location on a map. Users enter a display name and a Room ID, join the same realtime room, start sharing location, and see other active users represented as live markers on the map.

The core product behavior is:

1. User joins a room.
2. User grants location permission.
3. User starts sharing location.
4. App sends location updates to server through Socket.IO.
5. Server broadcasts location updates to users in the same room.
6. Other users see the sender's marker move automatically on the map.

This MVP intentionally avoids database, login, background tracking, route navigation, and advanced Google Maps-like features. The first version focuses only on realtime foreground location sharing.

This PRD is written as a source-of-truth document for AI-assisted coding. Any coding agent must follow the scope, constraints, architecture decisions, and implementation phases in this file.

---

## 2. Product Goal

The goal is to build a working realtime location sharing mobile application that can be demonstrated with at least two mobile devices.

The application must satisfy these minimum requirements:

- Share location in realtime.
- Show other users' positions on a map.
- Automatically update markers when users move.
- Support multiple users in the same room.
- Run client on Expo Go.
- Run server locally from a laptop during development.
- Work without database for MVP.
- Work without authentication for MVP.

---

## 3. Product Positioning

This app is closer to:

- Instagram live location sharing.
- WhatsApp live location sharing.
- Simple group location tracker.
- Realtime map marker demo.

This app is not a full Google Maps clone.

The MVP does not include:

- Turn-by-turn navigation.
- Traffic information.
- Search places.
- Routing through roads.
- Estimated travel time.
- Public place discovery.
- Street View.
- Offline maps.
- Complex geospatial analytics.

---

## 4. Target Demo Scenario

The MVP must support this demo scenario:

1. Developer starts the backend server on a laptop.
2. Two mobile phones are connected to the same WiFi as the laptop.
3. Developer runs the Expo app.
4. User A opens the app in Expo Go.
5. User B opens the app in Expo Go.
6. Both users enter the same Room ID.
7. Both users press Start Sharing.
8. User A sees User B marker on the map.
9. User B sees User A marker on the map.
10. If one user moves, the other user's app updates the marker automatically.

If the server is deployed or exposed through a tunnel, the same behavior should work across different networks.

---

## 5. Scope Definition

### 5.1 In Scope for MVP

The following features are mandatory:

1. **Join Room**
   - User enters display name.
   - User enters Room ID.
   - User joins Socket.IO room.
   - Room ID isolates location updates.

2. **Realtime Map Screen**
   - Show a fullscreen map.
   - Show user's own marker.
   - Show other users' markers.
   - Show marker labels or callouts with user names.

3. **Start Location Sharing**
   - User manually presses Start Sharing.
   - App requests foreground location permission.
   - App starts watching location.
   - App emits location updates to server.

4. **Stop Location Sharing**
   - User manually presses Stop Sharing.
   - App stops location watcher.
   - App notifies server.
   - User's marker becomes inactive or is removed from other clients.

5. **Realtime Multi-User Markers**
   - Location updates received from server update map markers.
   - Marker movement happens without manual refresh.
   - Users in different rooms do not see each other.

6. **Connection Status**
   - Show Connected / Disconnected / Reconnecting state.
   - Handle socket reconnect.
   - Rejoin room after reconnect.

7. **Last Updated**
   - Show last update time for each user.
   - Format can be simple, such as "5s ago".

8. **My Location Button**
   - A button centers the map on the current user's latest location.

9. **Basic Error Handling**
   - Permission denied.
   - Server unreachable.
   - Socket disconnected.
   - Location unavailable.
   - Invalid name/room input.

10. **Basic Server Protection**
   - Validate payload.
   - Validate latitude/longitude range.
   - Apply simple per-socket rate limit for location updates.
   - Prevent broadcasting across rooms.

---

### 5.2 Out of Scope for MVP

The following features must not be implemented in the first MVP unless explicitly requested later:

1. Database.
2. Login/register.
3. Google login.
4. User profile persistence.
5. Room persistence.
6. Location history.
7. Background location tracking.
8. Push notifications.
9. Chat.
10. Route navigation.
11. Road-following directions.
12. ETA calculation.
13. Admin roles.
14. Room password.
15. QR invite.
16. File uploads.
17. Avatar uploads.
18. Analytics dashboard.
19. Production-grade security.
20. Complex map styling.

---

## 6. Final Technical Decisions

These decisions are final for MVP and must not be changed by the coding agent unless the user explicitly requests a scope change.

### 6.1 Client Platform

Use:

- Expo React Native.
- TypeScript.
- Expo Go for MVP testing.

Do not create native Android/iOS builds in MVP.

### 6.2 Map

Use:

- `react-native-maps`.

Map must show:
- Own marker.
- Remote user markers.
- Basic callout/label.

### 6.3 Location

Use:

- `expo-location`.

Location mode:
- Foreground location only.
- No background tracking.

Use a watcher:
- `watchPositionAsync` or equivalent Expo Location watcher.

### 6.4 Realtime

Use:

- `socket.io-client` on mobile.
- `socket.io` on server.

Use rooms:
- Each Room ID maps to one Socket.IO room.
- Server broadcasts location updates only to users in the same room.

### 6.5 Backend

Use:

- Node.js.
- Express.
- Socket.IO.
- TypeScript recommended.

Server state:
- In-memory only.

### 6.6 Database

No database in MVP.

Server memory is enough because the MVP only needs live session data. If the server restarts, all rooms and locations are lost. This is acceptable for MVP.

### 6.7 User Identity

Use client-generated `userId`.

Decision:
- `userId` must be generated on the client.
- `userId` must be stable during app session and reconnect.
- `socket.id` must not be used as the primary user identity.
- `socket.id` is only a transport-level connection identifier.

Recommended approach:
- Generate UUID on the client when the user first opens/joins.
- Store it in React state and optionally AsyncStorage.
- Send it in all relevant socket events.

### 6.8 Reconnect Behavior

Socket.IO may reconnect with a new socket connection. The client must handle reconnect explicitly.

Required behavior:
- Client stores `userId`, `name`, and `roomId` locally during active session.
- When socket connects or reconnects, client automatically emits `join_room`.
- If the user was sharing before reconnect, client resumes sending location updates after rejoin.
- Server should replace or update existing user entry with the same `userId`.

### 6.9 `location_updated` Broadcast Rule

Final decision:

- Server emits `location_updated` to all users in the room, including the sender.

Reason:
- Keeps all clients synchronized with server-accepted state.
- Simplifies debugging.
- Avoids ambiguity in event contracts.

Client rule:
- Sender may update own marker locally from device location.
- Sender must still tolerate receiving `location_updated` for itself from server.
- Client must avoid duplicate marker creation by keying markers by `userId`.

### 6.10 Rate Limit

Server must implement simple per-socket or per-user rate limit for `location_update`.

MVP rule:
- Accept at most 1 location update per user per second.
- If updates arrive faster, ignore excessive updates.
- Do not disconnect the user for normal excessive updates.
- Optionally emit `server_error` for extreme spam.

### 6.11 Optional MVP Extras

Only these optional extras are allowed in MVP if time permits:

1. My Location button.
2. Last updated text.
3. Connection status.
4. Simple active users list.

Do not implement distance, route, line drawing, history, or accuracy circle until the core MVP works.

---

## 7. System Architecture

### 7.1 High-Level Architecture

```text
Mobile Client A
  Expo React Native
  expo-location
  react-native-maps
  socket.io-client
        |
        | location_update
        v
Realtime Server
  Node.js
  Express
  Socket.IO
  In-memory room store
        |
        | location_updated
        v
Mobile Client B / C / D
  Map markers update automatically
```

### 7.2 Data Flow

#### Join Room

```text
Client
  -> connect socket
  -> emit join_room { userId, name, roomId }

Server
  -> validate payload
  -> socket.join(roomId)
  -> add/update user in room store
  -> emit room_users to joining client
  -> broadcast user_joined to room
```

#### Share Location

```text
Client
  -> request foreground location permission
  -> start location watcher
  -> emit location_update

Server
  -> validate location payload
  -> apply rate limit
  -> update in-memory store
  -> emit location_updated to room including sender

Client(s)
  -> receive location_updated
  -> upsert marker by userId
```

#### Stop Sharing

```text
Client
  -> stop location watcher
  -> emit stop_sharing

Server
  -> set user.isSharing = false
  -> emit user_stopped_sharing to room

Client(s)
  -> update user status
  -> hide or inactive marker
```

#### Disconnect

```text
Socket disconnects

Server
  -> find user by socket.id
  -> remove or mark inactive
  -> emit user_left to room

Client(s)
  -> remove marker or mark user offline
```

#### Reconnect

```text
Socket reconnects

Client
  -> on connect event, emit join_room again
  -> if wasSharing = true, continue watcher and emit next location_update

Server
  -> update user's socketId by userId
  -> restore user in room store
  -> emit room_users
```

---

## 8. Recommended Project Structure

Use this structure:

```text
realtime-location-sharing/
  docs/
    prd.md
    design.md
    architecture.md
    api.md
    tasks.md
    test-plan.md

  server/
    package.json
    tsconfig.json
    .env.example
    src/
      index.ts
      roomStore.ts
      types.ts
      rateLimit.ts
      validators.ts

  mobile/
    package.json
    app.json
    tsconfig.json
    .env.example
    src/
      components/
        ConnectionStatus.tsx
        UserMarker.tsx
        UserListSheet.tsx
      screens/
        JoinRoomScreen.tsx
        LiveMapScreen.tsx
      hooks/
        useSocket.ts
        useLocationSharing.ts
      services/
        socket.ts
      types/
        realtime.ts
      utils/
        generateUserId.ts
        formatTimeAgo.ts
        locationUtils.ts
```

For faster implementation, server may start with fewer files:

```text
server/
  src/
    index.ts
    roomStore.ts
    types.ts
```

But do not put all mobile logic into one giant file if avoidable.

---

## 9. Environment Variables

### 9.1 Server `.env.example`

```env
PORT=3000
CLIENT_ORIGIN=*
```

### 9.2 Mobile `.env.example`

```env
EXPO_PUBLIC_SOCKET_URL=http://192.168.1.10:3000
```

Important:
- Mobile app must not use `localhost` when running on a physical phone.
- Use the laptop's local IP address when testing on the same WiFi.
- Example: `http://192.168.1.10:3000`.

---

## 10. Socket.IO Event Contract

This contract is final for MVP.

### 10.1 Shared Types

```ts
export type UserId = string;
export type RoomId = string;

export type RemoteUser = {
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
```

### 10.2 Client to Server Events

#### `join_room`

Purpose:
- Join a realtime location room.

Payload:

```ts
{
  userId: string;
  name: string;
  roomId: string;
}
```

Validation:
- `userId` required.
- `name` required.
- `roomId` required.
- `name` max 24 characters.
- `roomId` max 32 characters.
- Trim whitespace.
- Reject empty strings.

Server behavior:
- Join socket to Socket.IO room.
- Add/update user in room store.
- If same `userId` reconnects, update `socketId`.
- Emit `room_users` to joining client.
- Emit `user_joined` to room.

---

#### `location_update`

Purpose:
- Send live location to server.

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
- User must have joined the room.
- Latitude must be number between -90 and 90.
- Longitude must be number between -180 and 180.
- Timestamp must be number.
- Rate limit must pass.

Server behavior:
- Update user's location in room store.
- Set `isSharing = true`.
- Set `updatedAt = Date.now()` or payload timestamp.
- Emit `location_updated` to all users in room, including sender.

---

#### `stop_sharing`

Purpose:
- Stop live location sharing.

Payload:

```ts
{
  userId: string;
  roomId: string;
}
```

Validation:
- User must exist in room.

Server behavior:
- Set `isSharing = false`.
- Keep user in active user list.
- Emit `user_stopped_sharing` to room.

---

#### `leave_room`

Purpose:
- User manually leaves room.

Payload:

```ts
{
  userId: string;
  roomId: string;
}
```

Server behavior:
- Remove user from room store.
- Leave Socket.IO room.
- Emit `user_left` to room.

---

### 10.3 Server to Client Events

#### `room_users`

Purpose:
- Send current room users to newly joined/rejoined client.

Payload:

```ts
{
  roomId: string;
  users: RemoteUser[];
}
```

---

#### `user_joined`

Purpose:
- Notify room that a user joined or rejoined.

Payload:

```ts
{
  roomId: string;
  user: RemoteUser;
}
```

---

#### `location_updated`

Purpose:
- Notify room of user location update.

Payload:

```ts
{
  roomId: string;
  user: RemoteUser;
}
```

Broadcast rule:
- Sent to all users in room, including sender.

---

#### `user_stopped_sharing`

Purpose:
- Notify room that user stopped sharing.

Payload:

```ts
{
  roomId: string;
  userId: string;
}
```

---

#### `user_left`

Purpose:
- Notify room that user left or disconnected.

Payload:

```ts
{
  roomId: string;
  userId: string;
}
```

---

#### `server_error`

Purpose:
- Notify client of validation or server-side errors.

Payload:

```ts
{
  code: string;
  message: string;
}
```

Common codes:
- `INVALID_PAYLOAD`
- `INVALID_LOCATION`
- `NOT_IN_ROOM`
- `RATE_LIMITED`
- `SERVER_ERROR`

---

## 11. In-Memory Server Store

### 11.1 Store Shape

```ts
type RoomStore = {
  [roomId: string]: {
    usersById: {
      [userId: string]: RemoteUser;
    };
    socketToUser: {
      [socketId: string]: userId;
    };
  };
};
```

### 11.2 Required Operations

Implement helper functions:

```ts
joinRoom(params)
leaveRoom(params)
removeBySocketId(socketId)
updateLocation(payload)
stopSharing(params)
getRoomUsers(roomId)
getUser(roomId, userId)
```

### 11.3 Reconnect Handling

If a user with the same `userId` joins the same `roomId` again:
- Replace old `socketId` with new socket id.
- Keep existing location if available.
- Keep `isSharing` state if still relevant.
- Update `connectedAt` only if appropriate.
- Emit latest room users.

---

## 12. Mobile App Requirements

### 12.1 Screen 1 — Join Room Screen

Purpose:
- Collect display name and Room ID.

Components:
- App title.
- Short app description.
- Name input.
- Room ID input.
- Join button.
- Server connection error state.

Validation:
- Name required.
- Room ID required.
- Name max 24 chars.
- Room ID max 32 chars.
- Disable Join button while connecting.

Behavior:
- Generate or load client `userId`.
- Store `name` and `roomId` in local state.
- Connect socket if needed.
- Emit `join_room`.
- Navigate to Live Map Screen after successful join.

---

### 12.2 Screen 2 — Live Map Screen

Purpose:
- Display realtime user locations.

Components:
- Fullscreen `MapView`.
- Marker for own user.
- Markers for remote users.
- Header overlay showing Room ID and connection status.
- Main action button: Start Sharing / Stop Sharing.
- My Location button.
- Active users panel/list.
- Permission error state.

Map behavior:
- Initial region uses user location if available.
- Otherwise use Indonesia fallback region.
- Do not force camera to follow user continuously.
- My Location button recenters map manually.

Fallback region:
```ts
{
  latitude: -2.5489,
  longitude: 118.0149,
  latitudeDelta: 20,
  longitudeDelta: 20
}
```

---

## 13. Marker Requirements

### 13.1 Own Marker

Own marker must:
- Show current user's location.
- Use a visually distinct style.
- Display name or "You".
- Update when local location changes.

### 13.2 Remote Marker

Remote marker must:
- Show remote user location.
- Be keyed by `userId`.
- Update coordinate when `location_updated` is received.
- Show user's name.
- Hide or mark inactive when `user_stopped_sharing` is received.
- Remove when `user_left` is received.

### 13.3 Marker Callout

When marker is tapped, show:
- User name.
- Sharing status.
- Last updated.
- Accuracy if available.

---

## 14. Location Handling

### 14.1 Permission Flow

When user presses Start Sharing:

1. Request foreground location permission.
2. If denied, show Permission Denied state.
3. If granted, get current position.
4. Start location watcher.
5. Emit first `location_update`.

Do not request location permission immediately on app launch.

### 14.2 Location Watcher

Use Expo Location watcher.

Recommended initial configuration:
- Time interval: 2000–5000 ms.
- Distance interval: 5–10 meters.
- Accuracy: balanced or high, depending on device behavior.

### 14.3 Client-Side Throttle

Client should avoid excessive emissions.

Rule:
- Do not emit more than 1 location update per second.
- Prefer 2–5 seconds for normal use.
- If coordinates are unchanged or nearly unchanged, skip if desired.

Server still enforces rate limit.

### 14.4 Stop Sharing Cleanup

When user stops sharing:
- Stop watcher subscription.
- Set local `isSharing = false`.
- Emit `stop_sharing`.
- Keep socket connected.
- Keep user in room.

When user leaves room:
- Stop watcher.
- Emit `leave_room`.
- Disconnect or navigate back.

---

## 15. Reconnect Requirements

The client must handle reconnect robustly.

Required implementation:

1. Keep session state:
   - `userId`
   - `name`
   - `roomId`
   - `wasSharing`

2. On socket `connect`:
   - If `name` and `roomId` exist, emit `join_room`.

3. On reconnect while sharing:
   - Keep location watcher running if possible.
   - Next location watcher callback sends `location_update`.
   - Optionally send latest known location immediately after rejoin.

4. On `disconnect`:
   - Show Disconnected/Reconnecting status.
   - Do not clear room state immediately.
   - Do not crash.

5. On `room_users` after reconnect:
   - Replace local remote users state with server room users.
   - Avoid duplicate self marker.

---

## 16. Rate Limit Requirements

Server must implement simple rate limit for `location_update`.

Recommended state:

```ts
const lastLocationUpdateByUser = new Map<string, number>();
```

Key can be:
```ts
`${roomId}:${userId}`
```

Rule:
- If now - lastUpdate < 1000 ms, ignore update.
- Do not broadcast ignored update.
- Optionally emit `server_error` with `RATE_LIMITED`.
- Do not crash.

This protects demo server from accidental spam.

---

## 17. UI/UX Requirements

### 17.1 Visual Direction

The UI should feel:
- Modern.
- Clean.
- Mobile-first.
- Map-focused.
- Similar to live location sharing apps.

The map must be the main visual element.

### 17.2 Join Room UI

Suggested layout:

```text
LiveMap

Share your realtime location with people in the same room.

Name
[ Al ]

Room ID
[ kelas-a ]

[ Join Room ]
```

### 17.3 Map UI

Suggested layout:

```text
┌──────────────────────────────┐
│ Room: kelas-a    Connected   │
│                              │
│        FULLSCREEN MAP         │
│                              │
│     Marker: You              │
│              Marker: Budi    │
│                              │
│ ┌──────────────────────────┐ │
│ │ Active Users: 2          │ │
│ │ You  • sharing now       │ │
│ │ Budi • updated 5s ago    │ │
│ └──────────────────────────┘ │
│ [Stop Sharing] [My Location] │
└──────────────────────────────┘
```

### 17.4 Required UI States

Implement these states:

1. Not joined.
2. Joining.
3. Joined but not sharing.
4. Requesting permission.
5. Permission denied.
6. Sharing.
7. Connected.
8. Disconnected.
9. Reconnecting.
10. Empty room.
11. Location unavailable.
12. Server unreachable.

---

## 18. Error Handling Requirements

### 18.1 Permission Denied

Show:
```text
Location permission is required to share your live position.
```

Action:
- Show Try Again button.
- Do not start watcher.
- Do not emit location updates.

### 18.2 Server Unreachable

Show:
```text
Cannot connect to realtime server. Check your server URL and network.
```

Common cause:
- Phone and laptop not on same WiFi.
- Wrong laptop IP.
- Firewall blocks port.
- Server not running.

### 18.3 Socket Disconnected

Show:
```text
Realtime connection disconnected. Trying to reconnect...
```

Action:
- Keep user on Map Screen.
- Rejoin after reconnect.

### 18.4 Location Unavailable

Show:
```text
Unable to get your location. Please check GPS/location settings.
```

Action:
- Do not crash.
- Allow retry.

### 18.5 Invalid Payload

Server emits:
```ts
{
  code: "INVALID_PAYLOAD",
  message: "Invalid join room payload"
}
```

Client may show toast/alert.

---

## 19. Privacy and Ethics

Because realtime location is sensitive:

1. Do not share location automatically.
2. User must press Start Sharing.
3. User must see clear active sharing state.
4. User must be able to stop sharing at any time.
5. Location is only shared inside the selected room.
6. Location is not stored permanently.
7. No location history in MVP.
8. No hidden tracking.
9. No background tracking.
10. No tracking after Stop Sharing.

Required text while sharing:
```text
Your location is being shared with users in this room.
```

---

## 20. Security Requirements for MVP

MVP security is basic but must not be ignored.

Server must:
- Validate name.
- Validate roomId.
- Validate userId.
- Validate latitude and longitude.
- Rate limit location updates.
- Broadcast only to room.
- Remove users on disconnect.
- Avoid persistent sensitive storage.

Server does not need:
- JWT.
- OAuth.
- Passwords.
- Database security rules.
- Production rate limiting.
- Encryption beyond transport.

For production later:
- Use HTTPS/WSS.
- Add auth.
- Add room invite or password.
- Add retention policies.
- Add logs and monitoring.
- Add stricter rate limit.

---

## 21. Functional Requirements and Acceptance Criteria

### FR-001 — User Can Join Room

Acceptance Criteria:
- User enters valid name and Room ID.
- App connects to server.
- App emits `join_room`.
- Server stores user in room.
- Server sends `room_users`.
- App navigates to map screen.
- Empty name or room is rejected.

### FR-002 — User Can Start Sharing Location

Acceptance Criteria:
- User presses Start Sharing.
- App requests foreground location permission.
- If granted, app starts location watcher.
- Own marker appears on map.
- App emits `location_update`.
- Button changes to Stop Sharing.

### FR-003 — User Can Stop Sharing Location

Acceptance Criteria:
- User presses Stop Sharing.
- Location watcher stops.
- App emits `stop_sharing`.
- User remains in room.
- Other users see user as stopped or marker removed.
- Button changes to Start Sharing.

### FR-004 — Multi-User Realtime Location Works

Acceptance Criteria:
- User A and User B join the same room.
- User A starts sharing.
- User B sees User A marker.
- User B starts sharing.
- User A sees User B marker.
- Marker updates automatically when location changes.
- No manual refresh is required.

### FR-005 — Different Rooms Are Isolated

Acceptance Criteria:
- User A in Room 1.
- User B in Room 2.
- User A cannot see User B.
- User B cannot see User A.
- Server never broadcasts across rooms.

### FR-006 — Reconnect Works

Acceptance Criteria:
- User joins room.
- Socket disconnects temporarily.
- App shows disconnected/reconnecting status.
- Socket reconnects.
- App automatically emits `join_room`.
- User remains in room.
- Remote markers are restored from `room_users`.

### FR-007 — User Leaves or Disconnects

Acceptance Criteria:
- User closes app or disconnects.
- Server removes or marks user inactive.
- Room receives `user_left`.
- Other clients remove user's marker or show inactive state.

### FR-008 — Server Rate Limit Works

Acceptance Criteria:
- If client emits more than 1 `location_update` per second, server ignores excessive updates.
- Server does not crash.
- Valid later updates are still accepted.

### FR-009 — My Location Button Works

Acceptance Criteria:
- If own location exists, pressing My Location centers the map on own location.
- If own location does not exist, show message or no-op safely.

### FR-010 — Last Updated Works

Acceptance Criteria:
- User list or marker callout shows last updated time.
- Time updates in a readable relative format.

---

## 22. Non-Functional Requirements

### 22.1 Performance

The MVP should support:
- 2–5 users in a room during demo.
- Smooth marker updates.
- No UI freeze on location updates.

Do:
- Update marker state by `userId`.
- Avoid recreating all map data unnecessarily.
- Avoid sending updates too frequently.

### 22.2 Reliability

The app should:
- Not crash if location is null.
- Not crash if server is unreachable.
- Not crash if socket disconnects.
- Not crash if permission is denied.

### 22.3 Maintainability

The code should:
- Use TypeScript types.
- Separate server store logic from socket logic.
- Separate mobile socket logic into a hook/service.
- Avoid giant files where possible.
- Keep README updated.

### 22.4 Developer Experience

The project should:
- Include `.env.example`.
- Include run commands.
- Include clear test steps.
- Support local network testing.

---

## 23. Build Workflow

This section defines how the project should be built systematically with an AI coding agent.

### 23.1 Core Rule

Do not ask the AI agent to build the whole app in one pass.

Build by phases. Each phase must be small, testable, and committed before moving to the next phase.

### 23.2 Required Companion Docs

This PRD is not enough by itself for a clean workflow. The project should also have:

1. `docs/tasks.md`
   - Step-by-step implementation checklist.
   - Used by coding agent during execution.

2. `docs/design.md`
   - UI design specification.
   - Can be generated manually or from Google Stitch.
   - Must not override PRD scope.

3. `docs/api.md`
   - Socket.IO event contract.
   - Can copy Section 10 from this PRD.

4. `docs/test-plan.md`
   - Manual test steps for one device, two devices, disconnect, reconnect, and permission denial.

5. `docs/architecture.md`
   - Client-server architecture.
   - Room store.
   - Reconnect design.

`tasks.md` is required because UI design and IDE implementation may happen in different tools. It prevents the coding agent from jumping around or implementing non-MVP features.

---

## 24. Implementation Phases

### Phase 0 — Repository Preparation

Goal:
- Create clean project structure.

Tasks:
- Create root folder.
- Create `docs/`.
- Add `prd.md`.
- Add empty placeholders for `design.md`, `tasks.md`, `api.md`, `architecture.md`, `test-plan.md`.
- Initialize git.

Definition of Done:
- Repo has a clear folder structure.
- `prd.md` exists.
- Git repository initialized.

---

### Phase 1 — Server Core

Goal:
- Build Socket.IO backend with room support.

Tasks:
- Create `server/`.
- Initialize Node.js project.
- Add TypeScript.
- Add Express.
- Add Socket.IO.
- Add CORS.
- Add `.env.example`.
- Implement `index.ts`.
- Implement `types.ts`.
- Implement `roomStore.ts`.
- Implement `rateLimit.ts`.
- Implement validators.

Events:
- `join_room`
- `location_update`
- `stop_sharing`
- `leave_room`
- `disconnect`

Definition of Done:
- Server starts with `npm run dev`.
- Socket.IO accepts connection.
- `join_room` works.
- `room_users` returns.
- `location_update` broadcasts to room.
- Rate limit works.
- Different rooms are isolated.
- No database exists.

---

### Phase 2 — Mobile Project Setup

Goal:
- Create Expo app.

Tasks:
- Create `mobile/`.
- Initialize Expo React Native TypeScript project.
- Install `expo-location`.
- Install `react-native-maps`.
- Install `socket.io-client`.
- Add `.env.example`.
- Add basic folder structure.
- Confirm app runs in Expo Go.

Definition of Done:
- `npx expo start` works.
- App opens in Expo Go.
- No map/location yet required.

---

### Phase 3 — Join Room UI and Socket Connection

Goal:
- User can join a room.

Tasks:
- Build Join Room Screen.
- Add name input.
- Add Room ID input.
- Generate/load `userId`.
- Connect to socket server.
- Emit `join_room`.
- Listen for `room_users`.
- Navigate to Live Map Screen.

Definition of Done:
- User can enter name/room.
- App connects to server.
- Server logs join event.
- Client receives room users.
- Invalid input is blocked.

---

### Phase 4 — Map Screen with Dummy Markers

Goal:
- Display map UI before real location integration.

Tasks:
- Add Live Map Screen.
- Render MapView.
- Add fallback region.
- Add header overlay.
- Add connection status.
- Add Start/Stop button UI.
- Add My Location button UI.
- Render dummy marker for development.

Definition of Done:
- Map displays in Expo Go.
- UI overlays are visible.
- Dummy marker appears.
- App does not crash.

---

### Phase 5 — Own Location Sharing

Goal:
- User can share own location.

Tasks:
- Request foreground location permission.
- Start location watcher.
- Show own marker.
- Emit `location_update`.
- Stop watcher on Stop Sharing.
- Handle permission denied.

Definition of Done:
- User presses Start Sharing.
- Permission prompt appears.
- Own marker appears.
- Server receives location updates.
- Stop Sharing stops updates.

---

### Phase 6 — Remote User Markers

Goal:
- Users see each other on map.

Tasks:
- Listen for `location_updated`.
- Upsert users by `userId`.
- Render remote markers.
- Listen for `user_stopped_sharing`.
- Listen for `user_left`.
- Update user list.
- Show last updated.

Definition of Done:
- Two phones in same room can see each other.
- Marker updates in realtime.
- Stop Sharing changes remote marker state.
- Disconnect removes remote marker.

---

### Phase 7 — Reconnect and Stability

Goal:
- Make app resilient.

Tasks:
- On socket connect/reconnect, emit `join_room` if session exists.
- Restore room users from `room_users`.
- Maintain sharing state after reconnect.
- Show reconnecting status.
- Avoid duplicate markers.

Definition of Done:
- If server restarts or connection drops, client handles it gracefully.
- Reconnect does not create duplicate users.
- Room state is restored after reconnect.

---

### Phase 8 — Polish and Demo Readiness

Goal:
- Make MVP presentable.

Tasks:
- Improve UI spacing.
- Improve buttons.
- Improve user list.
- Add last updated formatting.
- Add basic loading/error states.
- Update README.
- Add final manual test checklist.

Definition of Done:
- Demo with two devices works.
- UI is presentable.
- README explains setup.
- No known crash in normal demo flow.

---

## 25. AI Coding Agent Rules

Any AI coding agent must follow these rules:

1. Read this PRD before implementing.
2. Do not add out-of-scope features.
3. Do not add database.
4. Do not add login.
5. Do not add background tracking.
6. Do not implement route navigation.
7. Do not build everything in one pass.
8. Implement one phase at a time.
9. After each phase, run available checks.
10. Report changed files.
11. Report how to test the phase.
12. Ask for approval before starting next major phase if used interactively.
13. Keep code small and maintainable.
14. Prefer TypeScript.
15. Keep event contract unchanged.
16. Use client-generated `userId`.
17. Emit `location_updated` to all room users including sender.
18. Implement reconnect.
19. Implement rate limit.
20. Do not silently change architecture.

---

## 26. Prompting Pattern for Coding Agent

Every implementation prompt should follow this shape:

```text
Context:
Read docs/prd.md. We are implementing Phase X only.

Scope:
Only modify [specific folder/files].

Task:
[Specific task.]

Rules:
- Do not add database.
- Do not add login.
- Do not add background tracking.
- Follow Socket.IO event contract.
- Keep implementation minimal.

Validation:
- Run build/lint/typecheck if available.
- Explain manual test steps.
- List changed files.
```

This pattern prevents uncontrolled code generation.

---

## 27. Git Workflow

Use commit checkpoints.

Recommended commit sequence:

```text
chore: initialize project docs
feat(server): implement socket room core
feat(mobile): initialize expo app
feat(mobile): add join room screen
feat(mobile): add map screen
feat(mobile): add location sharing
feat(mobile): add remote user markers
fix(realtime): handle reconnect and stale users
chore: prepare demo readme
```

Rules:
- Commit after each working phase.
- Do not continue if the current phase is broken.
- If AI causes large unwanted changes, revert before continuing.

---

## 28. Testing Strategy

### 28.1 One Device Test

Purpose:
- Verify app opens, map works, permission works, own marker works.

Steps:
1. Start server.
2. Start Expo.
3. Open app in Expo Go.
4. Join room.
5. Press Start Sharing.
6. Confirm permission prompt.
7. Confirm own marker appears.
8. Confirm server receives location update.

Pass Criteria:
- No crash.
- Own marker visible.
- Server logs valid update.

---

### 28.2 Two Devices Same Room Test

Purpose:
- Verify realtime multi-user behavior.

Steps:
1. Start server on laptop.
2. Ensure both phones and laptop are on same WiFi.
3. Use laptop IP in `EXPO_PUBLIC_SOCKET_URL`.
4. Open app on Phone A.
5. Open app on Phone B.
6. Join same Room ID.
7. Start sharing on both.
8. Confirm each phone sees the other marker.
9. Move one phone.
10. Confirm marker updates on the other phone.

Pass Criteria:
- Both phones see each other.
- Marker updates automatically.
- No database required.

---

### 28.3 Different Room Isolation Test

Steps:
1. Phone A joins Room A.
2. Phone B joins Room B.
3. Both start sharing.
4. Confirm they cannot see each other.

Pass Criteria:
- No cross-room marker appears.

---

### 28.4 Stop Sharing Test

Steps:
1. Two phones join same room.
2. Both start sharing.
3. Phone A presses Stop Sharing.
4. Phone B should see Phone A inactive or removed.

Pass Criteria:
- Location updates stop.
- Remote UI updates correctly.

---

### 28.5 Disconnect Test

Steps:
1. Two phones join same room.
2. Close app or disable network on Phone A.
3. Phone B should receive user_left or see Phone A removed/inactive.

Pass Criteria:
- App does not crash.
- Marker removed/inactive.

---

### 28.6 Reconnect Test

Steps:
1. Phone A joins room and starts sharing.
2. Temporarily disconnect network.
3. Reconnect network.
4. App should rejoin room automatically.

Pass Criteria:
- No duplicate user.
- User remains in room.
- Location sharing resumes or can be resumed cleanly.

---

### 28.7 Permission Denied Test

Steps:
1. Press Start Sharing.
2. Deny location permission.
3. Confirm app shows error.

Pass Criteria:
- No crash.
- No location_update emitted.

---

## 29. Known MVP Limitations

These are acceptable limitations:

1. Server data is lost on restart.
2. No login means names are not verified.
3. Users can enter duplicate display names.
4. Location can be spoofed by malicious clients.
5. No persistent room security.
6. Foreground tracking only.
7. No guaranteed background updates.
8. Local laptop server only works on reachable network.
9. Free hosting/tunnel may sleep or disconnect.
10. GPS accuracy depends on device and environment.

Do not treat these as bugs unless they break the defined MVP.

---

## 30. Future Roadmap

After MVP works:

### Version 1.1
- Distance between users.
- Straight line between users.
- Better marker design.
- Room QR code.
- Basic room password.

### Version 1.2
- Database for room/user persistence.
- Anonymous authentication.
- Last known location.
- Expiring rooms.

### Version 2.0
- Background location with development build.
- Location history.
- Route polyline.
- Push notification.
- Production deployment.

### Version 3.0
- Real auth.
- Production security.
- Admin controls.
- Geofencing.
- Scalable backend architecture.

---

## 31. Definition of Done

The MVP is complete when:

1. Server runs locally.
2. Mobile app runs in Expo Go.
3. User can join a room.
4. User can start sharing location.
5. User's marker appears on map.
6. At least two users in the same room can see each other.
7. Markers update automatically when users move.
8. User can stop sharing.
9. User leaving/disconnecting updates other clients.
10. Reconnect is handled without duplicate users.
11. Server rate limit exists.
12. Different rooms are isolated.
13. No database is used.
14. No login is used.
15. README explains how to run and test.
16. The app can be demonstrated as a mobile computing project.

---

## 32. Final Implementation Summary

Build a focused realtime location sharing mobile app.

Use:

```text
Expo React Native + TypeScript
expo-location
react-native-maps
socket.io-client
Node.js + Express + Socket.IO
In-memory room store
No database
No login
Foreground location only
```

Locked decisions:

```text
userId = client-generated UUID
socket.id = transport identifier only
location_updated = sent to all users in room including sender
reconnect = client auto re-emits join_room
rate limit = max 1 location_update per user per second
MVP extras = My Location, last updated, connection status only
```

The project must be implemented in small phases using `tasks.md`, with testable checkpoints after every phase.
