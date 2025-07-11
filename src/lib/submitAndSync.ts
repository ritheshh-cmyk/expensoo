import { syncDB, QueueItem } from "./syncQueue";
import { toast } from "../hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

const MAX_RETRIES = 10;
const BASE_DELAY = 2000; // 2 seconds

export async function submitData(type: string, data: any, isOnline: boolean, apiUrl: string) {
  const item: QueueItem = {
    id: uuidv4(),
    type,
    data,
    createdAt: Date.now(),
    retryCount: 0,
    status: "pending",
  };
  if (isOnline) {
    try {
      await sendToBackend(item, apiUrl);
      return;
    } catch (err) {
      item.lastError = String(err);
    }
  }
  await syncDB.queue.add(item);
  notifyOffline();
}

async function sendToBackend(item: QueueItem, apiUrl: string) {
  const res = await fetch(`${apiUrl}/${item.type}`, {
    method: "POST",
    body: JSON.stringify(item.data),
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
}

export async function syncQueue(apiUrl: string) {
  const items = await syncDB.queue.where("status").equals("pending").toArray();
  for (const item of items) {
    try {
      await syncDB.queue.update(item.id, { status: "syncing" });
      await sendToBackend(item, apiUrl);
      await syncDB.queue.update(item.id, { status: "synced" });
      await syncDB.queue.delete(item.id);
    } catch (err) {
      const retryCount = item.retryCount + 1;
      const status = retryCount >= MAX_RETRIES ? "failed" : "pending";
      await syncDB.queue.update(item.id, {
        retryCount,
        lastError: String(err),
        status,
      });
      if (status === "failed") {
        notifySyncFailed(item);
      } else {
        // Exponential backoff
        await new Promise(res => setTimeout(res, BASE_DELAY * Math.pow(2, Math.min(retryCount, 6))));
      }
    }
  }
}

function notifyOffline() {
  toast({
    title: "Offline",
    description: "Offline – will sync when online.",
  });
}

function notifySyncFailed(item: QueueItem) {
  toast({
    title: "Sync Failed",
    description: `Failed to sync ${item.type} after multiple attempts. Please check your connection or contact support.`,
  });
} 