# LiveMap MVP

LiveMap MVP is a realtime foreground location sharing app for mobile computing demos. Users join a room with a display name, manually start sharing location, and see other active users as live markers on a map.

## Tech Stack

- Mobile: Expo React Native, TypeScript, Expo Go
- Location: `expo-location`
- Map: `react-native-maps`
- Realtime: `socket.io-client`
- Server: Node.js, Express, Socket.IO, TypeScript
- Storage: in-memory room store only

## Features

- Join a room with name and Room ID.
- Share foreground location after explicit permission.
- Show own marker and remote user markers.
- Stop sharing at any time.
- Reconnect and rejoin room after temporary network loss.
- Show connection, sharing, and last-updated states.
- Keep users isolated by Socket.IO room.

## Folder Structure

```text
docs/
  prd.md
  tasks.md
  api.md
  architecture.md
  design.md
  test-plan.md
server/
  package.json
  tsconfig.json
  .env.example
  src/
    index.ts
    roomStore.ts
    validators.ts
    rateLimit.ts
    types.ts
mobile/
  package.json
  app.json
  tsconfig.json
  .env.example
  src/
    hooks/
    screens/
    services/
    types/
    utils/
```

## Prerequisites

- Node.js and npm installed.
- Expo Go installed on each test phone.
- Laptop and phones on the same WiFi network.
- Firewall allows inbound connections to port `3000`.

## Run the Server

```bash
cd server
npm install
npm run dev
```

The server defaults to `http://localhost:3000`.

## Configure Mobile Server URL

Physical phones cannot use `localhost` to reach your laptop. Use the laptop IP address on the same WiFi.

On Windows PowerShell:

```powershell
ipconfig
```

Look for the active WiFi adapter IPv4 address, for example `192.168.1.10`.

Create or update `mobile/.env`:

```env
EXPO_PUBLIC_SOCKET_URL=http://192.168.1.10:3000
```

Restart Expo after changing `.env`.

## Run the Mobile App

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go.

## One-Phone Test

1. Start the server.
2. Start Expo and open the app in Expo Go.
3. Enter a name and Room ID.
4. Press Join Room.
5. Press Start Sharing.
6. Grant foreground location permission.
7. Confirm your marker appears.
8. Press Stop Sharing and confirm updates stop.

## Two-Phone Demo Test

1. Connect both phones and the laptop to the same WiFi.
2. Set `EXPO_PUBLIC_SOCKET_URL` to the laptop IP.
3. Start the server and Expo app.
4. Open the app on Phone A and Phone B.
5. Join the same Room ID on both phones.
6. Press Start Sharing on both phones.
7. Confirm each phone sees the other phone's marker.
8. Move one phone and confirm the marker updates on the other phone.
9. Turn WiFi/data off and on for one phone to confirm reconnect without duplicate markers.

## Known Limitations

- No database; rooms and locations reset when the server restarts.
- No login or authentication; names are not verified.
- Foreground location only; no background tracking.
- Local demo requires phones to reach the laptop IP.
- GPS accuracy depends on device, permission, and environment.
- Location history, routing, distance, chat, and push notifications are intentionally out of scope for the MVP.
