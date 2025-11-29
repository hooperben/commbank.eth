/**
 * Hash function to generate 2-digit suffix for nickname verification
 * @param nickname - The nickname to hash
 * @returns 2-digit hash suffix (e.g., "22", "05")
 */
export function hashNickname(nickname: string): string {
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    const char = nickname.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Get last 2 digits of absolute value
  return String(Math.abs(hash) % 100).padStart(2, "0");
}

/**
 * Add hash suffix to nickname
 * @param nickname - The nickname to append hash to
 * @returns Nickname with hash suffix (e.g., "ben.22")
 */
export function addNicknameHash(nickname: string): string {
  if (!nickname) return "";
  const hash = hashNickname(nickname);
  return `${nickname}.${hash}`;
}

/**
 * Verify that a nickname with hash suffix is valid
 * @param nicknameWithHash - The nickname with hash suffix (e.g., "ben.22")
 * @returns true if the hash is valid, false otherwise
 */
export function verifyNicknameHash(nicknameWithHash: string): boolean {
  if (!nicknameWithHash || !nicknameWithHash.includes(".")) return false;

  const parts = nicknameWithHash.split(".");
  if (parts.length !== 2) return false;

  const [nickname, providedHash] = parts;
  const expectedHash = hashNickname(nickname);

  return providedHash === expectedHash;
}
