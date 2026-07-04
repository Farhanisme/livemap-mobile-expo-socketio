const LOCATION_UPDATE_INTERVAL_MS = 1000;
const lastLocationUpdateByUser = new Map<string, number>();

export function canAcceptLocationUpdate(roomId: string, userId: string): boolean {
  const key = `${roomId}:${userId}`;
  const now = Date.now();
  const lastUpdateAt = lastLocationUpdateByUser.get(key) ?? 0;

  if (now - lastUpdateAt < LOCATION_UPDATE_INTERVAL_MS) {
    return false;
  }

  lastLocationUpdateByUser.set(key, now);
  return true;
}
