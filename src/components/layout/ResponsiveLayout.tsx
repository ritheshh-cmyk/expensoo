import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  sidebarWidth?: 'sm' | 'md' | 'lg' | 'xl';
  collapsible?: boolean;
  mobileBreakpoint?: 'sm' | 'md' | 'lg';
}

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  orientation: 'portrait' | 'landscape';
  width: number;
  height: number;
}

export function ResponsiveLayout({
  children,
  className,
  sidebar,
  header,
  footer,
  sidebarWidth = 'md',
  collapsible = true,
  mobileBreakpoint = 'lg'
}: ResponsiveLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenSize: 'lg',
    orientation: 'landscape',
    width: 1024,
    height: 768
  });

  // Responsive breakpoints
  const breakpoints = {
    xs: 475,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
    '3xl': 1920
  };

  const sidebarWidths = {
    sm: 'w-48', // 192px
    md: 'w-64', // 256px
    lg: 'w-72', // 288px
    xl: 'w-80'  // 320px
  };

  const updateDeviceInfo = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    let screenSize: DeviceInfo['screenSize'] = 'xs';
    if (width >= breakpoints['3xl']) screenSize = '3xl';
    else if (width >= breakpoints['2xl']) screenSize = '2xl';
    else if (width >= breakpoints.xl) screenSize = 'xl';
    else if (width >= breakpoints.lg) screenSize = 'lg';
    else if (width >= breakpoints.md) screenSize = 'md';
    else if (width >= breakpoints.sm) screenSize = 'sm';

    const isMobile = width < breakpoints.md;
    const isTablet = width >= breakpoints.md && width < breakpoints.lg;
    const isDesktop = width >= breakpoints.lg;

    setDeviceInfo({
      isMobile,
      isTablet,
      isDesktop,
      screenSize,
      orientation: width > height ? 'landscape' : 'portrait',
      width,
      height
    });
  };

  useEffect(() => {
    updateDeviceInfo();
    
    const handleResize = () => {
      updateDeviceInfo();
      
      // Auto-close mobile sidebar on resize to desktop
      if (window.innerWidth >= breakpoints[mobileBreakpoint]) {
        setSidebarOpen(false);
      }
      
      // Auto-collapse sidebar on smaller screens
      if (collapsible) {
        if (window.innerWidth < breakpoints.xl) {
          setSidebarCollapsed(true);
        } else {
          setSidebarCollapsed(false);
        }
      }
    };

    const handleOrientationChange = () => {
      // Small delay to allow for screen resize to complete
      setTimeout(updateDeviceInfo, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [collapsible, mobileBreakpoint]);

  // Layout classes based on device and sidebar state
  const getLayoutClasses = () => {
    const classes = ['min-h-screen', 'flex', 'flex-col', 'bg-background'];
    
    if (deviceInfo.isMobile) {
      classes.push('overflow-x-hidden');
    }
    
    return cn(classes);
  };

  const getMainClasses = () => {
    const classes = ['flex', 'flex-1', 'transition-all', 'duration-300', 'ease-in-out'];
    
    if (sidebar && deviceInfo.isDesktop && !sidebarCollapsed) {
      const widthClass = sidebarWidths[sidebarWidth];
      classes.push(`ml-0`, `${mobileBreakpoint}:ml-${widthClass.split('-')[1]}`);
    }
    
    return cn(classes);
  };

  const getContentClasses = () => {
    // NOTE: Do NOT add overflow-hidden here — it kills trackpad scroll momentum
    const classes = ['flex-1', 'flex', 'flex-col'];
    if (deviceInfo.isMobile) classes.push('min-h-0');
    return cn(classes);
  };

  const getSidebarClasses = () => {
    if (!sidebar) return '';
    
    const classes = [
      'fixed',
      'top-0',
      'left-0',
      'z-50',
      'h-full',
      'bg-card',
      'border-r',
      'transition-all',
      'duration-300',
      'ease-in-out',
      sidebarWidths[sidebarWidth]
    ];

    // Mobile behavior
    if (deviceInfo.isMobile || deviceInfo.isTablet) {
      classes.push(
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      );
    } else {
      // Desktop behavior
      if (collapsible && sidebarCollapsed) {
        classes.push('w-16', '-translate-x-0'); // Collapsed state
      } else {
        classes.push('translate-x-0');
      }
    }

    return cn(classes);
  };

  return (
    <div className={getLayoutClasses()}>
      {/* Mobile/Tablet Overlay */}
      {sidebarOpen && (deviceInfo.isMobile || deviceInfo.isTablet) && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      {sidebar && (
        <aside className={getSidebarClasses()}>
          {React.cloneElement(sidebar as React.ReactElement, {
            collapsed: collapsible && sidebarCollapsed && deviceInfo.isDesktop,
            onToggleCollapse: () => setSidebarCollapsed(!sidebarCollapsed),
            onClose: () => setSidebarOpen(false),
            deviceInfo,
          })}
        </aside>
      )}

      {/* Main Layout */}
      <div className={getMainClasses()}>
        <div className={getContentClasses()}>
          {/* Header */}
          {header && (
            <header className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              {React.cloneElement(header as React.ReactElement, {
                onMenuClick: () => setSidebarOpen(!sidebarOpen),
                sidebarOpen,
                deviceInfo,
              })}
            </header>
          )}

          {/* Main Content — overflow-x-clip NOT hidden, preserves scroll momentum */}
          <main className="flex-1 overflow-y-auto overflow-x-clip">
            <div className={cn(
              'container mx-auto',
              // Responsive padding
              'p-4 sm:p-6 lg:p-8',
              // Max width constraints
              'max-w-none sm:max-w-7xl',
              // Custom spacing for different screen sizes
              deviceInfo.isMobile && 'px-3 py-4',
              deviceInfo.isTablet && 'px-6 py-6',
              deviceInfo.isDesktop && 'px-8 py-8',
              className
            )}>
              <div className="space-y-6">
                {children}
              </div>
            </div>
          </main>

          {/* Footer - Only render if provided (user requested no footer by default) */}
          {footer && (
            <footer className="flex-shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              {React.cloneElement(footer as React.ReactElement, {
                deviceInfo,
              })}
            </footer>
          )}
        </div>
      </div>

      {/* Debug info for development (only in dev mode) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50 opacity-50 hover:opacity-100 transition-opacity">
          <div className="bg-black/80 text-white px-3 py-2 rounded-lg text-xs font-mono">
            <div>Screen: {deviceInfo.screenSize}</div>
            <div>Device: {deviceInfo.isMobile ? 'Mobile' : deviceInfo.isTablet ? 'Tablet' : 'Desktop'}</div>
            <div>Size: {deviceInfo.width}×{deviceInfo.height}</div>
            <div>Orientation: {deviceInfo.orientation}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for accessing device information
export function useDeviceInfo(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenSize: 'lg',
    orientation: 'landscape',
    width: 1024,
    height: 768
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      let screenSize: DeviceInfo['screenSize'] = 'xs';
      if (width >= 1920) screenSize = '3xl';
      else if (width >= 1536) screenSize = '2xl';
      else if (width >= 1280) screenSize = 'xl';
      else if (width >= 1024) screenSize = 'lg';
      else if (width >= 768) screenSize = 'md';
      else if (width >= 640) screenSize = 'sm';

      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        screenSize,
        orientation: width > height ? 'landscape' : 'portrait',
        width,
        height
      });
    };

    updateDeviceInfo();
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', () => {
      setTimeout(updateDeviceInfo, 100);
    });
    
    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
}

// Responsive grid component
interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: number;
  className?: string;
}

export function ResponsiveGrid({
  children,
  cols = { default: 1, sm: 2, lg: 3, xl: 4 },
  gap = 6,
  className
}: ResponsiveGridProps) {
  const getGridClasses = () => {
    const classes = ['grid', `gap-${gap}`];
    
    // Base columns
    classes.push(`grid-cols-${cols.default}`);
    
    // Responsive columns
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
    if (cols['2xl']) classes.push(`2xl:grid-cols-${cols['2xl']}`);
    
    return cn(classes, className);
  };

  return (
    <div className={getGridClasses()}>
      {children}
    </div>
  );
}

// Responsive container component
interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function ResponsiveContainer({
  children,
  maxWidth = '2xl',
  padding = 'md',
  className
}: ResponsiveContainerProps) {
  const getContainerClasses = () => {
    const classes = ['mx-auto', 'w-full'];
    
    // Max width
    if (maxWidth !== 'full') {
      classes.push(`max-w-${maxWidth}`);
    }
    
    // Responsive padding
    switch (padding) {
      case 'none':
        break;
      case 'sm':
        classes.push('px-3 sm:px-4');
        break;
      case 'md':
        classes.push('px-4 sm:px-6 lg:px-8');
        break;
      case 'lg':
        classes.push('px-6 sm:px-8 lg:px-12');
        break;
    }
    
    return cn(classes, className);
  };

  return (
    <div className={getContainerClasses()}>
      {children}
    </div>
  );
}
