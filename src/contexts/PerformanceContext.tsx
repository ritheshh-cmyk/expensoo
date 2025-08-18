import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useDevice } from '@/contexts/DeviceContext';

interface PerformanceMetrics {
  // Core Web Vitals
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  cls: number | null; // Cumulative Layout Shift
  fid: number | null; // First Input Delay
  inp: number | null; // Interaction to Next Paint
  ttfb: number | null; // Time to First Byte

  // Custom Metrics
  loadTime: number | null;
  memoryUsage: number | null;
  jsHeapSize: number | null;
  renderTime: number | null;
  apiResponseTimes: Record<string, number>;
  errorRate: number;
  routeChangeTime: number | null;

  // Performance Score (0-100)
  performanceScore: number;
  
  // Recommendations
  recommendations: string[];
}

interface PerformanceContextType {
  metrics: PerformanceMetrics;
  isOptimizationEnabled: boolean;
  toggleOptimization: () => void;
  recordAPICall: (endpoint: string, duration: number) => void;
  recordRouteChange: (duration: number) => void;
  recordError: () => void;
  getPerformanceReport: () => string;
  shouldOptimizeImages: boolean;
  shouldLazyLoad: boolean;
  shouldPreload: boolean;
  maxConcurrentRequests: number;
}

const PerformanceContext = createContext<PerformanceContextType | null>(null);

