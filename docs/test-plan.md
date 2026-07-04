# Test Plan

Status: Ready for demo

This plan validates the LiveMap MVP demo flow. Run tests with the server on a laptop and the mobile app in Expo Go.

## Setup

1. Connect laptop and phones to the same WiFi.
2. Start server with `cd server && npm run dev`.
3. Set `mobile/.env` to `EXPO_PUBLIC_SOCKET_URL=http://<laptop-ip>:3000`.
4. Restart Expo after changing `.env`.
5. Start mobile app with `cd mobile && npx expo start`.

Expected result:
- Server prints that Socket.IO is ready.
- Expo opens the app in Expo Go.
- Join Room screen appears.

## One-Device Test

Steps:
1. Open the app on one phone.
2. Enter a valid name.
3. Enter a Room ID.
4. Press Join Room.
5. Confirm the map screen appears.
6. Press Start Sharing.
7. Grant foreground location permission.
8. Press My Location.
9. Press Stop Sharing.

Expected results:
- Empty name or Room ID is blocked.
- Own marker appears after permission is granted.
- My Location centers the map when current location exists.
- Stop Sharing changes the button back to Start Sharing.
- App does not request background location.

## Two-Device Same Room Test

Steps:
1. Open the app on Phone A and Phone B.
2. Join the same Room ID from both phones.
3. Press Start Sharing on Phone A.
4. Confirm Phone B sees Phone A marker.
5. Press Start Sharing on Phone B.
6. Confirm Phone A sees Phone B marker.
7. Move one phone or wait for a location update.

Expected results:
- Each phone sees the other active sharing user.
- Remote markers are keyed by `userId`, not `socket.id`.
- Remote marker callout shows the remote user name and last updated text.
- Active users panel shows current user, remote users, sharing state, and last updated text.

## Different Room Isolation Test

Steps:
1. Phone A joins Room A.
2. Phone B joins Room B.
3. Both phones start sharing.

Expected results:
- Phone A does not see Phone B marker.
- Phone B does not see Phone A marker.
- Location updates stay scoped to the correct room.

## Stop Sharing Test

Steps:
1. Two phones join the same room.
2. Both start sharing.
3. Phone A presses Stop Sharing.

Expected results:
- Phone A stops sending location updates.
- Phone B hides Phone A remote marker or shows stopped state in the user panel.
- Phone A remains in the room.

## Disconnect Test

Steps:
1. Two phones join the same room.
2. Both start sharing.
3. Close Expo Go or disable network on Phone A.

Expected results:
- Phone B removes Phone A marker after server receives disconnect.
- Phone B remains stable and does not crash.
- Connection status stays clear on the affected phone.

## Reconnect Test

Steps:
1. Two phones join the same room.
2. Both start sharing.
3. Disable WiFi/data on Phone A.
4. Confirm Phone A shows disconnected or reconnecting.
5. Re-enable network on Phone A.

Expected results:
- Phone A reconnects and automatically emits `join_room`.
- Phone A keeps the same client-generated `userId`.
- No duplicate marker appears on Phone B.
- Sharing resumes from latest known or next watcher location.

## Permission Denied Test

Steps:
1. Open app on one phone.
2. Join a room.
3. Press Start Sharing.
4. Deny foreground location permission.

Expected results:
- App shows a clear permission error.
- No location watcher starts.
- No `location_update` is emitted.
- User can retry after enabling permission in device settings.
