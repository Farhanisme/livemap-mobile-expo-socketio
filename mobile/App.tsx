import { useMemo, useState } from "react";
import { StatusBar } from "expo-status-bar";

import { useSocket } from "./src/hooks/useSocket";
import { LiveMapScreen } from "./src/screens/LiveMapScreen";
import { JoinRoomScreen } from "./src/screens/JoinRoomScreen";
import type { RemoteUser } from "./src/types/realtime";
import { generateUserId } from "./src/utils/generateUserId";

type JoinedSession = {
  userId: string;
  name: string;
  roomId: string;
  roomUsers: RemoteUser[];
};

export default function App() {
  const userId = useMemo(() => generateUserId(), []);
  const { connectionStatus, errorMessage, joinRoom, roomUsers } = useSocket();
  const [joinedSession, setJoinedSession] = useState<JoinedSession | null>(null);

  async function handleJoin(name: string, roomId: string) {
    const result = await joinRoom({
      userId,
      name,
      roomId,
    });

    setJoinedSession({
      userId,
      name,
      roomId: result.roomId,
      roomUsers: result.users,
    });
  }

  if (!joinedSession) {
    return (
      <>
        <StatusBar style="auto" />
        <JoinRoomScreen
          connectionStatus={connectionStatus}
          errorMessage={errorMessage}
          onJoin={handleJoin}
        />
      </>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <LiveMapScreen
        connectionStatus={connectionStatus}
        name={joinedSession.name}
        roomId={joinedSession.roomId}
        roomUsers={roomUsers.length > 0 ? roomUsers : joinedSession.roomUsers}
        userId={joinedSession.userId}
      />
    </>
  );
}
