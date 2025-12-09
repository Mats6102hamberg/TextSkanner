export interface AuthUser {
  id: string;
}

/**
 * Placeholder for the eventual auth integration.
 * Replace with the real session lookup when available.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const userId = process.env.NEXT_PUBLIC_MOCK_USER_ID ?? "demo-user";
  if (!userId) {
    return null;
  }
  return { id: userId };
}
