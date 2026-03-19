import * as Crypto from 'expo-crypto';

/** Generate a UUID v4 via expo-crypto. */
export function generateId(): string {
  return Crypto.randomUUID();
}
