// Expenditures API Mock Data and Backend Integration Fix
// This file provides mock data for expenditures when backend is unavailable

export interface Expenditure {
  id: string;
  date: string;
  description: string;
  category: string;
  supplier: string;
  paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'check';
  amount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Mock expenditure data for fallback
export const mockExpenditures: Expenditure[] = [
  {
    id: '1',
    date: '2024-01-15',
    description: 'Phone repair parts - LCD screens',
    category: 'Supplies',
    supplier: 'TechParts Ltd',
    paymentMethod: 'card',
    amount: 15000,
    notes: 'Bulk purchase for iPhone screens',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    date: '2024-01-12',
    description: 'Monthly shop rent',
    category: 'Rent',
    supplier: 'Property Manager',
    paymentMethod: 'bank_transfer',
    amount: 25000,
    notes: 'January 2024 rent payment',
    createdAt: '2024-01-12T09:00:00Z',
    updatedAt: '2024-01-12T09:00:00Z'
  },
  {
    id: '3',
    date: '2024-01-10',
    description: 'Electricity bill',
    category: 'Utilities',
    supplier: 'State Electricity Board',
    paymentMethod: 'upi',
    amount: 3500,
    notes: 'December 2023 electricity bill',
    createdAt: '2024-01-10T14:30:00Z',
    updatedAt: '2024-01-10T14:30:00Z'
  },
  {
    id: '4',
    date: '2024-01-08',
    description: 'Staff salaries',
    category: 'Salaries',
    supplier: 'Employees',
    paymentMethod: 'bank_transfer',
    amount: 45000,
    notes: 'January 2024 salary payments',
    createdAt: '2024-01-08T16:00:00Z',
    updatedAt: '2024-01-08T16:00:00Z'
  },
  {
    id: '5',
    date: '2024-01-05',
    description: 'New soldering equipment',
    category: 'Equipment',
    supplier: 'Tools & Electronics',
    paymentMethod: 'cash',
    amount: 12000,
    notes: 'Upgraded soldering station for repairs',
    createdAt: '2024-01-05T11:20:00Z',
    updatedAt: '2024-01-05T11:20:00Z'
  },
  {
    id: '6',
    date: '2024-01-03',
    description: 'Social media advertising',
    category: 'Marketing',
    supplier: 'Facebook Ads',
    paymentMethod: 'card',
    amount: 5000,
    notes: 'Instagram and Facebook promotion',
    createdAt: '2024-01-03T13:45:00Z',
    updatedAt: '2024-01-03T13:45:00Z'
  },
  {
    id: '7',
    date: '2024-01-01',
    description: 'AC servicing and repair',
    category: 'Maintenance',
    supplier: 'Cool Air Services',
    paymentMethod: 'cash',
    amount: 2500,
    notes: 'Shop AC maintenance',
    createdAt: '2024-01-01T10:15:00Z',
    updatedAt: '2024-01-01T10:15:00Z'
  }
];

// Enhanced API client with error handling and fallbacks
export class ExpendituresService {
  private baseURL = 'https://expensoo-app-gu3wg.ondigitalocean.app';
  private fallbackData = mockExpenditures;

