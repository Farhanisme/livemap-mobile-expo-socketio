import { useCallback, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";

import { getSocket } from "../services/socket";
import type { LocationPayload, StopSharingPayload } from "../types/realtime";
import { isValidCoordinate, shouldSendLocationUpdate } from "../utils/locationUtils";

type UseLocationSharingParams = {
  userId: string;
  roomId: string;
  name: string;
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

export function useLocationSharing({ userId, roomId, name }: UseLocationSharingParams) {
  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  const lastSentAtRef = useRef<number | null>(null);
  const isSharingRef = useRef(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const emitLocationUpdate = useCallback(
    (location: Location.LocationObject, force = false) => {
      const { latitude, longitude, accuracy, speed, heading } = location.coords;
      const now = Date.now();

      if (!isValidCoordinate(latitude, longitude)) {
        setLocationError("Invalid location coordinates received.");
        return;
      }

      const nextLocation: CurrentLocation = {
        latitude,
        longitude,
        accuracy,
        speed,
        heading,
        timestamp: location.timestamp || now,
      };

      setCurrentLocation(nextLocation);

      if (!force && !shouldSendLocationUpdate(lastSentAtRef.current, now)) {
        return;
      }

      try {
        const socket = getSocket();
        if (!socket.connected) {
          setLocationError("Realtime connection is not connected.");
          return;
        }

        const payload: LocationPayload = {
          userId,
          roomId,
          name,
          latitude,
          longitude,
          accuracy,
          speed,
          heading,
          timestamp: nextLocation.timestamp,
        };

        socket.emit("location_update", payload);
        lastSentAtRef.current = now;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to send location update.";
        setLocationError(message);
      }
    },
    [name, roomId, userId],
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
        setLocationError("Location permission is required to share your live position.");
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
          : "Unable to get your current location. Please check GPS/location settings.";
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

  return {
    currentLocation,
    isRequestingPermission,
    isSharing,
    locationError,
    startSharing,
    stopSharing,
  };
}
