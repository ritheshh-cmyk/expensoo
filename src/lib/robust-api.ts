// Robust API Client for Pixel Nest - Works Offline and Online
// Supports multiple backends, local storage, sync queue, and automatic failover

interface BackendConfig {
  url: string;
  name: string;
  priority: number;
  timeout: number;
}

interface OfflineAction {
  id: string;
  endpoint: string;
  method: string;
  data?: any;
  timestamp: number;
  retryCount: number;
}

interface CachedResponse {
  data: any;
  timestamp: number;
  etag?: string;
}

class RobustApiClient {
  private backends: BackendConfig[] = [
    {
      url: "https://positive-kodiak-friendly.ngrok-free.app",
      name: "Ngrok Backend",
      priority: 1,
      timeout: 15000
    }
  ];

  private offlineQueue: OfflineAction[] = [];
  private cache: Map<string, CachedResponse> = new Map();
  private isOnline = navigator.onLine;
  private currentBackend: BackendConfig | null = null;
  private syncInProgress = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    await this.loadOfflineQueue();
    this.setupNetworkListeners();
    this.startHealthChecks();
    this.processOfflineQueue();
  }

  // Network status management
  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Network: Online - Processing offline queue');
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 Network: Offline - Using local cache');
    });
  }

  // Health check all backends
  private async startHealthChecks() {
    setInterval(async () => {
      await this.checkBackendHealth();
    }, 30000); // Check every 30 seconds
  }

  private async checkBackendHealth() {
    for (const backend of this.backends) {
      try {
        const isHealthy = await this.testBackend(backend);
        if (isHealthy && !this.currentBackend) {
          this.currentBackend = backend;
          console.log(`✅ Backend ${backend.name} is healthy and selected`);
        }
      } catch (error) {
        console.warn(`❌ Backend ${backend.name} health check failed:`, error);
      }
    }
  }

  private async testBackend(backend: BackendConfig): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), backend.timeout);

      const response = await fetch(`${backend.url}/health`, {
        signal: controller.signal,
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Get best available backend
  private async getBestBackend(): Promise<BackendConfig | null> {
    if (this.currentBackend) {
      return this.currentBackend;
    }

    // Try to find a healthy backend
    for (const backend of this.backends.sort((a, b) => a.priority - b.priority)) {
      if (await this.testBackend(backend)) {
        this.currentBackend = backend;
        return backend;
      }
    }

    return null;
  }

  // Main request method with offline support
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const isWriteAction = ['POST', 'PUT', 'DELETE'].includes(options.method || 'GET');
    const cacheKey = `${options.method || 'GET'}:${endpoint}`;

    // For read operations, try cache first if offline
    if (!isWriteAction && !this.isOnline) {
      const cached = this.getCachedResponse(cacheKey);
      if (cached) {
        console.log('📦 Serving from cache:', endpoint);
        return cached;
      }
    }

    // Try online request
    if (this.isOnline) {
      try {
        const result = await this.makeOnlineRequest<T>(endpoint, options);
        
        // Cache successful responses
        if (!isWriteAction) {
          this.cacheResponse(cacheKey, result);
        }
        
        return result;
      } catch (error) {
        console.warn('Online request failed:', error);
      }
    }

    // Handle write actions when offline
    if (isWriteAction && !this.isOnline) {
      return this.handleOfflineWrite<T>(endpoint, options);
    }

    // For read actions when offline, return cached data or empty result
    if (!isWriteAction && !this.isOnline) {
      const cached = this.getCachedResponse(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Return appropriate empty data structure based on endpoint
      return this.getEmptyResponse<T>(endpoint);
    }

    throw new Error('No backend available and no cached data');
  }

  private async makeOnlineRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
    const backend = await this.getBestBackend();
    if (!backend) {
      throw new Error('No healthy backend available');
    }

    const url = `${backend.url}${endpoint}`;
    const token = localStorage.getItem("callmemobiles_token");

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        ...(token && { "Authorization": `Bearer ${token}` }),
        ...options.headers,
      },
      signal: AbortSignal.timeout(backend.timeout),
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  private async handleOfflineWrite<T>(endpoint: string, options: RequestInit): Promise<T> {
    const action: OfflineAction = {
      id: `${Date.now()}-${Math.random()}`,
      endpoint,
      method: options.method || 'POST',
      data: options.body ? JSON.parse(options.body as string) : undefined,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.offlineQueue.push(action);
    await this.saveOfflineQueue();

    console.log('📝 Queued offline action:', action);

    // Return optimistic response
    return this.getOptimisticResponse<T>(endpoint, action);
  }

  // Cache management
  private cacheResponse(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Limit cache size
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  private getCachedResponse<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if cache is still valid (1 hour)
    if (Date.now() - cached.timestamp > 3600000) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  // Offline queue management
  private async saveOfflineQueue() {
    try {
      localStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  private async loadOfflineQueue() {
    try {
      const saved = localStorage.getItem('offlineQueue');
      if (saved) {
        this.offlineQueue = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  private async processOfflineQueue() {
    if (this.syncInProgress || !this.isOnline || this.offlineQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log('🔄 Processing offline queue...');

    try {
      const actions = [...this.offlineQueue];
      
      for (const action of actions) {
        try {
          await this.processOfflineAction(action);
          this.offlineQueue = this.offlineQueue.filter(a => a.id !== action.id);
        } catch (error) {
          console.error('Failed to process offline action:', error);
          action.retryCount++;
          
          if (action.retryCount >= 3) {
            this.offlineQueue = this.offlineQueue.filter(a => a.id !== action.id);
            console.warn('Removed action after max retries:', action);
          }
        }
      }

      await this.saveOfflineQueue();
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processOfflineAction(action: OfflineAction) {
    const backend = await this.getBestBackend();
    if (!backend) {
      throw new Error('No backend available for sync');
    }

    const url = `${backend.url}${action.endpoint}`;
    const token = localStorage.getItem("callmemobiles_token");

    const response = await fetch(url, {
      method: action.method,
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        ...(token && { "Authorization": `Bearer ${token}` }),
      },
      body: action.data ? JSON.stringify(action.data) : undefined,
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`);
    }

    console.log('✅ Synced offline action:', action);
  }

  // Helper methods for empty responses
  private getEmptyResponse<T>(endpoint: string): T {
    if (endpoint.includes('/transactions')) return [] as T;
    if (endpoint.includes('/suppliers')) return [] as T;
    if (endpoint.includes('/expenditures')) return [] as T;
    if (endpoint.includes('/bills')) return [] as T;
    if (endpoint.includes('/inventory')) return [] as T;
    if (endpoint.includes('/dashboard')) return {} as T;
    if (endpoint.includes('/reports')) return [] as T;
    if (endpoint.includes('/statistics')) return {} as T;
    return {} as T;
  }

  private getOptimisticResponse<T>(endpoint: string, action: OfflineAction): T {
    // Return optimistic response for write actions
    if (action.data) {
      return {
        ...action.data,
        id: `temp-${Date.now()}`,
        _offline: true,
        _pendingSync: true
      } as T;
    }
    return { success: true, _offline: true } as T;
  }

  // Public API methods
  getConnectionStatus() {
    return {
      online: this.isOnline,
      currentBackend: this.currentBackend?.name || 'None',
      offlineQueueLength: this.offlineQueue.length,
      cacheSize: this.cache.size
    };
  }

  async getSystemStatus() {
    const backend = await this.getBestBackend();
    if (backend) {
      try {
        return await this.makeOnlineRequest('/health', {});
      } catch (error) {
        return { status: 'offline', error: error.message };
      }
    }
    return { status: 'offline', error: 'No backend available' };
  }

  // Authentication methods
  async login(username: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  }

  async getCurrentUser() {
    try {
      const userData = localStorage.getItem("callmemobiles_user");
      if (userData) {
        return JSON.parse(userData);
      }
      const response = await this.request<{ user: any }>('/api/auth/me');
      if (response.user) {
        localStorage.setItem("callmemobiles_user", JSON.stringify(response.user));
        return response.user;
      }
    } catch (error) {
      console.error('Get current user error:', error);
    }
    return null;
  }

  async logout() {
    localStorage.removeItem("callmemobiles_token");
    localStorage.removeItem("callmemobiles_user");
  }

  // Transaction methods
  async getTransactions() {
    return this.request('/api/transactions');
  }

  async createTransaction(data: any) {
    return this.request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateTransaction(id: string, data: any) {
    return this.request(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteTransaction(id: string) {
    return this.request(`/api/transactions/${id}`, {
      method: 'DELETE'
    });
  }

  // Supplier methods
  async getSuppliers() {
    return this.request('/api/suppliers');
  }

  async createSupplier(data: any) {
    return this.request('/api/suppliers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateSupplier(id: string, data: any) {
    return this.request(`/api/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteSupplier(id: string) {
    return this.request(`/api/suppliers/${id}`, {
      method: 'DELETE'
    });
  }

  // Inventory methods
  async getInventory() {
    return this.request('/api/inventory');
  }

  // Dashboard methods
  async getDashboardData() {
    return this.request('/api/dashboard');
  }

  // Reports methods
  async getReports(dateRange?: string) {
    const params = dateRange ? `?dateRange=${dateRange}` : '';
    return this.request(`/api/reports${params}`);
  }

  // Expenditure methods
  async getExpenditures() {
    return this.request('/api/expenditures');
  }

  async createExpenditure(data: any) {
    return this.request('/api/expenditures', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateExpenditure(id: string, data: any) {
    return this.request(`/api/expenditures/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteExpenditure(id: string) {
    return this.request(`/api/expenditures/${id}`, {
      method: 'DELETE'
    });
  }

  // Bill methods
  async getBills() {
    return this.request('/api/bills');
  }

  async createBill(data: any) {
    return this.request('/api/bills', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateBill(id: string, data: any) {
    return this.request(`/api/bills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteBill(id: string) {
    return this.request(`/api/bills/${id}`, {
      method: 'DELETE'
    });
  }

  // Search methods
  async search(query: string) {
    return this.request(`/api/search?q=${encodeURIComponent(query)}`);
  }

  // SMS methods
  async sendBillSMS(data: { phone: string; message: string }) {
    return this.request('/api/sms/send', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Statistics methods
  async getTodayStats() {
    return this.request('/api/statistics/today');
  }

  async getWeekStats() {
    return this.request('/api/statistics/week');
  }

  async getMonthStats() {
    return this.request('/api/statistics/month');
  }

  async getYearStats() {
    return this.request('/api/statistics/year');
  }

  // Supplier payment methods
  async createSupplierPayment(data: any) {
    return this.request('/api/suppliers/payments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getSupplierExpenditureSummary() {
    return this.request('/api/suppliers/expenditure-summary');
  }

  // Utility methods
  async clearAllData() {
    return this.request('/api/clear-all-data', {
      method: 'DELETE'
    });
  }

  // Clear cache and offline queue
  clearLocalData() {
    this.cache.clear();
    this.offlineQueue = [];
    localStorage.removeItem('offlineQueue');
    console.log('🧹 Local data cleared');
  }
}

// Export singleton instance
export const robustApiClient = new RobustApiClient();
export default robustApiClient; 