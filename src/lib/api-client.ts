
import { toast } from "@/components/ui/use-toast";

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface ApiError {
  message: string;
  status: number;
  errors?: string[];
}

class ProfessionalApiClient {
  private baseURL: string;
  private headers: HeadersInit;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  // Set authentication token
  setAuthToken(token: string | null) {
    if (token) {
      this.headers = {
        ...this.headers,
        'Authorization': `Bearer ${token}`
      };
    } else {
      const { Authorization, ...rest } = this.headers as any;
      this.headers = rest;
    }
  }

  // Enhanced error handling
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = 'An error occurred';
      let errors: string[] = [];

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        errors = errorData.errors || [];
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }

      const apiError: ApiError = {
        message: errorMessage,
        status: response.status,
        errors
      };

      // Show toast notification for errors
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });

      throw apiError;
    }

    try {
      return await response.json();
    } catch {
      // If response is not JSON, return empty object
      return {} as T;
    }
  }

  // Retry logic for failed requests
  private async retryRequest<T>(
    requestFn: () => Promise<Response>,
    attempt: number = 1
  ): Promise<T> {
    try {
      const response = await requestFn();
      return this.handleResponse<T>(response);
    } catch (error) {
      if (attempt < this.retryAttempts && this.shouldRetry(error as ApiError)) {
        await this.delay(this.retryDelay * attempt);
        return this.retryRequest<T>(requestFn, attempt + 1);
      }
      throw error;
    }
  }

  // Determine if request should be retried
  private shouldRetry(error: ApiError): boolean {
    // Retry on network errors or 5xx server errors
    return error.status >= 500 || error.status === 0;
  }

  // Delay utility for retries
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const requestFn = () => fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    });

    return this.retryRequest<T>(requestFn);
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }

  // POST request
  async post<T, U = any>(endpoint: string, data?: U): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T, U = any>(endpoint: string, data?: U): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PATCH request
  async patch<T, U = any>(endpoint: string, data?: U): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // File upload
  async uploadFile<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    const { 'Content-Type': contentType, ...headersWithoutContentType } = this.headers as any;
    
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: headersWithoutContentType, // Let browser set Content-Type for FormData
    });
  }

  // Batch requests
  async batch<T>(requests: Array<() => Promise<any>>): Promise<T[]> {
    try {
      const results = await Promise.allSettled(requests.map(request => request()));
      
      return results.map(result => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error('Batch request failed:', result.reason);
          return null;
        }
      });
    } catch (error) {
      console.error('Batch request error:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      return await this.get<{ status: string; timestamp: string }>('/health');
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Create singleton instance
export const apiClient = new ProfessionalApiClient();

// Specific API services
export class TransactionService {
  static async getTransactions(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<ApiResponse<any[]>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return apiClient.get<ApiResponse<any[]>>(`/transactions?${searchParams}`);
  }

  static async createTransaction(data: any): Promise<ApiResponse<any>> {
    return apiClient.post<ApiResponse<any>>('/transactions', data);
  }

  static async updateTransaction(id: string, data: any): Promise<ApiResponse<any>> {
    return apiClient.put<ApiResponse<any>>(`/transactions/${id}`, data);
  }

  static async deleteTransaction(id: string): Promise<ApiResponse<any>> {
    return apiClient.delete<ApiResponse<any>>(`/transactions/${id}`);
  }

  static async getTransaction(id: string): Promise<ApiResponse<any>> {
    return apiClient.get<ApiResponse<any>>(`/transactions/${id}`);
  }
}

export class RepairService {
  static async getRepairs(params?: {
    page?: number;
    limit?: number;
    status?: string;
    customer?: string;
  }): Promise<ApiResponse<any[]>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return apiClient.get<ApiResponse<any[]>>(`/repairs?${searchParams}`);
  }

  static async createRepair(data: any): Promise<ApiResponse<any>> {
    return apiClient.post<ApiResponse<any>>('/repairs', data);
  }

  static async updateRepair(id: string, data: any): Promise<ApiResponse<any>> {
    return apiClient.put<ApiResponse<any>>(`/repairs/${id}`, data);
  }

  static async updateRepairStatus(id: string, status: string): Promise<ApiResponse<any>> {
    return apiClient.patch<ApiResponse<any>>(`/repairs/${id}/status`, { status });
  }
}

export class CustomerService {
  static async getCustomers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<any[]>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return apiClient.get<ApiResponse<any[]>>(`/customers?${searchParams}`);
  }

  static async createCustomer(data: any): Promise<ApiResponse<any>> {
    return apiClient.post<ApiResponse<any>>('/customers', data);
  }

  static async updateCustomer(id: string, data: any): Promise<ApiResponse<any>> {
    return apiClient.put<ApiResponse<any>>(`/customers/${id}`, data);
  }
}

export class InventoryService {
  static async getInventory(params?: {
    page?: number;
    limit?: number;
    category?: string;
    lowStock?: boolean;
  }): Promise<ApiResponse<any[]>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return apiClient.get<ApiResponse<any[]>>(`/inventory?${searchParams}`);
  }

  static async updateStock(id: string, quantity: number): Promise<ApiResponse<any>> {
    return apiClient.patch<ApiResponse<any>>(`/inventory/${id}/stock`, { quantity });
  }
}

export class AnalyticsService {
  static async getDashboardMetrics(): Promise<ApiResponse<any>> {
    return apiClient.get<ApiResponse<any>>('/analytics/dashboard');
  }

  static async getRevenueReport(params: {
    startDate: string;
    endDate: string;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<ApiResponse<any>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    
    return apiClient.get<ApiResponse<any>>(`/analytics/revenue?${searchParams}`);
  }
}

// Export default client
export default apiClient;
