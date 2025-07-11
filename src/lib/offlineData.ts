// Offline Data Management for Mobile Devices
// Provides local caching, sync queue, and background sync capabilities

interface SyncItem {
  id: string;
  type: 'transaction' | 'supplier' | 'expenditure' | 'bill';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
}

interface CachedData {
  transactions: any[];
  suppliers: any[];
  expenditures: any[];
  bills: any[];
  lastSync: number;
}

class OfflineDataManager {
  private syncQueue: SyncItem[] = [];
  private cache: CachedData = {
    transactions: [],
    suppliers: [],
    expenditures: [],
    bills: [],
    lastSync: 0,
  };
  private isOnline = false;
  private syncInProgress = false;

  constructor() {
    this.loadFromStorage();
    this.setupOnlineListener();
  }

  // Initialize offline data manager
  async initialize() {
    await this.loadFromStorage();
    this.setupOnlineListener();
    this.startBackgroundSync();
  }

  // Load data from localStorage
  private async loadFromStorage() {
    try {
      const cached = localStorage.getItem('offlineCache');
      if (cached) {
        this.cache = JSON.parse(cached);
      }

      const queue = localStorage.getItem('syncQueue');
      if (queue) {
        this.syncQueue = JSON.parse(queue);
      }
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
}

  // Save data to localStorage
  private async saveToStorage() {
    try {
      localStorage.setItem('offlineCache', JSON.stringify(this.cache));
      localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }

  // Setup online/offline listener
  private setupOnlineListener() {
    const handleOnline = () => {
      this.isOnline = true;
      this.processSyncQueue();
    };

    const handleOffline = () => {
      this.isOnline = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    this.isOnline = navigator.onLine;
  }

  // Start background sync
  private startBackgroundSync() {
    // Check for sync every 30 seconds when online
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress && this.syncQueue.length > 0) {
        this.processSyncQueue();
      }
    }, 30000);
  }

