// Durable fallback for browsers where localStorage is blocked or full.
export type BookmarkBackup = { ids: string; edits: string };
async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('yemunnai-bookmarks', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('saved');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Bookmark storage blocked'));
  });
}
export async function bookmarkBackup(key: string, value?: BookmarkBackup | null): Promise<BookmarkBackup | undefined> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction('saved', value === undefined ? 'readonly' : 'readwrite');
      const store = transaction.objectStore('saved');
      const request = value === undefined ? store.get(key) : value === null ? store.delete(key) : store.put(value, key);
      transaction.oncomplete = () => resolve(value === undefined ? request.result : value ?? undefined);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { db.close(); }
}
