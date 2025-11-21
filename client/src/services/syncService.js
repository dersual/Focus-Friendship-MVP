// client/src/services/syncService.js

const SYNC_QUEUE_KEY = "ffm:queue";
const SYNC_INTERVAL = 60 * 1000; // 1 minute

let syncIntervalId = null;

// Helper to get the current queue from localStorage
const getSyncQueue = () => {
  try {
    const storedQueue = localStorage.getItem(SYNC_QUEUE_KEY);
    return storedQueue ? JSON.parse(storedQueue) : [];
  } catch (error) {
    console.error("Error loading sync queue from localStorage:", error);
    return [];
  }
};

// Helper to save the queue to localStorage
const saveSyncQueue = (queue) => {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Error saving sync queue to localStorage:", error);
  }
};

// Adds an item to the sync queue
export const enqueueForSync = (type, data) => {
  const queue = getSyncQueue();
  queue.push({ type, data, timestamp: new Date().toISOString() });
  saveSyncQueue(queue);
  console.log(`Enqueued for sync (${type}):`, data);
};

// Attempts to process the sync queue
export const processSyncQueue = async () => {
  // Temporarily disable sync to prevent network errors in local development
  console.log("Sync service temporarily disabled for local development");
  return;

  const queue = getSyncQueue();
  if (queue.length === 0) {
    return;
  }

  if (!navigator.onLine) {
    console.log("Offline. Sync queue will be processed when online.");
    return;
  }

  console.log(`Attempting to process sync queue (${queue.length} items)...`);
  const successfulSyncs = [];

  for (const item of queue) {
    try {
      let response;
      if (item.type === "session") {
        response = await fetch("http://localhost:3001/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.data),
        });
      } else if (item.type === "user") {
        response = await fetch("http://localhost:3001/api/user/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.data),
        });
      }

      if (response && response.ok) {
        console.log(`Successfully synced ${item.type}:`, item.data);
        successfulSyncs.push(item);
      } else {
        console.error(
          `Failed to sync ${item.type}:`,
          item.data,
          response ? response.statusText : "Network error",
        );
        // If a request fails, stop processing and retry later
        break;
      }
    } catch (error) {
      console.error(`Error during sync of ${item.type}:`, item.data, error);
      // If an error occurs, stop processing and retry later
      break;
    }
  }

  // Remove successful syncs from the queue
  const newQueue = queue.filter((item) => !successfulSyncs.includes(item));
  saveSyncQueue(newQueue);

  if (newQueue.length === 0) {
    console.log("Sync queue processed successfully.");
  } else {
    console.log(`${newQueue.length} items remaining in sync queue.`);
  }
};

// Starts the periodic sync process
export const startSyncService = () => {
  if (!syncIntervalId) {
    syncIntervalId = setInterval(processSyncQueue, SYNC_INTERVAL);
    console.log("Sync service started.");
    // Also process immediately on start
    processSyncQueue();
  }
};

// Stops the periodic sync process
export const stopSyncService = () => {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
    console.log("Sync service stopped.");
  }
};

// Listen for online/offline events to trigger sync
window.addEventListener("online", processSyncQueue);
window.addEventListener("offline", () =>
  console.log("Application is offline."),
);

// Initialize sync service on load
startSyncService();