  // Add item to sync queue
  async addToSyncQueue(type: SyncItem['type'], action: SyncItem['action'], data: any) {
    const syncItem: SyncItem = {
      id: `${type}-${action}-${Date.now()}-${Math.random()}`,
      type,
      action,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.syncQueue.push(syncItem);
    await this.saveToStorage();

    // Try to sync immediately if online
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  // Process sync queue
  async processSyncQueue() {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return;
  }

    this.syncInProgress = true;

    try {
      const itemsToProcess = [...this.syncQueue];
      
      for (const item of itemsToProcess) {
        try {
          await this.processSyncItem(item);
          
          // Remove from queue on success
          this.syncQueue = this.syncQueue.filter(q => q.id !== item.id);
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          
          // Increment retry count
          item.retryCount++;
          
          // Remove from queue if max retries reached
          if (item.retryCount >= 3) {
            this.syncQueue = this.syncQueue.filter(q => q.id !== item.id);
            console.warn(`Removed item ${item.id} after max retries`);
          }
        }
      }

      await this.saveToStorage();
    } finally {
      this.syncInProgress = false;
    }
  }

  // Process individual sync item
  private async processSyncItem(item: SyncItem) {
    const { apiClient } = await import('./api');

    switch (item.type) {
      case 'transaction':
        await this.processTransactionSync(item);
        break;
      case 'supplier':
        await this.processSupplierSync(item);
        break;
      case 'expenditure':
        await this.processExpenditureSync(item);
        break;
      case 'bill':
        await this.processBillSync(item);
        break;
  }
}

  // Process transaction sync
  private async processTransactionSync(item: SyncItem) {
    const { apiClient } = await import('./api');

    switch (item.action) {
      case 'create':
        await apiClient.createTransaction(item.data);
        break;
      case 'update':
        await apiClient.updateTransaction(item.data.id, item.data);
        break;
      case 'delete':
        await apiClient.deleteTransaction(item.data.id);
        break;
    }
  }

  // Process supplier sync
  private async processSupplierSync(item: SyncItem) {
    const { apiClient } = await import('./api');

    switch (item.action) {
      case 'create':
        await apiClient.createSupplier(item.data);
        break;
      case 'update':
        await apiClient.updateSupplier(item.data.id, item.data);
        break;
    }
  }

  // Process expenditure sync
  private async processExpenditureSync(item: SyncItem) {
    const { apiClient } = await import('./api');

    switch (item.action) {
      case 'create':
        await apiClient.createExpenditure(item.data);
        break;
    }
  }

  // Process bill sync
  private async processBillSync(item: SyncItem) {
    const { apiClient } = await import('./api');

    switch (item.action) {
      case 'create':
        await apiClient.createBill(item.data);
        break;
  }
}

  // Cache data locally
  async cacheData(type: keyof CachedData, data: any[]) {
    if (type === 'lastSync') {
      this.cache.lastSync = data as any;
    } else {
      this.cache[type] = data;
    }
    this.cache.lastSync = Date.now();
    await this.saveToStorage();
  }

  // Get cached data
  getCachedData(type: keyof CachedData): any[] {
    const data = this.cache[type];
    return Array.isArray(data) ? data : [];
  }

  // Get last sync time
  getLastSyncTime(): number {
    return this.cache.lastSync;
  }

  // Check if data is stale (older than 5 minutes)
  isDataStale(): boolean {
    return Date.now() - this.cache.lastSync > 5 * 60 * 1000;
  }

  // Get sync queue status
  getSyncQueueStatus() {
    return {
      pending: this.syncQueue.length,
      inProgress: this.syncInProgress,
      isOnline: this.isOnline,
    };
}

  // Clear all offline data
  async clearAllData() {
    this.cache = {
      transactions: [],
      suppliers: [],
      expenditures: [],
      bills: [],
      lastSync: 0,
    };
    this.syncQueue = [];
    await this.saveToStorage();
  }

  // Get storage usage
  getStorageUsage(): { used: number; available: number } {
    try {
      const used = new Blob([
        localStorage.getItem('offlineCache') || '',
        localStorage.getItem('syncQueue') || '',
      ]).size;
      
      // Estimate available storage (most browsers limit to ~5-10MB)
      const available = 5 * 1024 * 1024; // 5MB estimate
      
      return { used, available };
    } catch {
      return { used: 0, available: 0 };
    }
  }

  // Check if storage is full
  isStorageFull(): boolean {
    const { used, available } = this.getStorageUsage();
    return used > available * 0.9; // 90% full
}

  // Optimize storage by removing old data
  async optimizeStorage() {
    if (this.isStorageFull()) {
      // Remove oldest sync queue items
      this.syncQueue.sort((a, b) => a.timestamp - b.timestamp);
      this.syncQueue = this.syncQueue.slice(-50); // Keep only last 50 items
      
      // Clear old cached data
      if (Date.now() - this.cache.lastSync > 24 * 60 * 60 * 1000) { // 24 hours
        this.cache = {
          transactions: [],
          suppliers: [],
          expenditures: [],
          bills: [],
          lastSync: 0,
        };
      }
      
      await this.saveToStorage();
    }
}

  // Add missing methods
  onOnline(callback: () => void) {
    const handleOnline = () => {
      this.isOnline = true;
      callback();
      this.processSyncQueue();
    };
    window.addEventListener('online', handleOnline);
  }

  setTransactions(transactions: any[]) {
    this.cache.transactions = transactions;
    this.saveToStorage();
  }

  saveTransaction(transaction: any) {
    this.cache.transactions.push(transaction);
    this.saveToStorage();
    this.addToSyncQueue('transaction', 'create', transaction);
  }

  updateTransaction(transaction: any) {
    const index = this.cache.transactions.findIndex(t => t.id === transaction.id);
    if (index !== -1) {
      this.cache.transactions[index] = transaction;
      this.saveToStorage();
      this.addToSyncQueue('transaction', 'update', transaction);
    }
  }

  deleteTransaction(id: string) {
    this.cache.transactions = this.cache.transactions.filter(t => t.id !== id);
    this.saveToStorage();
    this.addToSyncQueue('transaction', 'delete', { id });
}

  // Get all transactions
  getTransactions(): any[] {
    return this.cache.transactions;
  }

  // Sync with backend
  async syncWithBackend(handlers: {
    add: (txn: any) => Promise<void>;
    update: (txn: any) => Promise<void>;
    delete: (id: string) => Promise<void>;
  }) {
    if (!this.isOnline) {
      console.log('Offline - sync will be queued');
      return;
    }

    try {
      // Process sync queue
      await this.processSyncQueue();
      
      // Call handlers for any pending operations
      for (const item of this.syncQueue) {
        if (item.type === 'transaction') {
          switch (item.action) {
            case 'create':
              await handlers.add(item.data);
              break;
            case 'update':
              await handlers.update(item.data);
              break;
            case 'delete':
              await handlers.delete(item.data.id);
              break;
}
        }
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}

// Export singleton instance
export const offlineDataManager = new OfflineDataManager();

// Export utility functions
export const offlineUtils = {
  // Check if device is offline
  isOffline: () => !navigator.onLine,

  // Check if data should be cached
  shouldCache: (data: any) => {
    return data && typeof data === 'object' && Object.keys(data).length > 0;
  },

  // Generate offline ID
  generateOfflineId: () => `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

  // Format storage size
  formatStorageSize: (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Debounce function for sync operations
  debounce: (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
};

// Export functions for external use
export const offlineData = new OfflineDataManager();

// Export individual functions for direct use
export const onOnline = (callback: () => void) => {
  offlineData.onOnline(callback);
};

export const setTransactions = (transactions: any[]) => {
  offlineData.setTransactions(transactions);
};

export const saveTransaction = (transaction: any) => {
  offlineData.saveTransaction(transaction);
};

export const updateTransaction = (transaction: any) => {
  offlineData.updateTransaction(transaction);
};

export const deleteTransaction = (id: string) => {
  offlineData.deleteTransaction(id);
};

export const getTransactions = () => {
  return offlineData.getTransactions();
};

export const syncWithBackend = (handlers: {
  add: (txn: any) => Promise<void>;
  update: (txn: any) => Promise<void>;
  delete: (id: string) => Promise<void>;
}) => {
  return offlineData.syncWithBackend(handlers);
}; 