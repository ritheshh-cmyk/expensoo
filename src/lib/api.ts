// Robust API Client for Pixel Nest - Works Offline and Online
// Supports single backend (ngrok), local storage, sync queue, and automatic failover

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
  private backend: BackendConfig = {
    url: this.getBackendUrl(),
    name: import.meta.env.MODE === 'production' ? "Production Backend" : "Local Backend",
    priority: 1,
    timeout: 15000
  };

  private getBackendUrl(): string {
    if (import.meta.env.MODE === 'production') {
      return import.meta.env.VITE_PRODUCTION_BACKEND_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:10000';
    }
    return import.meta.env.VITE_BACKEND_URL || 'http://localhost:10000';
  }

  // Method to update backend URL dynamically
  updateBackendUrl(url: string) {
    this.backend.url = url;
    console.log(`🔄 Backend URL updated to: ${url}`);
  }

  private offlineQueue: OfflineAction[] = [];
  private cache: Map<string, CachedResponse> = new Map();
  private isOnline = navigator.onLine;
  private syncInProgress = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    await this.loadOfflineQueue();
    this.setupNetworkListeners();
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

  // Main request method with offline support and instant loading
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const isWriteAction = ['POST', 'PUT', 'DELETE'].includes(options.method || 'GET');
    const cacheKey = `${options.method || 'GET'}:${endpoint}`;

    // For GET requests, return cached data immediately for instant loading
    if (!isWriteAction) {
      const cached = this.getCachedResponse<T>(cacheKey);
      if (cached) {
        console.log('⚡ Instant loading from cache:', endpoint);
        // Update cache in background if online
        if (this.isOnline) {
          this.updateCacheInBackground(endpoint, options, cacheKey);
        }
        return cached;
      }
    }

    // For write actions, implement optimistic updates
    if (isWriteAction && this.isOnline) {
      // Return optimistic response immediately
      const optimisticResponse = this.getOptimisticResponse<T>(endpoint, {
        id: `temp-${Date.now()}`,
        endpoint,
        method: options.method || 'POST',
        data: options.body ? JSON.parse(options.body as string) : undefined,
        timestamp: Date.now(),
        retryCount: 0
      });
      
      // Execute actual request in background
      this.executeWriteInBackground(endpoint, options, cacheKey);
      
      return optimisticResponse;
    }

    // Try online request for first-time loads
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
      const cached = this.getCachedResponse<T>(cacheKey);
      if (cached) {
        return cached;
      }
      // Return appropriate empty data structure based on endpoint
      return this.getEmptyResponse<T>(endpoint);
    }

    throw new Error('No backend available and no cached data');
  }

  // Update cache in background for stale-while-revalidate pattern
  private async updateCacheInBackground(endpoint: string, options: RequestInit, cacheKey: string) {
    try {
      const data = await this.makeOnlineRequest(endpoint, options);
      this.cacheResponse(cacheKey, data);
      console.log('🔄 Background cache update completed for:', endpoint);
    } catch (error) {
      console.log('Background cache update failed:', error);
    }
  }

  // Execute write operations in background
  private async executeWriteInBackground(endpoint: string, options: RequestInit, cacheKey: string) {
    try {
      const data = await this.makeOnlineRequest(endpoint, options);
      // Invalidate related caches
      this.invalidateRelatedCaches(endpoint);
      console.log('✅ Background write operation completed for:', endpoint);
    } catch (error) {
      console.error('Background write operation failed:', error);
      // Handle failure - could show notification to user
    }
  }

  // Invalidate related caches when data changes
  private invalidateRelatedCaches(endpoint: string) {
    const keysToInvalidate: string[] = [];
    
    if (endpoint.includes('/transactions')) {
      keysToInvalidate.push('GET:/api/transactions', 'GET:/api/dashboard', 'GET:/api/reports');
    }
    if (endpoint.includes('/suppliers')) {
      keysToInvalidate.push('GET:/api/suppliers');
    }
    if (endpoint.includes('/expenditures')) {
      keysToInvalidate.push('GET:/api/expenditures', 'GET:/api/dashboard');
    }
    if (endpoint.includes('/bills')) {
      keysToInvalidate.push('GET:/api/bills', 'GET:/api/dashboard');
    }
    
    keysToInvalidate.forEach(key => {
      this.cache.delete(key);
      console.log('🗑️ Invalidated cache:', key);
    });
  }

  private async makeOnlineRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
    const url = `${this.backend.url}${endpoint}`;
    const token = localStorage.getItem("callmemobiles_token");

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "Accept": "application/json",
        "Cache-Control": "no-cache",
        ...(token && { "Authorization": `Bearer ${token}` }),
        ...options.headers,
      },
      mode: 'cors',
      credentials: 'omit',
      signal: AbortSignal.timeout(this.backend.timeout),
      ...options,
    };

    console.log(`🌐 Making request to: ${url}`);
    console.log(`🔑 Token present: ${token ? 'Yes' : 'No'}`);
    
    try {
      const response = await fetch(url, config);
      
      console.log(`📡 Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.text();
          console.error(`❌ Error response body:`, errorData);
          if (errorData) {
            errorMessage += ` - ${errorData}`;
          }
        } catch (e) {
          console.error(`❌ Could not read error response:`, e);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log(`✅ Response data for ${endpoint}:`, data);
      return data;
    } catch (error) {
      console.error(`❌ Request failed for ${endpoint}:`, error);
      throw error;
    }
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
    
    // Different cache durations for different types of data
    let maxAge = 3600000; // 1 hour default
    
    if (key.includes('/dashboard')) maxAge = 300000; // 5 minutes for dashboard
    else if (key.includes('/transactions')) maxAge = 1800000; // 30 minutes for transactions
    else if (key.includes('/suppliers')) maxAge = 7200000; // 2 hours for suppliers
    else if (key.includes('/inventory')) maxAge = 1800000; // 30 minutes for inventory
    else if (key.includes('/reports')) maxAge = 3600000; // 1 hour for reports
    
    // Check if cache is still valid
    if (Date.now() - cached.timestamp > maxAge) {
      this.cache.delete(key);
      return null;
    }
    return cached.data as T;
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
    const url = `${this.backend.url}${action.endpoint}`;
    const token = localStorage.getItem("callmemobiles_token");
    const response = await fetch(url, {
      method: action.method,
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "Accept": "application/json",
        "Cache-Control": "no-cache",
        ...(token && { "Authorization": `Bearer ${token}` }),
      },
      mode: 'cors',
      credentials: 'omit',
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
    if (endpoint.includes('/dashboard')) return {
      todayRevenue: 0,
      todayProfit: 0,
      totalRevenue: 0,
      totalProfit: 0,
      pendingRepairs: 0,
      completedRepairs: 0,
      totalCustomers: 0,
      lowStockItems: 0,
      pendingBills: 0,
      recentTransactions: []
    } as T;
    if (endpoint.includes('/reports')) return [] as T;
    if (endpoint.includes('/statistics')) return {} as T;
    return {} as T;
  }

  private getOptimisticResponse<T>(endpoint: string, action: OfflineAction): T {
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

  // Public API methods (same as before, just use this.request everywhere)
  getConnectionStatus() {
    return {
      online: this.isOnline,
      backend: this.backend.name,
      offlineQueueLength: this.offlineQueue.length,
      cacheSize: this.cache.size
    };
  }

  async getSystemStatus() {
    try {
      return await this.makeOnlineRequest('/health', {});
    } catch (error) {
      return { status: 'offline', error: (error as Error).message };
    }
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
    const response = await this.request('/api/transactions');
    // Transform backend response to match frontend interface
    return response.map((transaction: any) => ({
      id: transaction.id?.toString() || '',
      date: new Date(transaction.createdAt || transaction.created_at || Date.now()),
      customer: transaction.customerName || transaction.customer_name || '',
      phone: transaction.mobileNumber || transaction.mobile_number || '',
      device: transaction.deviceModel || transaction.device_model || '',
      repairType: transaction.repairType || transaction.repair_type || '',
      cost: transaction.repairCost || transaction.repair_cost || 0,
      profit: transaction.profit || 0,
      status: transaction.status?.toLowerCase() || 'pending',
      paymentMethod: transaction.paymentMethod || transaction.payment_method || 'cash',
      freeGlass: transaction.freeGlass || transaction.free_glass_installation || false
    }));
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

export const apiClient = new RobustApiClient();
export default apiClient;

// Add version check function
export async function checkBackendVersion(currentVersion: string, onUpdate: () => void) {
  try {
    // Only check version if user is authenticated and token is available
    const token = localStorage.getItem("callmemobiles_token");
    if (!token) {
      console.log('⏭️ Skipping version check - no authentication token');
      return;
    }
    
    // Add additional delay to ensure authentication is fully established
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Double-check token is still available after delay
    const currentToken = localStorage.getItem("callmemobiles_token");
    if (!currentToken) {
      console.log('⏭️ Skipping version check - token removed during delay');
      return;
    }
    
    console.log('🔍 Checking backend version...');
    // Use the API client's backend URL instead of hardcoded localhost
    const response = await apiClient.request('/api/version');
    console.log('✅ Version check response:', response);
    
    if (response?.version && response.version !== currentVersion) {
      console.log('🔄 New version available:', response.version);
      onUpdate();
    }
  } catch (error) {
    console.log('⚠️ Version check failed (this is normal if backend is not ready):', error.message);
    // Don't throw error to prevent console errors
  }
}