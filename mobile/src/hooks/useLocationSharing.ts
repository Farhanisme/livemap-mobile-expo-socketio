import { useCallback, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";

import { getSocket } from "../services/socket";
import type { LocationPayload, StopSharingPayload } from "../types/realtime";
import { isValidCoordinate, shouldSendLocationUpdate } from "../utils/locationUtils";

type UseLocationSharingParams = {
  userId: string;
  roomId: string;
  name: string;
  roomSyncVersion?: number;
};

type CurrentLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: number;
};

const WATCH_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.Balanced,
  distanceInterval: 5,
  timeInterval: 3000,
};

export function useLocationSharing({
  userId,
  roomId,
  name,
  roomSyncVersion = 0,
}: UseLocationSharingParams) {
  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  const lastSentAtRef = useRef<number | null>(null);
  const isSharingRef = useRef(false);
  const currentLocationRef = useRef<CurrentLocation | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const emitCurrentLocation = useCallback(
    (nextLocation: CurrentLocation, force = false) => {
      const now = Date.now();

      if (!isValidCoordinate(nextLocation.latitude, nextLocation.longitude)) {
        setLocationError("Invalid location coordinates received.");
        return;
      }

      currentLocationRef.current = nextLocation;
      setCurrentLocation(nextLocation);

      if (!force && !shouldSendLocationUpdate(lastSentAtRef.current, now)) {
        return;
      }

      try {
        const socket = getSocket();
        if (!socket.connected) {
          setLocationError("Realtime connection disconnected. Trying to reconnect before sending updates.");
          return;
        }

        const payload: LocationPayload = {
          userId,
          roomId,
          name,
          latitude: nextLocation.latitude,
          longitude: nextLocation.longitude,
          accuracy: nextLocation.accuracy,
          speed: nextLocation.speed,
          heading: nextLocation.heading,
          timestamp: nextLocation.timestamp,
        };

        socket.emit("location_update", payload);
        lastSentAtRef.current = now;
        setLocationError(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to send location update.";
        setLocationError(message);
      }
    },
    [name, roomId, userId],
  );

  const emitLocationUpdate = useCallback(
    (location: Location.LocationObject, force = false) => {
      const { latitude, longitude, accuracy, speed, heading } = location.coords;

      emitCurrentLocation(
        {
          latitude,
          longitude,
          accuracy,
          speed,
          heading,
          timestamp: location.timestamp || Date.now(),
        },
        force,
      );
    },
    [emitCurrentLocation],
  );

  const stopSharing = useCallback(() => {
    watcherRef.current?.remove();
    watcherRef.current = null;
    lastSentAtRef.current = null;
    isSharingRef.current = false;
    setIsSharing(false);

    try {
      const socket = getSocket();
      if (socket.connected) {
        const payload: StopSharingPayload = {
          userId,
          roomId,
        };

        socket.emit("stop_sharing", payload);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to stop sharing.";
      setLocationError(message);
    }
  }, [roomId, userId]);

  const startSharing = useCallback(async () => {
    setIsRequestingPermission(true);
    setLocationError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setLocationError(
          "Location permission is required to share your live position. Enable location permission and try again.",
        );
        return;
      }

      watcherRef.current?.remove();
      watcherRef.current = null;

      const firstPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      isSharingRef.current = true;
      setIsSharing(true);
      emitLocationUpdate(firstPosition, true);

      watcherRef.current = await Location.watchPositionAsync(WATCH_OPTIONS, (location) => {
        emitLocationUpdate(location);
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to get your location. Please check GPS/location settings and try again.";
      setLocationError(message);
      isSharingRef.current = false;
      setIsSharing(false);
    } finally {
      setIsRequestingPermission(false);
    }
  }, [emitLocationUpdate]);

  useEffect(() => {
    return () => {
      watcherRef.current?.remove();
      watcherRef.current = null;

      if (!isSharingRef.current) {
        return;
      }

      try {
        const socket = getSocket();
        if (socket.connected) {
          socket.emit("stop_sharing", { userId, roomId } satisfies StopSharingPayload);
        }
      } catch {
        // Cleanup must not throw during unmount.
      }
    };
  }, [roomId, userId]);

  useEffect(() => {
    if (!isSharingRef.current || !currentLocationRef.current) {
      return;
    }

    emitCurrentLocation(currentLocationRef.current, true);
  }, [emitCurrentLocation, roomSyncVersion]);

  return {
    currentLocation,
    isRequestingPermission,
    isSharing,
    locationError,
    startSharing,
    stopSharing,
  };
}