  async getExpenditures(): Promise<Expenditure[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/expenditures`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('Backend unavailable, using mock data');
        return this.fallbackData;
      }

      const data = await response.json();
      
      // Transform snake_case to camelCase if needed
      if (data.success && Array.isArray(data.data)) {
        return data.data.map(this.transformExpenditure);
      } else if (Array.isArray(data)) {
        return data.map(this.transformExpenditure);
      }
      
      return this.fallbackData;
    } catch (error) {
      console.warn('Failed to fetch expenditures, using mock data:', error);
      return this.fallbackData;
    }
  }

  async createExpenditure(expenditure: Omit<Expenditure, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expenditure> {
    try {
      const response = await fetch(`${this.baseURL}/api/expenditures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenditure),
      });

      if (!response.ok) {
        throw new Error('Failed to create expenditure');
      }

      const data = await response.json();
      return this.transformExpenditure(data.success ? data.data : data);
    } catch (error) {
      console.error('Failed to create expenditure:', error);
      
      // Create mock expenditure for offline functionality
      const mockExpenditure: Expenditure = {
        ...expenditure,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Add to local mock data
      this.fallbackData.unshift(mockExpenditure);
      return mockExpenditure;
    }
  }

  async updateExpenditure(id: string, updates: Partial<Expenditure>): Promise<Expenditure> {
    try {
      const response = await fetch(`${this.baseURL}/api/expenditures/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update expenditure');
      }

      const data = await response.json();
      return this.transformExpenditure(data.success ? data.data : data);
    } catch (error) {
      console.error('Failed to update expenditure:', error);
      
      // Update mock data
      const index = this.fallbackData.findIndex(exp => exp.id === id);
      if (index !== -1) {
        this.fallbackData[index] = {
          ...this.fallbackData[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        return this.fallbackData[index];
      }
      
      throw error;
    }
  }

  async deleteExpenditure(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/expenditures/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete expenditure');
      }

      return true;
    } catch (error) {
      console.error('Failed to delete expenditure:', error);
      
      // Remove from mock data
      const index = this.fallbackData.findIndex(exp => exp.id === id);
      if (index !== -1) {
        this.fallbackData.splice(index, 1);
        return true;
      }
      
      throw error;
    }
  }

  // Transform backend data to match frontend interface
  private transformExpenditure(data: any): Expenditure {
    return {
      id: data.id || data.expenditure_id,
      date: data.date || data.expenditure_date || data.created_at?.split('T')[0],
      description: data.description || data.expenditure_description || '',
      category: data.category || data.expenditure_category || 'Supplies',
      supplier: data.supplier || data.vendor || data.supplier_name || '',
      paymentMethod: data.paymentMethod || data.payment_method || 'cash',
      amount: Number(data.amount || data.expenditure_amount || 0),
      notes: data.notes || data.expenditure_notes || '',
      createdAt: data.createdAt || data.created_at || new Date().toISOString(),
      updatedAt: data.updatedAt || data.updated_at || new Date().toISOString(),
    };
  }

  // Get monthly data for charts
  getMonthlyData(): { month: string; expenses: number; revenue: number; profit: number }[] {
    const monthlyMap = new Map();
    
    this.fallbackData.forEach(exp => {
      const month = exp.date.slice(0, 7); // YYYY-MM
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { expenses: 0, revenue: 0, profit: 0 });
      }
      const current = monthlyMap.get(month);
      current.expenses += exp.amount;
    });

    // Mock revenue data (would come from transactions in real app)
    const revenueData = {
      '2024-01': 125000,
      '2023-12': 98000,
      '2023-11': 87000,
    };

    return Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month: this.formatMonth(month),
      expenses: data.expenses,
      revenue: revenueData[month] || 75000,
      profit: (revenueData[month] || 75000) - data.expenses,
    }));
  }

  // Get category breakdown
  getCategoryBreakdown(): { name: string; amount: number; color: string }[] {
    const categoryMap = new Map();
    
    this.fallbackData.forEach(exp => {
      if (!categoryMap.has(exp.category)) {
        categoryMap.set(exp.category, 0);
      }
      categoryMap.set(exp.category, categoryMap.get(exp.category) + exp.amount);
    });

    const colors = {
      'Supplies': '#3B82F6',
      'Rent': '#EF4444',
      'Utilities': '#F59E0B',
      'Salaries': '#10B981',
      'Equipment': '#8B5CF6',
      'Marketing': '#EC4899',
      'Maintenance': '#F97316',
    };

    return Array.from(categoryMap.entries()).map(([name, amount]) => ({
      name,
      amount,
      color: colors[name] || '#6B7280',
    }));
  }

  private formatMonth(monthStr: string): string {
    const [year, month] = monthStr.split('-');
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }
}

// Export singleton instance
export const expendituresService = new ExpendituresService();
