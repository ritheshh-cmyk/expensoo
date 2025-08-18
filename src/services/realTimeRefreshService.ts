// ENHANCED REAL-TIME DATA REFRESH SERVICE
// Ensures all components always fetch the latest data from the backend

interface RefreshableComponent {
  id: string;
  refreshData: () => Promise<void>;
  lastRefresh: number;
  refreshInterval?: number;
}

class RealTimeDataRefreshService {
  private components: Map<string, RefreshableComponent> = new Map();
  private globalRefreshInterval: number = 30000; // 30 seconds
  private intervalId: NodeJS.Timeout | null = null;
  private isRefreshing: boolean = false;
  
  constructor() {
    this.startGlobalRefresh();
    this.setupVisibilityListener();
  }

  // Register a component for automatic refresh
  registerComponent(
    id: string, 
    refreshData: () => Promise<void>, 
    refreshInterval?: number
  ) {
    this.components.set(id, {
      id,
      refreshData,
      lastRefresh: Date.now(),
      refreshInterval: refreshInterval || this.globalRefreshInterval
    });
    
    console.log(`📝 Registered component for real-time refresh: ${id}`);
  }

  // Unregister component
  unregisterComponent(id: string) {
    this.components.delete(id);
    console.log(`🗑️ Unregistered component: ${id}`);
  }

  // Force refresh all components
  async refreshAllComponents() {
    if (this.isRefreshing) return;
    
    this.isRefreshing = true;
    console.log('🔄 Force refreshing all components...');
    
    const promises = Array.from(this.components.values()).map(async (component) => {
      try {
        await component.refreshData();
        component.lastRefresh = Date.now();
        console.log(`✅ Refreshed component: ${component.id}`);
      } catch (error) {
        console.error(`❌ Failed to refresh component ${component.id}:`, error);
      }
    });
    
    await Promise.allSettled(promises);
    this.isRefreshing = false;
    console.log('✅ All components refresh completed');
  }

  // Refresh specific component
  async refreshComponent(id: string) {
    const component = this.components.get(id);
    if (component) {
      try {
        await component.refreshData();
        component.lastRefresh = Date.now();
        console.log(`✅ Refreshed specific component: ${id}`);
      } catch (error) {
        console.error(`❌ Failed to refresh component ${id}:`, error);
      }
    }
  }

  // Start global refresh timer
  private startGlobalRefresh() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.intervalId = setInterval(() => {
      this.refreshComponentsIfNeeded();
    }, 10000); // Check every 10 seconds
    
    console.log('⏰ Global refresh timer started');
  }

  // Refresh components that need updating
  private async refreshComponentsIfNeeded() {
    const now = Date.now();
    const promises: Promise<void>[] = [];
    
    this.components.forEach((component) => {
      const timeSinceLastRefresh = now - component.lastRefresh;
      const refreshInterval = component.refreshInterval || this.globalRefreshInterval;
      
      if (timeSinceLastRefresh >= refreshInterval) {
        promises.push(this.refreshComponent(component.id));
      }
    });
    
    if (promises.length > 0) {
      console.log(`🔄 Auto-refreshing ${promises.length} components...`);
      await Promise.allSettled(promises);
    }
  }

  // Setup visibility change listener to refresh when user returns
  private setupVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('👀 Tab became visible, refreshing data...');
        this.refreshAllComponents();
      }
    });
  }

  // Trigger refresh on data mutation
  onDataMutation(entityType: 'transactions' | 'suppliers' | 'expenditures' | 'all') {
    console.log(`🔄 Data mutation detected for: ${entityType}`);
    
    // Refresh related components immediately
    const relatedComponents = this.getRelatedComponents(entityType);
    relatedComponents.forEach(id => {
      this.refreshComponent(id);
    });
  }

  private getRelatedComponents(entityType: string): string[] {
    const componentMap = {
      'transactions': ['dashboard', 'transactions', 'reports', 'statistics'],
      'suppliers': ['suppliers', 'dashboard'],
      'expenditures': ['expenditures', 'dashboard', 'reports'],
      'all': Array.from(this.components.keys())
    };
    
    return componentMap[entityType] || [];
  }

  // Stop refresh service
  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.components.clear();
    console.log('🛑 Real-time refresh service stopped');
  }
}

// Export singleton instance
export const realTimeRefreshService = new RealTimeDataRefreshService();

// React Hook for easy component integration
import { useEffect, useRef } from 'react';

export function useRealTimeRefresh(
  componentId: string,
  refreshData: () => Promise<void>,
  refreshInterval?: number
) {
  const refreshDataRef = useRef(refreshData);
  
  // Update ref when refreshData changes
  useEffect(() => {
    refreshDataRef.current = refreshData;
  }, [refreshData]);
  
  useEffect(() => {
    const wrappedRefreshData = () => refreshDataRef.current();
    
    // Register component on mount
    realTimeRefreshService.registerComponent(
      componentId, 
      wrappedRefreshData, 
      refreshInterval
    );
    
    // Initial data load
    wrappedRefreshData();
    
    // Unregister on unmount
    return () => {
      realTimeRefreshService.unregisterComponent(componentId);
    };
  }, [componentId, refreshInterval]);
  
  // Return manual refresh function
  return () => realTimeRefreshService.refreshComponent(componentId);
}
