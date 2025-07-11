import Dexie, { Table } from "dexie";
import { v4 as uuidv4 } from "uuid";

export interface QueueItem {
  id: string;
  type: string;
  data: any;
  createdAt: number;
  retryCount: number;
  lastError?: string;
  status: "pending" | "syncing" | "failed" | "synced";
}

class SyncDB extends Dexie {
  queue!: Table<QueueItem, string>;
  constructor() {
    super("SyncDB");
    this.version(1).stores({ queue: "id,type,createdAt,status" });
  }
}
export const syncDB = new SyncDB(); 