// Performance thresholds based on Core Web Vitals
const THRESHOLDS = {
  fcp: { good: 1800, poor: 3000 },
  lcp: { good: 2500, poor: 4000 },
  cls: { good: 0.1, poor: 0.25 },
  fid: { good: 100, poor: 300 },
  inp: { good: 200, poor: 500 },
  ttfb: { good: 800, poor: 1800 },
};

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const { device, shouldOptimizeForPerformance } = useDevice();
  const [isOptimizationEnabled, setIsOptimizationEnabled] = useState(shouldOptimizeForPerformance);
  const [errorCount, setErrorCount] = useState(0);
  const [apiCalls, setApiCalls] = useState<Record<string, number>>({});
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    cls: null,
    fid: null,
    inp: null,
    ttfb: null,
    loadTime: null,
    memoryUsage: null,
    jsHeapSize: null,
    renderTime: null,
    apiResponseTimes: {},
    errorRate: 0,
    routeChangeTime: null,
    performanceScore: 100,
    recommendations: [],
  });

  // Web Vitals measurement
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const measureWebVitals = () => {
      // Measure FCP
      const fcpObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
          }
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      // Measure LCP
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Measure CLS
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        setMetrics(prev => ({ ...prev, cls: clsValue }));
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Measure FID
      const fidObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          setMetrics(prev => ({ ...prev, fid: (entry as any).processingStart - entry.startTime }));
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Measure TTFB
      const navigationEntries = performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
        setMetrics(prev => ({ 
          ...prev, 
          ttfb: navEntry.responseStart - navEntry.requestStart,
          loadTime: navEntry.loadEventEnd - navEntry.fetchStart,
        }));
      }

      return () => {
        fcpObserver.disconnect();
        lcpObserver.disconnect();
        clsObserver.disconnect();
        fidObserver.disconnect();
      };
    };

    const cleanup = measureWebVitals();
    return cleanup;
  }, []);

  // Memory usage monitoring
  useEffect(() => {
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024, // MB
          jsHeapSize: memory.totalJSHeapSize / 1024 / 1024, // MB
        }));
      }
    };

    measureMemory();
    const interval = setInterval(measureMemory, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Calculate performance score
  useEffect(() => {
    const calculateScore = () => {
      let score = 100;
      const recommendations: string[] = [];

      // FCP scoring
      if (metrics.fcp !== null) {
        if (metrics.fcp > THRESHOLDS.fcp.poor) {
          score -= 15;
          recommendations.push('Improve First Contentful Paint by optimizing critical resources');
        } else if (metrics.fcp > THRESHOLDS.fcp.good) {
          score -= 8;
        }
      }

      // LCP scoring
      if (metrics.lcp !== null) {
        if (metrics.lcp > THRESHOLDS.lcp.poor) {
          score -= 20;
          recommendations.push('Optimize Largest Contentful Paint by reducing image sizes and server response time');
        } else if (metrics.lcp > THRESHOLDS.lcp.good) {
          score -= 10;
        }
      }

      // CLS scoring
      if (metrics.cls !== null) {
        if (metrics.cls > THRESHOLDS.cls.poor) {
          score -= 15;
          recommendations.push('Reduce Cumulative Layout Shift by setting image dimensions and avoiding dynamic content insertion');
        } else if (metrics.cls > THRESHOLDS.cls.good) {
          score -= 8;
        }
      }

      // FID scoring
      if (metrics.fid !== null) {
        if (metrics.fid > THRESHOLDS.fid.poor) {
          score -= 10;
          recommendations.push('Improve First Input Delay by reducing JavaScript execution time');
        } else if (metrics.fid > THRESHOLDS.fid.good) {
          score -= 5;
        }
      }

      // Error rate impact
      if (metrics.errorRate > 0.05) { // 5% error rate
        score -= 20;
        recommendations.push('High error rate detected - fix runtime errors to improve user experience');
      } else if (metrics.errorRate > 0.01) { // 1% error rate
        score -= 10;
      }

      // Memory usage impact
      if (metrics.memoryUsage && metrics.memoryUsage > 100) { // 100MB
        score -= 15;
        recommendations.push('High memory usage detected - optimize component rendering and data structures');
      } else if (metrics.memoryUsage && metrics.memoryUsage > 50) { // 50MB
        score -= 8;
      }

      // API response time impact
      const avgApiTime = Object.values(metrics.apiResponseTimes).reduce((a, b) => a + b, 0) / 
                        Math.max(Object.keys(metrics.apiResponseTimes).length, 1);
      if (avgApiTime > 2000) { // 2 seconds
        score -= 15;
        recommendations.push('Slow API responses detected - optimize backend performance or implement caching');
      } else if (avgApiTime > 1000) { // 1 second
        score -= 8;
      }

      // Device-specific adjustments
      if (device.performanceLevel === 'low') {
        recommendations.push('Low-performance device detected - consider enabling performance optimizations');
      }

      if (['2g', 'slow-2g'].includes(device.connectionType)) {
        recommendations.push('Slow network connection detected - optimize for low bandwidth');
      }

      score = Math.max(0, Math.min(100, score));

      setMetrics(prev => ({
        ...prev,
        performanceScore: score,
        recommendations,
        errorRate: errorCount / Math.max(1, Object.keys(apiCalls).length),
      }));
    };

    calculateScore();
  }, [
    metrics.fcp,
    metrics.lcp,
    metrics.cls,
    metrics.fid,
    metrics.memoryUsage,
    metrics.apiResponseTimes,
    errorCount,
    apiCalls,
    device,
  ]);

  const toggleOptimization = useCallback(() => {
    setIsOptimizationEnabled(prev => !prev);
    localStorage.setItem('performanceOptimization', JSON.stringify(!isOptimizationEnabled));
  }, [isOptimizationEnabled]);

  const recordAPICall = useCallback((endpoint: string, duration: number) => {
    setMetrics(prev => ({
      ...prev,
      apiResponseTimes: {
        ...prev.apiResponseTimes,
        [endpoint]: duration,
      },
    }));
    setApiCalls(prev => ({
      ...prev,
      [endpoint]: (prev[endpoint] || 0) + 1,
    }));
  }, []);

  const recordRouteChange = useCallback((duration: number) => {
    setMetrics(prev => ({
      ...prev,
      routeChangeTime: duration,
    }));
  }, []);

  const recordError = useCallback(() => {
    setErrorCount(prev => prev + 1);
  }, []);

  const getPerformanceReport = useCallback(() => {
    const report = {
      timestamp: new Date().toISOString(),
      device: {
        type: device.type,
        performanceLevel: device.performanceLevel,
        connectionType: device.connectionType,
        memory: device.deviceMemory,
      },
      metrics: {
        performanceScore: metrics.performanceScore,
        webVitals: {
          fcp: metrics.fcp,
          lcp: metrics.lcp,
          cls: metrics.cls,
          fid: metrics.fid,
          ttfb: metrics.ttfb,
        },
        customMetrics: {
          loadTime: metrics.loadTime,
          memoryUsage: metrics.memoryUsage,
          errorRate: metrics.errorRate,
          avgApiResponseTime: Object.values(metrics.apiResponseTimes).reduce((a, b) => a + b, 0) / 
                             Math.max(Object.keys(metrics.apiResponseTimes).length, 1),
        },
      },
      recommendations: metrics.recommendations,
      optimizationEnabled: isOptimizationEnabled,
    };

    return JSON.stringify(report, null, 2);
  }, [metrics, device, isOptimizationEnabled]);

  // Performance optimization flags
  const shouldOptimizeImages = isOptimizationEnabled && (
    device.performanceLevel === 'low' || 
    ['2g', 'slow-2g'].includes(device.connectionType) ||
    metrics.performanceScore < 70
  );

  const shouldLazyLoad = isOptimizationEnabled && (
    device.performanceLevel !== 'high' ||
    metrics.memoryUsage && metrics.memoryUsage > 30
  );

  const shouldPreload = isOptimizationEnabled && 
    device.performanceLevel === 'high' && 
    !['2g', 'slow-2g'].includes(device.connectionType);

  const maxConcurrentRequests = device.performanceLevel === 'high' ? 6 : 
                               device.performanceLevel === 'medium' ? 4 : 2;

  const contextValue: PerformanceContextType = {
    metrics,
    isOptimizationEnabled,
    toggleOptimization,
    recordAPICall,
    recordRouteChange,
    recordError,
    getPerformanceReport,
    shouldOptimizeImages,
    shouldLazyLoad,
    shouldPreload,
    maxConcurrentRequests,
  };

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
}

