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
        <Text style={styles.title}>LiveMap MVP</Text>
        <Text style={styles.description}>
          Share your realtime location with people in the same room.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            autoCapitalize="words"
            editable={!isConnecting}
            maxLength={NAME_MAX_LENGTH}
            onChangeText={setName}
            placeholder="Al"
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
            placeholder="KELAS-A"
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

        <Text style={styles.status}>Connection: {connectionStatus}</Text>

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
    borderRadius: 12,
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
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
    borderRadius: 24,
    gap: 14,
    padding: 24,
    width: "100%",
  },
  container: {
    backgroundColor: "#eef2ff",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  description: {
    color: "#4b5563",
    fontSize: 15,
    lineHeight: 22,
  },
  error: {
    color: "#b91c1c",
    fontSize: 14,
    lineHeight: 20,
  },
  field: {
    gap: 6,
  },
  input: {
    backgroundColor: "#f9fafb",
    borderColor: "#d1d5db",
    borderRadius: 12,
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
    color: "#6b7280",
    fontSize: 13,
  },
  title: {
    color: "#111827",
    fontSize: 30,
    fontWeight: "800",
  },
});
