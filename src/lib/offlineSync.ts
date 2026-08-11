import { openDB } from 'idb';

const DB_NAME = 'ConstructTrackOfflineDB';

export async function initOfflineDB() {
  if (typeof window === 'undefined') return null;
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('queued_logs')) {
        db.createObjectStore('queued_logs', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

export async function saveOfflineLog(logData: any) {
  try {
    const db = await initOfflineDB();
    if (!db) return;
    await db.add('queued_logs', { ...logData, timestamp: new Date().toISOString() });
    
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      // @ts-ignore
      await registration.sync.register('sync-site-logs');
    }
  } catch (err) {
    console.error('Failed to save log to IndexedDB:', err);
  }
}
