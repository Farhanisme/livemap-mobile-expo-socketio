import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { ConnectionStatus } from "../types/realtime";

type JoinRoomScreenProps = {
  connectionStatus: ConnectionStatus;
  errorMessage: string | null;
  onJoin: (name: string, roomId: string) => Promise<void>;
};

const NAME_MAX_LENGTH = 24;
const ROOM_ID_MAX_LENGTH = 32;

function getStatusLabel(status: ConnectionStatus): string {
  switch (status) {
    case "connecting":
      return "Connecting to realtime server...";
    case "connected":
      return "Connected";
    case "disconnected":
      return "Disconnected";
    case "reconnecting":
      return "Reconnecting...";
    case "error":
      return "Connection error";
    default:
      return "Idle";
  }
}

export function JoinRoomScreen({
  connectionStatus,
  errorMessage,
  onJoin,
}: JoinRoomScreenProps) {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const isConnecting = connectionStatus === "connecting";

  async function handleJoin() {
    const trimmedName = name.trim();
    const trimmedRoomId = roomId.trim();

    if (!trimmedName) {
      setFormError("Name is required.");
      return;
    }

    if (!trimmedRoomId) {
      setFormError("Room ID is required.");
      return;
    }

    if (trimmedName.length > NAME_MAX_LENGTH) {
      setFormError(`Name must be at most ${NAME_MAX_LENGTH} characters.`);
      return;
    }

    if (trimmedRoomId.length > ROOM_ID_MAX_LENGTH) {
      setFormError(`Room ID must be at most ${ROOM_ID_MAX_LENGTH} characters.`);
      return;
    }

    setFormError(null);

    try {
      await onJoin(trimmedName, trimmedRoomId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to join room.";
      setFormError(message);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Mobile Computing: LiveMap Application</Text>
        <Text style={styles.description}>
          Aplikasi berbagi lokasi secara realtime berbasis Mobile.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            autoCapitalize="words"
            editable={!isConnecting}
            maxLength={NAME_MAX_LENGTH}
            onChangeText={setName}
            placeholder="Masukkan nama Anda..."
            returnKeyType="next"
            style={styles.input}
            value={name}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Room ID</Text>
          <TextInput
            autoCapitalize="characters"
            editable={!isConnecting}
            maxLength={ROOM_ID_MAX_LENGTH}
            onChangeText={setRoomId}
            placeholder="Masukkan Room ID..."
            returnKeyType="done"
            style={styles.input}
            value={roomId}
          />
        </View>

        <Pressable
          disabled={isConnecting}
          onPress={handleJoin}
          style={({ pressed }) => [
            styles.button,
            isConnecting && styles.buttonDisabled,
            pressed && !isConnecting && styles.buttonPressed,
          ]}
        >
          {isConnecting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
          <Text style={styles.buttonText}>Join Room</Text>
          )}
        </Pressable>

        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              connectionStatus === "connected" && styles.statusDotConnected,
              (connectionStatus === "connecting" || connectionStatus === "reconnecting") &&
                styles.statusDotPending,
              connectionStatus === "error" && styles.statusDotError,
            ]}
          />
          <Text style={styles.status}>{getStatusLabel(connectionStatus)}</Text>
        </View>

        {(formError || errorMessage) && (
          <Text style={styles.error}>{formError ?? errorMessage}</Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 14,
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonPressed: {
    backgroundColor: "#1d4ed8",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(37, 99, 235, 0.08)",
    borderRadius: 28,
    borderWidth: 1,
    gap: 16,
    padding: 26,
    shadowColor: "#1e3a8a",
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    width: "100%",
  },
  container: {
    backgroundColor: "#eff6ff",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  description: {
    color: "#4b5563",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  error: {
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    color: "#b91c1c",
    fontSize: 14,
    lineHeight: 20,
    padding: 12,
  },
  field: {
    gap: 6,
  },
  input: {
    backgroundColor: "#f9fafb",
    borderColor: "#dbeafe",
    borderRadius: 14,
    borderWidth: 1,
    color: "#111827",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  label: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "700",
  },
  status: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "700",
  },
  statusDot: {
    backgroundColor: "#94a3b8",
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  statusDotConnected: {
    backgroundColor: "#16a34a",
  },
  statusDotError: {
    backgroundColor: "#dc2626",
  },
  statusDotPending: {
    backgroundColor: "#f59e0b",
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  title: {
    color: "#111827",
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
  },
});