// Hook for measuring component render time
export function useRenderTime(componentName: string) {
  const { recordError } = usePerformance();
  
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const renderTime = performance.now() - startTime;
      if (renderTime > 100) { // Log slow renders
        console.warn(`🐌 Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
      }
    };
  }, [componentName]);
}

// Hook for measuring API calls
export function useAPIPerformance() {
  const { recordAPICall, recordError } = usePerformance();
  
  const measureAPICall = useCallback(
    async (endpoint: string, apiCall: () => Promise<any>): Promise<any> => {
      const startTime = performance.now();
      
      try {
        const result = await apiCall();
        const duration = performance.now() - startTime;
        recordAPICall(endpoint, duration);
        return result;
      } catch (error) {
        recordError();
        const duration = performance.now() - startTime;
        recordAPICall(`${endpoint}_error`, duration);
        throw error;
      }
    },
    [recordAPICall, recordError]
  );
  
  return { measureAPICall };
}

// Performance monitoring component for development
export function PerformanceMonitor() {
  const { metrics, isOptimizationEnabled, toggleOptimization, getPerformanceReport } = usePerformance();
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <div className="fixed top-4 left-4 z-[9999] font-mono">
      <div 
        className="bg-black/90 text-white p-2 rounded cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <span className="text-xs">PERF</span>
          <span className={`text-sm font-bold ${getScoreColor(metrics.performanceScore)}`}>
            {metrics.performanceScore.toFixed(0)}
          </span>
          <span className={`text-xs ${isOptimizationEnabled ? 'text-green-400' : 'text-gray-400'}`}>
            {isOptimizationEnabled ? 'OPT' : 'STD'}
          </span>
        </div>
        
        {isExpanded && (
          <div className="mt-2 space-y-1 text-xs min-w-[200px]">
            {metrics.fcp && <div>FCP: {metrics.fcp.toFixed(0)}ms</div>}
            {metrics.lcp && <div>LCP: {metrics.lcp.toFixed(0)}ms</div>}
            {metrics.cls && <div>CLS: {metrics.cls.toFixed(3)}</div>}
            {metrics.fid && <div>FID: {metrics.fid.toFixed(0)}ms</div>}
            {metrics.memoryUsage && <div>MEM: {metrics.memoryUsage.toFixed(1)}MB</div>}
            <div>ERR: {(metrics.errorRate * 100).toFixed(1)}%</div>
            
            <div className="mt-2 pt-2 border-t border-gray-600">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOptimization();
                }}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Toggle Optimization
              </button>
            </div>
            
            {metrics.recommendations.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-600">
                <div className="text-yellow-400 mb-1">Recommendations:</div>
                {metrics.recommendations.slice(0, 2).map((rec, index) => (
                  <div key={index} className="text-xs text-gray-300">
                    • {rec.substring(0, 30)}...
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
