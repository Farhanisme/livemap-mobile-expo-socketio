# Design

Status: Ready for demo

This document summarizes the implemented MVP UI for demo readiness.

## Visual Direction

- Mobile-first, clean, map-focused layout.
- Light card overlays over a fullscreen map.
- Blue primary action for Start Sharing.
- Red destructive action for Stop Sharing.
- Green, amber, and red status colors for connected, pending, and error states.

## Join Room Screen

The Join Room screen contains:

- App title: LiveMap MVP.
- Short description for realtime room-based sharing.
- Name input with 24-character limit.
- Room ID input with 32-character limit.
- Join Room button disabled while connecting.
- Inline validation and server connection errors.
- Connection status row with a small colored indicator.

## Live Map Screen

The Live Map screen contains:

- Fullscreen `react-native-maps` MapView.
- Fallback Indonesia region before a real location exists.
- Header overlay with Room ID, sharing count, active user count, and connection status.
- Active users panel with current user, remote users, sharing/stopped state, and last updated text.
- Start Sharing / Stop Sharing primary button.
- My Location secondary button.
- Inline connection, permission, and location error messages.

## Marker Behavior

- Own marker renders only from the device's latest `currentLocation`.
- Remote markers render only for other users with `isSharing === true` and valid coordinates.
- Remote markers are keyed by client-generated `userId`.
- Marker title/callout uses the user's display name and last updated text.
- The Phase 4 dummy marker is not shown in normal app flow.

## Status and Error States

- Connected: realtime updates are active.
- Connecting/Reconnecting: app is attempting to connect or rejoin.
- Disconnected/Error: app warns the user to check network, server URL, or server status.
- Permission denied: app explains that foreground location permission is required.
- Location unavailable: app tells the user to check GPS/location settings.
- My Location is safe when current location is missing and shows a simple alert.
