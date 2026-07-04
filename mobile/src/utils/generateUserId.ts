let sessionUserId: string | null = null;

export function generateUserId(): string {
  if (!sessionUserId) {
    const randomString = Math.random().toString(36).slice(2, 10);
    sessionUserId = `user_${Date.now()}_${randomString}`;
  }

  return sessionUserId;
}
