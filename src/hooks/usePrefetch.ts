import { useCallback } from 'react';
import { apiClient } from '../lib/api';

export function usePrefetch() {
  const prefetch = useCallback(async () => {
    try {
      console.log('🚀 Prefetching initial dataset (dashboard stats, transactions, suppliers) in parallel...');
      await Promise.all([
        apiClient.getDashboardStats(),
        apiClient.getTransactions(),
        apiClient.getSuppliers(),
      ]);
      console.log('✅ Prefetching complete. Data cached locally.');
    } catch (error) {
      console.error('❌ Prefetching failed:', error);
    }
  }, []);

  return prefetch;
}
