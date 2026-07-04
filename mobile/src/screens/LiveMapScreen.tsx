import { useRef } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";

import { useLocationSharing } from "../hooks/useLocationSharing";
import type { ConnectionStatus, RemoteUser } from "../types/realtime";
import { formatTimeAgo } from "../utils/formatTimeAgo";
import { isValidCoordinate } from "../utils/locationUtils";

type LiveMapScreenProps = {
  userId: string;
  name: string;
  roomId: string;
  roomUsers: RemoteUser[];
  connectionStatus: ConnectionStatus;
  roomSyncVersion: number;
};

const FALLBACK_REGION: Region = {
  latitude: -2.5489,
  longitude: 118.0149,
  latitudeDelta: 20,
  longitudeDelta: 20,
};

export function LiveMapScreen({
  userId,
  name,
  roomId,
  roomUsers,
  connectionStatus,
  roomSyncVersion,
}: LiveMapScreenProps) {
  const mapRef = useRef<MapView | null>(null);
  const {
    currentLocation,
    isRequestingPermission,
    isSharing,
    locationError,
    startSharing,
    stopSharing,
  } = useLocationSharing({
    userId,
    roomId,
    name,
    roomSyncVersion,
  });
  const uniqueRoomUsers = Array.from(
    roomUsers.reduce<Map<string, RemoteUser>>((usersById, user) => {
      usersById.set(user.userId, user);
      return usersById;
    }, new Map()).values(),
  );
  const otherUsers = uniqueRoomUsers.filter((user) => user.userId !== userId);
  const activeUsersCount = new Set([userId, ...uniqueRoomUsers.map((user) => user.userId)]).size;
  const remoteSharingUsers = otherUsers.filter(
    (user) =>
      user.isSharing &&
      typeof user.latitude === "number" &&
      typeof user.longitude === "number" &&
      isValidCoordinate(user.latitude, user.longitude),
  );

  async function handleSharingPress() {
    if (isSharing) {
      stopSharing();
      return;
    }

    await startSharing();
  }

  function centerToMyLocation() {
    if (!currentLocation) {
      Alert.alert("My Location", "Current location is not available yet.");
      return;
    }

    mapRef.current?.animateToRegion(
      {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      500,
    );
  }

  return (
    <View style={styles.container}>
      <MapView initialRegion={FALLBACK_REGION} ref={mapRef} style={styles.map}>
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            pinColor="#2563eb"
            title={name || "You"}
          />
        )}
        {remoteSharingUsers.map((user) => {
          const markerTitle = user.name || "Remote User";
          const lastUpdated = formatTimeAgo(user.updatedAt);

          return (
            <Marker
              coordinate={{
                latitude: user.latitude as number,
                longitude: user.longitude as number,
              }}
              description={`Sharing now - Updated ${lastUpdated}`}
              key={user.userId}
              title={markerTitle}
            />
          );
        })}
      </MapView>

      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>Room</Text>
          <Text style={styles.headerValue}>{roomId}</Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{connectionStatus}</Text>
        </View>
      </View>

      <View style={styles.userPanel}>
        <Text style={styles.panelTitle}>Active Users: {activeUsersCount}</Text>
        <Text style={styles.userName}>
          {name} - You - {isSharing ? "sharing" : "not sharing"} - updated{" "}
          {formatTimeAgo(currentLocation?.timestamp)}
        </Text>
        {otherUsers.length > 0 ? (
          otherUsers.map((user) => (
            <Text key={user.userId} style={styles.userName}>
              {user.name} - {user.isSharing ? "sharing" : "stopped"} - updated{" "}
              {formatTimeAgo(user.updatedAt)}
            </Text>
          ))
        ) : (
          <Text style={styles.emptyText}>No other users in this room yet.</Text>
        )}
        {isSharing && (
          <Text style={styles.sharingText}>
            Your location is being shared with users in this room.
          </Text>
        )}
        {locationError && <Text style={styles.errorText}>{locationError}</Text>}
      </View>

      <View style={styles.actions}>
        <Pressable
          disabled={isRequestingPermission}
          onPress={handleSharingPress}
          style={({ pressed }) => [
            styles.primaryButton,
            isSharing && styles.stopButton,
            isRequestingPermission && styles.buttonDisabled,
            pressed && !isRequestingPermission && styles.buttonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {isRequestingPermission ? "Requesting..." : isSharing ? "Stop Sharing" : "Start Sharing"}
          </Text>
        </Pressable>
        <Pressable
          onPress={centerToMyLocation}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.secondaryButtonText}>My Location</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    bottom: 28,
    flexDirection: "row",
    gap: 10,
    left: 16,
    position: "absolute",
    right: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonPressed: {
    opacity: 0.82,
  },
  container: {
    flex: 1,
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 19,
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  header: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    left: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: "absolute",
    right: 16,
    top: 48,
  },
  headerLabel: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  headerValue: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  panelTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 14,
    flex: 1,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    flex: 1,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: "#2563eb",
    fontSize: 15,
    fontWeight: "800",
  },
  sharingText: {
    color: "#047857",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  statusPill: {
    backgroundColor: "#e0ecff",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  stopButton: {
    backgroundColor: "#dc2626",
  },
  userName: {
    color: "#374151",
    fontSize: 14,
    lineHeight: 22,
  },
  userPanel: {
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: 18,
    bottom: 96,
    left: 16,
    padding: 16,
    position: "absolute",
    right: 16,
  },
});
