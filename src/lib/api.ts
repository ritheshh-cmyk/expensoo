
// 🔗 PRODUCTION API CLIENT WITH ADVANCED ERROR HANDLING AND RETRY LOGIC
import { toast } from '../components/ui/use-toast';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
  message?: string;
}

interface ApiConfig {
  baseUrl: string;
  retryConfig: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
  };
  debug: boolean;
}

class ApiClient {
  private config: ApiConfig;
  private token: string | null;

  constructor() {
    const envBaseUrl = import.meta.env.VITE_BACKEND_URL;
    const prodUrl = 'https://expensoo-app-gu3wg.ondigitalocean.app';
    const baseUrl = envBaseUrl || (import.meta.env.PROD ? prodUrl : 'http://localhost:10000');

    this.config = {
      baseUrl,
      retryConfig: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000
      },
      debug: import.meta.env.DEV || false
    };

    this.token = null;
    if (this.config.debug) {
      console.log('🌐 API Client initialized:', {
        baseUrl: this.config.baseUrl,
        mode: import.meta.env.MODE,
        retryConfig: this.config.retryConfig
      });
    }
  }

  private debug(...args: any[]) {
    if (this.config.debug) {
      console.log(...args);
    }
  }

  private error(...args: any[]) {
    console.error(...args);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getAuthToken(): string | null {
    try {
      return localStorage.getItem('auth_token');
    } catch (error) {
      this.error('Failed to access localStorage:', error);
      return null;
    }
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const token = this.getAuthToken();
    let attempt = 0;
    const { maxRetries, baseDelay, maxDelay } = this.config.retryConfig;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    while (true) {
      try {
        this.debug(`🔌 API Request: ${endpoint} (Attempt ${attempt + 1}/${maxRetries})`, {
          url,
          method: config.method || 'GET'
        });

        const response = await fetch(url, config);
        const data = await response.json().catch(() => null);

        // Handle authentication issues
        if (response.status === 401) {
          this.debug('🔒 Authentication required');
          return {
            success: false,
            error: 'Authentication required',
            status: 401,
            message: data?.message || 'Please log in to continue'
          };
        }

        // Handle successful responses
        if (response.ok) {
          this.debug(`✅ API Response: ${endpoint}`, {
            status: response.status,
            data
          });

          return {
            success: true,
            data,
            status: response.status,
            message: data?.message
          };
        }

        // Handle retryable errors
        if (attempt < maxRetries && (response.status >= 500 || !response.status)) {
          attempt++;
          const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
          this.debug(`🔄 Retrying request (attempt ${attempt}/${maxRetries}). Waiting ${delay}ms...`);
          await this.sleep(delay);
          continue;
        }

        // Handle non-retryable errors
        return {
          success: false,
          error: data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          message: data?.message
        };

      } catch (error: any) {
        // Handle network errors
        if (attempt < maxRetries) {
          attempt++;
          const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
          this.debug(`🔄 Network error, retrying (attempt ${attempt}/${maxRetries}). Waiting ${delay}ms...`);
          await this.sleep(delay);
          continue;
        }

        return {
          success: false,
          error: error.message || 'Network error occurred',
          status: 0,
          message: 'Failed to connect to the server'
        };
      }
    }
  }

  // Authentication methods
  async login(username: string, password: string): Promise<ApiResponse> {
    this.debug('🔐 Attempting login:', username);
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    this.debug('🔍 Login response structure:', {
      success: response.success,
      hasData: !!response.data,
      hasToken: !!(response.data?.token),
      hasUser: !!(response.data?.user),
      dataKeys: response.data ? Object.keys(response.data) : [],
    });

    if (response.success && response.data?.token) {
      this.token = response.data.token;
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('auth_user', JSON.stringify(response.data.user));
      this.debug('✅ Login successful - token and user saved');
      
      return {
        success: true,
        data: {
          token: response.data.token,
          user: response.data.user
        },
        message: response.data.message || 'Login successful'
      };
    } else {
      this.error('❌ Login failed:', response.error);
      return {
        success: false,
        error: response.error || 'Login failed',
        message: response.message
      };
    }
  }

  async register(userData: any): Promise<ApiResponse> {
    this.debug('📝 Attempting registration:', userData.username);
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout(): Promise<void> {
    this.debug('🚪 Logging out...');
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  async verifyToken(): Promise<ApiResponse> {
    this.debug('🔍 Verifying token...');
    try {
      const response = await this.request('/api/auth/verify');
      return response;
    } catch (error) {
      // If verification endpoint doesn't exist, we'll consider it a success
      // This allows the app to work with backends that don't have this endpoint
      this.debug('Token verification endpoint not available, assuming valid token');
      return {
        success: true,
        data: { valid: true },
        message: 'Token verification skipped - endpoint not available'
      };
    }
  }

  // Dashboard
  async getDashboardData(): Promise<ApiResponse> {
    this.debug('📊 Fetching dashboard data...');
    const response = await this.request('/api/dashboard');
    
    if (response.success) {
      // Handle different response structures
      const totals = response.data?.totals || response.data || {};
      
      return {
        success: true,
        data: {
          totalRevenue: totals.totalRevenue || totals.total_revenue || 0,
          todayRevenue: totals.todayRevenue || totals.today_revenue || 0,
          totalProfit: totals.totalProfit || totals.total_profit || 0,
          todayProfit: totals.todayProfit || totals.today_profit || 0,
          totalTransactions: totals.totalTransactions || totals.total_transactions || 0,
          pendingTransactions: totals.pendingTransactions || totals.pending_transactions || 0,
        }
      };
    }
    
    this.error('❌ Dashboard data fetch failed:', response.error);
    return response;
  }

  async getDashboardStats(): Promise<ApiResponse> {
    this.debug('📊 Fetching dashboard stats from /api/dashboard/stats...');
    const response = await this.request('/api/dashboard/stats');
    
    if (response.success) {
      // The /api/dashboard/stats endpoint returns { totals, today, week }
      const totals = response.data?.totals || {};
      const today = response.data?.today || {};
      const week = response.data?.week || {};
      
      return {
        success: true,
        totals: {
          totalRevenue: totals.totalRevenue || 0,
          totalProfit: totals.totalProfit || 0,
          totalTransactions: totals.totalTransactions || 0,
          pendingTransactions: totals.pendingTransactions || 0,
          completedTransactions: totals.completedTransactions || 0,
          avgTransactionValue: totals.avgTransactionValue || 0,
        },
        today: {
          totalRevenue: today.totalRevenue || today.revenue || 0,
          totalProfit: today.totalProfit || today.profit || 0,
          totalTransactions: today.totalTransactions || today.transactions || 0,
        },
        week: {
          totalRevenue: week.totalRevenue || week.revenue || 0,
          totalProfit: week.totalProfit || week.profit || 0,
          totalTransactions: week.totalTransactions || week.transactions || 0,
        },
        userRole: response.data?.userRole,
        fullAccess: response.data?.fullAccess
      };
    }
    
    this.error('❌ Dashboard stats fetch failed:', response.error);
    return response;
  }

  // Transactions
  async getTransactions(): Promise<ApiResponse> {
    this.debug('📋 Fetching transactions...');
    const response = await this.request('/api/transactions');
    
    if (response.success) {
      const transactions = response.data?.transactions || response.data || [];
      return {
        success: true,
        data: Array.isArray(transactions) ? transactions : []
      };
    }
    
    this.error('❌ Transactions fetch failed:', response.error);
    return {
      success: false,
      data: [],
      error: response.error
    };
  }

  async createTransaction(data: any): Promise<ApiResponse> {
    this.debug('➕ Creating transaction:', data);
    try {
      // Always send all required and optional camelCase fields for backend validation
      const validationData = {
        customerName: data.customerName || data.customer_name,
        mobileNumber: data.mobileNumber || data.mobile_number || data.phoneNumber,
        deviceModel: data.deviceModel || data.device_model,
        repairType: data.repairType || data.repair_type,
        repairCost: Number(data.repairCost || data.repair_cost || 0),
        amountGiven: Number(data.amountGiven || data.amount_given || 0),
        changeReturned: Number(data.changeReturned || data.change_returned || Math.max(0, (Number(data.amountGiven || data.amount_given || 0)) - (Number(data.repairCost || data.repair_cost || 0)))),
        paymentMethod: data.paymentMethod || data.payment_method || 'cash',
        status: data.status || 'Completed',
        remarks: data.remarks || '',
        partsCost: data.partsCost || [],
        freeGlass: data.freeGlass || false
      };

      this.debug('📤 Sending validation format (camelCase):', validationData);

      const response = await this.request('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(validationData),
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Transaction created successfully'
        });
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to create transaction',
          variant: 'destructive'
        });
      }

      return response;
    } catch (error: any) {
      this.error('❌ Transaction creation failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create transaction',
        variant: 'destructive'
      });
      throw error;
    }
  }

  async updateTransaction(id: string, data: any): Promise<ApiResponse> {
    return this.request(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTransaction(id: string): Promise<ApiResponse> {
    return this.request(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  // Suppliers
  async getSuppliers(): Promise<ApiResponse> {
    this.debug('🏢 Fetching suppliers...');
    const response = await this.request('/api/suppliers');
    
    if (response.success) {
      const suppliers = response.data?.suppliers || response.data || [];
      return {
        success: true,
        data: Array.isArray(suppliers) ? suppliers : []
      };
    }
    
    return {
      success: false,
      data: [],
      error: response.error
    };
  }

  async createSupplier(data: any): Promise<ApiResponse> {
    this.debug('🏢 Creating supplier:', data);
    return this.request('/api/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getExpenditures(): Promise<ApiResponse> {
    this.debug('💰 Fetching expenditures...');
    const response = await this.request('/api/expenditures');
    
    if (response.success) {
      const expenditures = response.data?.expenditures || response.data || [];
      return {
        success: true,
        data: Array.isArray(expenditures) ? expenditures : []
      };
    }
    
    this.error('❌ Expenditures fetch failed:', response.error);
    return {
      success: false,
      data: [],
      error: response.error
    };
  }

  async createExpenditure(data: any): Promise<ApiResponse> {
    this.debug('💰 Creating expenditure:', data);
    return this.request('/api/expenditures', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Metrics
  async getMetrics(): Promise<ApiResponse> {
    this.debug('📈 Fetching metrics...');
    const response = await this.request('/api/metrics');
    
    if (response.success) {
      return {
        success: true,
        data: {
          revenue: response.data?.revenue || { today: 0, total: 0 },
          transactions: response.data?.transactions || { pending: 0, completed: 0 },
          suppliers: response.data?.suppliers || { total: 0, outstanding: 0 }
        }
      };
    }
    
    return {
      success: false,
      data: null,
      error: response.error
    };
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse> {
    try {
      const response = await this.request('/api/health');
      return {
        success: true,
        data: {
          status: response.data?.status || 'online',
          version: response.data?.version || '1.0.0',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      return {
        success: false,
        data: {
          status: 'offline',
          timestamp: new Date().toISOString()
        },
        error: error.message
      };
    }
  }
}

export const apiClient = new ApiClient();
export default apiClient;
