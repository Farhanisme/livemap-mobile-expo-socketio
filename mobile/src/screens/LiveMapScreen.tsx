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

function getConnectionCopy(status: ConnectionStatus): {
  label: string;
  detail: string;
  tone: "ok" | "warning" | "danger" | "neutral";
} {
  switch (status) {
    case "connected":
      return {
        detail: "Realtime updates are active.",
        label: "Connected",
        tone: "ok",
      };
    case "connecting":
      return {
        detail: "Connecting to the realtime server...",
        label: "Connecting",
        tone: "warning",
      };
    case "reconnecting":
      return {
        detail: "Network changed. Rejoining the room automatically.",
        label: "Reconnecting",
        tone: "warning",
      };
    case "disconnected":
      return {
        detail: "Realtime connection disconnected. Trying to reconnect...",
        label: "Disconnected",
        tone: "danger",
      };
    case "error":
      return {
        detail: "Cannot connect to realtime server. Check server URL and network.",
        label: "Connection error",
        tone: "danger",
      };
    default:
      return {
        detail: "Join a room to start realtime updates.",
        label: "Idle",
        tone: "neutral",
      };
  }
}

function getStatusDotStyle(isSharing: boolean) {
  return isSharing ? styles.userDotSharing : styles.userDotStopped;
}

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
  const sharingUsersCount =
    (isSharing ? 1 : 0) + otherUsers.filter((user) => user.isSharing).length;
  const remoteSharingUsers = otherUsers.filter(
    (user) =>
      user.isSharing &&
      typeof user.latitude === "number" &&
      typeof user.longitude === "number" &&
      isValidCoordinate(user.latitude, user.longitude),
  );
  const connectionCopy = getConnectionCopy(connectionStatus);
  const hasConnectionWarning = connectionStatus !== "connected";

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
          <Text style={styles.headerSubtext}>
            {sharingUsersCount} sharing / {activeUsersCount} active
          </Text>
        </View>
        <View
          style={[
            styles.statusPill,
            connectionCopy.tone === "ok" && styles.statusPillOk,
            connectionCopy.tone === "warning" && styles.statusPillWarning,
            connectionCopy.tone === "danger" && styles.statusPillDanger,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              connectionCopy.tone === "ok" && styles.statusTextOk,
              connectionCopy.tone === "warning" && styles.statusTextWarning,
              connectionCopy.tone === "danger" && styles.statusTextDanger,
            ]}
          >
            {connectionCopy.label}
          </Text>
        </View>
      </View>

      <View style={styles.userPanel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Active Users</Text>
            <Text style={styles.panelSubtitle}>
              {activeUsersCount} in room • {sharingUsersCount} sharing
            </Text>
          </View>
          <View style={[styles.sharingBadge, isSharing && styles.sharingBadgeActive]}>
            <Text style={[styles.sharingBadgeText, isSharing && styles.sharingBadgeTextActive]}>
              {isSharing ? "Sharing" : "Paused"}
            </Text>
          </View>
        </View>

        {hasConnectionWarning && (
          <Text style={styles.warningText}>{connectionCopy.detail}</Text>
        )}

        <View style={styles.userRow}>
          <View style={[styles.userDot, getStatusDotStyle(isSharing)]} />
          <View style={styles.userTextBlock}>
            <Text style={styles.userName}>{name} (You)</Text>
            <Text style={styles.userMeta}>
              {isSharing ? "Sharing now" : "Not sharing"} • updated{" "}
              {formatTimeAgo(currentLocation?.timestamp)}
            </Text>
          </View>
        </View>

        {otherUsers.length > 0 ? (
          otherUsers.map((user) => (
            <View key={user.userId} style={styles.userRow}>
              <View style={[styles.userDot, getStatusDotStyle(user.isSharing)]} />
              <View style={styles.userTextBlock}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userMeta}>
                  {user.isSharing ? "Sharing now" : "Stopped sharing"} • updated{" "}
                  {formatTimeAgo(user.updatedAt)}
                </Text>
              </View>
            </View>
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
          style={({ pressed }) => [
            styles.secondaryButton,
            !currentLocation && styles.secondaryButtonMuted,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.secondaryButtonText}>My Location</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    bottom: 26,
    flexDirection: "row",
    gap: 12,
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
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    color: "#64748b",
    fontSize: 13,
    lineHeight: 19,
    padding: 12,
  },
  errorText: {
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    color: "#b91c1c",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
    padding: 12,
  },
  header: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderColor: "rgba(15, 23, 42, 0.08)",
    borderRadius: 20,
    borderWidth: 1,
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
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  headerSubtext: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 2,
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
  },
  panelHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  panelSubtitle: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 2,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 16,
    flex: 1,
    paddingVertical: 15,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#dbeafe",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 15,
  },
  secondaryButtonMuted: {
    opacity: 0.76,
  },
  secondaryButtonText: {
    color: "#2563eb",
    fontSize: 15,
    fontWeight: "800",
  },
  sharingText: {
    backgroundColor: "#ecfdf5",
    borderRadius: 12,
    color: "#047857",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
    padding: 12,
  },
  sharingBadge: {
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sharingBadgeActive: {
    backgroundColor: "#dcfce7",
  },
  sharingBadgeText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "800",
  },
  sharingBadgeTextActive: {
    color: "#166534",
  },
  statusPill: {
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusPillDanger: {
    backgroundColor: "#fee2e2",
  },
  statusPillOk: {
    backgroundColor: "#dcfce7",
  },
  statusPillWarning: {
    backgroundColor: "#fef3c7",
  },
  statusText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "800",
  },
  statusTextDanger: {
    color: "#b91c1c",
  },
  statusTextOk: {
    color: "#166534",
  },
  statusTextWarning: {
    color: "#92400e",
  },
  stopButton: {
    backgroundColor: "#dc2626",
  },
  userName: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "800",
  },
  userDot: {
    borderRadius: 999,
    height: 10,
    marginTop: 5,
    width: 10,
  },
  userDotSharing: {
    backgroundColor: "#16a34a",
  },
  userDotStopped: {
    backgroundColor: "#94a3b8",
  },
  userPanel: {
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderColor: "rgba(15, 23, 42, 0.08)",
    borderRadius: 20,
    borderWidth: 1,
    bottom: 98,
    left: 16,
    padding: 16,
    position: "absolute",
    right: 16,
  },
  userMeta: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 1,
  },
  userRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  userTextBlock: {
    flex: 1,
  },
  warningText: {
    backgroundColor: "#fffbeb",
    borderRadius: 12,
    color: "#92400e",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
    padding: 12,
  },
});
