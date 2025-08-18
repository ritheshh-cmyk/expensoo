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
  private backend: BackendConfig;

  constructor() {
    // Initialize backend URL from environment
    const backendUrl = this.getBackendUrl();
    this.backend = {
      url: backendUrl,
      name: 'Digital Ocean Backend',
      priority: 1,
      timeout: 30000
    };
    console.log('🌐 API Client initialized with backend URL:', backendUrl);
    console.log('🔧 Environment variables:', {
      VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
      NODE_ENV: import.meta.env.NODE_ENV,
      MODE: import.meta.env.MODE
    });
  }

  private getBackendUrl(): string {
    const prodUrl = import.meta.env.VITE_PRODUCTION_BACKEND_URL;
    const devUrl = import.meta.env.VITE_BACKEND_URL;
    const mode = import.meta.env.MODE;
    const digitalOceanUrl = 'https://expensoo-app-gu3wg.ondigitalocean.app';
    
    console.log('🔧 API Client Environment:', {
      MODE: mode,
      VITE_BACKEND_URL: devUrl,
      VITE_PRODUCTION_BACKEND_URL: prodUrl,
      DIGITAL_OCEAN_URL: digitalOceanUrl,
      WINDOW_LOCATION: window.location.origin
    });
    
    // Always prioritize environment variables if they exist
    if (devUrl && devUrl !== 'http://localhost:10000') {
      console.log('🌐 Using VITE_BACKEND_URL from environment:', devUrl);
      return devUrl;
    }
    
    if (prodUrl) {
      console.log('🌐 Using VITE_PRODUCTION_BACKEND_URL from environment:', prodUrl);
      return prodUrl;
    }
    
    // Check if we're running on Vercel production
    const isVercelProduction = window.location.origin.includes('vercel.app');
    
    // Use environment variables for production deployment
    if (mode === 'production' || isVercelProduction) {
      // Use Digital Ocean backend URL for Vercel deployments
      if (isVercelProduction) {
        console.log('🌐 Using Digital Ocean backend URL for Vercel deployment:', digitalOceanUrl);
        return digitalOceanUrl;
      }
      
      const url = prodUrl || digitalOceanUrl;
      console.log('🌐 Using production backend URL:', url);
      return url;
    }
    
    // For development, use Digital Ocean if no localhost backend is running
    const url = devUrl || digitalOceanUrl;
    console.log('🌐 Using development backend URL:', url);
    return url;
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

    // For dashboard and transactions, use optimistic loading with fallback
    if (endpoint.includes('/dashboard') || endpoint.includes('/transactions')) {
      const fallbackData = this.getEmptyResponse<T>(endpoint);
      if (this.isOnline) {
        try {
          const result = await this.makeOnlineRequest<T>(endpoint, options);
          this.cacheResponse(cacheKey, result);
          return result;
        } catch (error) {
          console.warn('Online request failed, using fallback:', error);
          return fallbackData;
        }
      } else {
        return fallbackData;
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

    // Create a new headers object to avoid modifying the original options.headers
    const headers = new Headers(options.headers);
    
    // Set essential headers for proper CORS and API handling
    headers.set("Content-Type", "application/json");
    headers.set("ngrok-skip-browser-warning", "true");
    headers.set("Accept", "application/json");
    headers.set("Cache-Control", "no-cache");
    headers.set("Origin", window.location.origin);
    
    // Add authorization if token exists
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    
    const config: RequestInit = {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'include', // Changed from 'omit' to 'include' to support cookies if needed
      signal: options.signal || AbortSignal.timeout(this.backend.timeout),
    };

    console.log(`🌐 Making request to: ${url}`);
    console.log(`🔑 Token present: ${token ? 'Yes' : 'No'}`);
    console.log(`⚙️ Request config:`, {
      method: config.method,
      headers: Object.fromEntries(headers.entries()),
      mode: config.mode,
      credentials: config.credentials
    });
    
    try {
      const response = await fetch(url, config);
      
      console.log(`📡 Response status: ${response.status} ${response.statusText}`);
      console.log(`📡 Response headers:`, Object.fromEntries([...response.headers.entries()]));
      
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
      
      // Enhanced error logging for network issues
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('💥 Network error details:', {
          url,
          online: navigator.onLine,
          backend: this.backend.url,
          error: error.message,
          stack: error.stack
        });
      }
      
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
    
    // Enhanced request configuration with improved CORS handling
    const config: RequestInit = {
      method: action.method,
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "Accept": "application/json",
        "Cache-Control": "no-cache",
        "Origin": window.location.origin,
        ...(token && { "Authorization": `Bearer ${token}` }),
      },
      mode: 'cors',
      credentials: 'include', // Changed from 'omit' to 'include' to support cookies if needed
      body: action.data ? JSON.stringify(action.data) : undefined,
      signal: AbortSignal.timeout(10000)
    };
    
    console.log(`🔄 Processing offline action to: ${url}`, action);
    console.log('⚙️ Request options:', config);
    
    try {
      const response = await fetch(url, config);
      
      console.log(`📡 Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        let errorMessage = `Sync failed: HTTP ${response.status}: ${response.statusText}`;
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
      
      console.log('✅ Synced offline action:', action);
      return response;
    } catch (error) {
      console.error(`❌ Offline action processing failed:`, error);
      throw error;
    }
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

  // Token refresh method for Supabase Auth
  async refreshToken(): Promise<string | null> {
    try {
      console.log('🔄 Refreshing access token...');
      
      // Use Supabase auth service if available
      const { supabaseAuthService } = await import('../services/supabaseAuthService');
      
      if (supabaseAuthService.getCurrentSession()) {
        await supabaseAuthService.refreshSession();
        const newToken = supabaseAuthService.getAccessToken();
        
        if (newToken) {
          localStorage.setItem("callmemobiles_token", newToken);
          console.log('✅ Token refreshed successfully');
          return newToken;
        }
      }
      
      console.warn('⚠️ No valid session to refresh');
      return null;
      
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      
      // If refresh fails, clear invalid tokens and redirect to login
      localStorage.removeItem("callmemobiles_token");
      localStorage.removeItem("callmemobiles_user");
      
      // Notify app about auth failure
      window.dispatchEvent(new CustomEvent('auth:token-expired'));
      
      return null;
    }
  }

  // Enhanced request method with automatic token refresh
  async requestWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      return await this.request<T>(endpoint, options);
    } catch (error) {
      // Check if it's an auth error (401/403)
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
        console.log('🔄 Auth error detected, attempting token refresh...');
        
        const newToken = await this.refreshToken();
        if (newToken) {
          // Retry the request with new token
          return await this.request<T>(endpoint, options);
        }
        
        // If refresh failed, throw auth error
        throw new Error('Authentication expired. Please log in again.');
      }
      
      throw error;
    }
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
    // Force refresh backend URL to ensure we have the latest environment variables
    this.backend.url = this.getBackendUrl();
    
    console.log('🔐 API: Attempting login for:', username);
    console.log('🌐 API: Using backend URL:', this.backend.url);
    console.log('🌐 API: Full login URL:', `${this.backend.url}/api/auth/login`);
    
    // Login should wait for actual response, not use optimistic updates
    const url = `${this.backend.url}/api/auth/login`;
    console.log('📍 API: Full URL:', url);
    
    // Try both fetch and XHR approaches for maximum compatibility
    try {
      // First attempt: Use fetch with enhanced CORS configuration
      console.log('🔄 API: Attempting login with fetch API');
      
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      headers.set('ngrok-skip-browser-warning', 'true');
      headers.set('Accept', 'application/json');
      headers.set('Cache-Control', 'no-cache');
      headers.set('Origin', window.location.origin);
      
      const config: RequestInit = {
        method: 'POST',
        headers,
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify({ username, password }),
        signal: AbortSignal.timeout(15000) // 15 second timeout
      };
      
      console.log('⚙️ API: Request options:', {
        method: config.method,
        headers: Object.fromEntries(headers.entries()),
        mode: config.mode,
        credentials: config.credentials
      });

      console.log(`🌐 Making login request to: ${url}`);
      
      try {
        const response = await fetch(url, config);
        
        console.log(`📡 Login response status: ${response.status} ${response.statusText}`);
        console.log('📡 API: Login response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.text();
            console.error(`❌ Login error response body:`, errorData);
            if (errorData) {
              errorMessage += ` - ${errorData}`;
            }
          } catch (e) {
            console.error(`❌ Could not read login error response:`, e);
          }
          throw new Error(errorMessage);
        }

        const responseText = await response.text();
        console.log('📄 API: Raw response text:', responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('📦 API: Parsed JSON data:', data);
          
          // Store token in localStorage if present in response
          if (data && data.token) {
            console.log('🔑 API: Storing token in localStorage');
            localStorage.setItem("callmemobiles_token", data.token);
            
            // Store user data if present
            if (data.user) {
              console.log('👤 API: Storing user data in localStorage');
              localStorage.setItem("callmemobiles_user", JSON.stringify(data.user));
            }
          } else {
            console.warn('⚠️ API: No token found in login response');
          }
          
          return data;
        } catch (parseError) {
          console.error('❌ API: JSON parse error:', parseError);
          console.error('❌ API: Failed to parse response:', responseText);
          throw new Error('Invalid JSON response from server');
        }
      } catch (fetchError) {
        // If fetch fails, try XMLHttpRequest as fallback
        console.warn('⚠️ API: Fetch login attempt failed, trying XMLHttpRequest fallback:', fetchError);
        
        // Second attempt: Use XMLHttpRequest as fallback
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', url, true);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.setRequestHeader('Cache-Control', 'no-cache');
          xhr.setRequestHeader('Origin', window.location.origin);
          xhr.withCredentials = true;
          xhr.timeout = 15000; // 15 second timeout
          
          xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
              console.log('📡 XHR Login response status:', xhr.status);
              console.log('📡 XHR Login response headers:', xhr.getAllResponseHeaders());
              console.log('📄 XHR Raw response text:', xhr.responseText);
              
              try {
                const data = JSON.parse(xhr.responseText);
                console.log('📦 XHR Parsed JSON data:', data);
                
                // Store token in localStorage if present in response
                if (data && data.token) {
                  console.log('🔑 XHR: Storing token in localStorage');
                  localStorage.setItem("callmemobiles_token", data.token);
                  
                  // Store user data if present
                  if (data.user) {
                    console.log('👤 XHR: Storing user data in localStorage');
                    localStorage.setItem("callmemobiles_user", JSON.stringify(data.user));
                  }
                } else {
                  console.warn('⚠️ XHR: No token found in login response');
                }
                
                resolve(data);
              } catch (parseError) {
                console.error('❌ XHR JSON parse error:', parseError);
                reject(new Error('Invalid JSON response from server'));
              }
            } else {
              console.error(`❌ XHR Login failed with status: ${xhr.status}`);
              reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
            }
          };
          
          xhr.onerror = function() {
            console.error('❌ XHR Network error occurred');
            reject(new Error('Network error occurred'));
          };
          
          xhr.ontimeout = function() {
            console.error('❌ XHR Request timed out');
            reject(new Error('Request timed out'));
          };
          
          xhr.send(JSON.stringify({ username, password }));
        });
      }
    } catch (error) {
      console.error(`❌ Login request failed:`, error);
      
      // Enhanced error logging for network issues
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('💥 Network error details:', {
          url,
          online: navigator.onLine,
          backend: this.backend.url,
          error: error.message,
          stack: error.stack
        });
      }
      
      throw error;
    }
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
    if (Array.isArray(response)) {
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
        freeGlass: transaction.freeGlass || transaction.free_glass_installation || false,
        amountGiven: transaction.amountGiven || transaction.amount_given || 0,
        changeReturned: transaction.changeReturned || transaction.change_returned || 0,
        remarks: transaction.remarks || ''
      }));
    }
    return [];
  }

  async createTransaction(data: any) {
    console.log('🔄 Creating transaction with data:', data);
    const result = await this.request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    // Invalidate related caches immediately
    this.invalidateRelatedCaches('/api/transactions');
    this.invalidateRelatedCaches('/api/dashboard');
    
    console.log('✅ Transaction created successfully:', result);
    return result;
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
    // Use working dashboard/stats endpoint instead of broken /api/dashboard
    return this.request('/api/dashboard/stats');
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
  async getTodayStatistics() {
    // Use dashboard/stats for today stats
    const response = await this.request('/api/dashboard/stats') as any;
    return response?.today || {};
  }

  async getWeekStatistics() {
    // Use dashboard/stats for week stats  
    const response = await this.request('/api/dashboard/stats') as any;
    return response?.week || {};
  }

  async getMonthStatistics() {
    // Use dashboard/totals for month stats
    return this.request('/api/dashboard/totals');
  }

  async getYearStatistics() {
    // Use dashboard/totals for year stats
    return this.request('/api/dashboard/totals');
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
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:10000";
    const response = await fetch(`${backendUrl}/api/version`);
    if (!response.ok) return;
    const { version } = await response.json();
    if (version && version !== currentVersion) {
      onUpdate();
    }
  } catch (e) {
    // Ignore errors (offline, etc.)
  }
}