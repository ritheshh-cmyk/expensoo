import { useEffect } from 'react';
import RuntimeErrorBoundary, { ErrorHistoryDebugger } from '@/components/common/RuntimeErrorBoundary';
import { DeviceProvider } from '@/contexts/DeviceContext';
import { PerformanceProvider, PerformanceMonitor } from '@/contexts/PerformanceContext';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';

interface SystemIntegratorProps {
  children: React.ReactNode;
}

export function SystemIntegrator({ children }: SystemIntegratorProps) {
  // Initialize system optimizations
  useEffect(() => {
    // Set up performance monitoring
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      }).then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration);
      }).catch((error) => {
        console.warn('❌ Service Worker registration failed:', error);
      });
    }

    // Set up error reporting
    window.addEventListener('error', (event) => {
      console.error('🚨 Global Error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('🚨 Unhandled Promise Rejection:', event.reason);
    });

    // Optimize based on device capabilities
    const optimizeForDevice = () => {
      const connection = (navigator as any).connection;
      if (connection) {
        // Adjust optimization based on connection speed
        if (connection.effectiveType === '4g') {
          document.documentElement.classList.add('high-performance');
        } else if (connection.effectiveType === '2g') {
          document.documentElement.classList.add('low-performance');
        }
      }

      // Memory optimization
      const memory = (performance as any).memory;
      if (memory && memory.usedJSHeapSize) {
        const memoryUsageMB = memory.usedJSHeapSize / 1024 / 1024;
        if (memoryUsageMB > 100) {
          document.documentElement.classList.add('high-memory-usage');
        }
      }
    };

    optimizeForDevice();
    
    // Monitor performance every 30 seconds
    const performanceInterval = setInterval(optimizeForDevice, 30000);

    return () => {
      clearInterval(performanceInterval);
    };
  }, []);

  return (
    <RuntimeErrorBoundary enableReporting={process.env.NODE_ENV === 'production'}>
      <DeviceProvider>
        <PerformanceProvider>
          <ThemeProvider defaultTheme="dark" storageKey="callmemobiles-theme">
            <AuthProvider>
              {children}
              <Toaster />
              <PerformanceMonitor />
              <ErrorHistoryDebugger />
            </AuthProvider>
          </ThemeProvider>
        </PerformanceProvider>
      </DeviceProvider>
    </RuntimeErrorBoundary>
  );
}

export default SystemIntegrator;
