export function isValidCoordinate(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export function shouldSendLocationUpdate(
  lastSentAt: number | null,
  now: number,
  minimumIntervalMs = 1000,
): boolean {
  return lastSentAt === null || now - lastSentAt >= minimumIntervalMs;
}
