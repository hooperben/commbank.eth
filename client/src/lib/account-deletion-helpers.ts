/**
 * Clear all localStorage data
 */
export function clearLocalStorage(): void {
  localStorage.clear();
}

/**
 * Clear all sessionStorage data
 */
export function clearSessionStorage(): void {
  sessionStorage.clear();
}

/**
 * Delete all IndexedDB databases
 */
export async function clearIndexedDB(): Promise<void> {
  // Get list of all databases
  const databases = await indexedDB.databases();

  // Delete each database
  for (const db of databases) {
    if (db.name) {
      indexedDB.deleteDatabase(db.name);
    }
  }
}

/**
 * Delete all account data (localStorage, sessionStorage, IndexedDB)
 */
export async function deleteAllAccountData(): Promise<void> {
  clearLocalStorage();
  clearSessionStorage();
  await clearIndexedDB();
}
