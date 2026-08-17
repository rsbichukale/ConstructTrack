import { api, getAuthToken } from './apiClient';
import { getAppState, saveAppState } from './dbState';
import { fetchStateFromBackend } from './backendSync';
import { saveFullLocalState } from './localDb';

let isSyncInProgress = false;
let eventSourceInstance = null;

export async function runSyncEngine(forceFull = false) {
  if (typeof window === 'undefined' || isSyncInProgress) return;
  const token = getAuthToken();
  if (!token) return;

  isSyncInProgress = true;
  try {
    const freshState = await fetchStateFromBackend();
    if (freshState) {
      saveAppState(freshState);
      void saveFullLocalState(freshState);
    }
  } catch (err) {
    console.warn('[Sync] State refresh notice:', err.message);
  } finally {
    isSyncInProgress = false;
  }
}

export function startBackgroundSyncWorker() {
  if (typeof window === 'undefined') return;
  if (window.__constructtrack_sync_started) return;
  window.__constructtrack_sync_started = true;

  // Real-time LAN Server-Sent Events (SSE) listener
  try {
    if (!eventSourceInstance && typeof EventSource !== 'undefined') {
      eventSourceInstance = new EventSource('/api/sync/events');
      
      eventSourceInstance.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('⚡ [LAN Realtime Event]:', data);
        } catch {
          // ignore
        }
      };

      eventSourceInstance.addEventListener('STATE_UPDATED', () => {
        void runSyncEngine(true);
      });

      eventSourceInstance.onerror = () => {
        // SSE gracefully reconnects automatically
      };
    }
  } catch (err) {
    console.warn('[SSE] EventSource init note:', err.message);
  }
}
