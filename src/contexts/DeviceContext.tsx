import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Device type definitions
export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type OrientationType = 'portrait' | 'landscape';
export type ViewportSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface DeviceInfo {
  type: DeviceType;
  orientation: OrientationType;
  viewportSize: ViewportSize;
  width: number;
  height: number;
  isTouchDevice: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  pixelRatio: number;
  isRetina: boolean;
  // Performance and PWA enhancements
  connectionType: string;
  isOnline: boolean;
  deviceMemory: number;
  hardwareConcurrency: number;
  isStandalone: boolean;
  canInstallPWA: boolean;
  hasServiceWorker: boolean;
  performanceLevel: 'high' | 'medium' | 'low';
}

interface DeviceContextType {
  device: DeviceInfo;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSmallMobile: boolean;
  isLargeMobile: boolean;
  isSmallTablet: boolean;
  isLargeTablet: boolean;
  isSmallDesktop: boolean;
  isLargeDesktop: boolean;
  getOptimalLayout: () => 'mobile' | 'tablet' | 'desktop';
  getOptimalColumns: () => number;
  getOptimalSpacing: () => 'tight' | 'normal' | 'loose';
  shouldUseBottomNav: boolean;
  shouldUseSideNav: boolean;
  shouldShowCompactHeader: boolean;
  maxTouchTargetSize: number;
  minTouchTargetSize: number;
  preferredFontSize: 'small' | 'normal' | 'large';
  // Performance optimization features
  shouldOptimizeForPerformance: boolean;
  shouldPreloadContent: boolean;
  shouldUseAdvancedFeatures: boolean;
  getImageQuality: () => 'low' | 'medium' | 'high';
  getAnimationLevel: () => 'none' | 'reduced' | 'full';
}

const DeviceContext = createContext<DeviceContextType | null>(null);

// Device detection utilities
const getDeviceType = (width: number): DeviceType => {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

const getViewportSize = (width: number): ViewportSize => {
  if (width < 384) return 'xs';      // Very small phones
  if (width < 640) return 'sm';      // Small phones
  if (width < 768) return 'md';      // Large phones / small tablets
  if (width < 1024) return 'lg';     // Tablets
  if (width < 1280) return 'xl';     // Small desktop
  return '2xl';                      // Large desktop
};

const getOrientation = (width: number, height: number): OrientationType => {
  return width > height ? 'landscape' : 'portrait';
};

const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || 
         navigator.maxTouchPoints > 0 || 
         (navigator as any).msMaxTouchPoints > 0;
};

const getPixelRatio = (): number => {
  return window.devicePixelRatio || 1;
};

// Performance and PWA detection utilities
const getConnectionType = (): string => {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  return connection?.effectiveType || connection?.type || 'unknown';
};

const getDeviceMemory = (): number => {
  return (navigator as any).deviceMemory || 4; // Default to 4GB if not available
};

const getHardwareConcurrency = (): number => {
  return navigator.hardwareConcurrency || 4; // Default to 4 cores
};

const isStandaloneApp = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

const canInstallPWA = (): boolean => {
  return 'serviceWorker' in navigator && 'caches' in window;
};

const hasServiceWorker = (): boolean => {
  return 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
};

const getPerformanceLevel = (deviceMemory: number, hardwareConcurrency: number, connectionType: string): 'high' | 'medium' | 'low' => {
  // High performance: 8GB+ RAM, 8+ cores, fast connection
  if (deviceMemory >= 8 && hardwareConcurrency >= 8 && ['4g', 'ethernet', 'wifi'].includes(connectionType)) {
    return 'high';
  }
  // Low performance: <2GB RAM, <2 cores, slow connection
  if (deviceMemory < 2 || hardwareConcurrency < 2 || ['2g', 'slow-2g'].includes(connectionType)) {
    return 'low';
  }
  // Medium performance: everything else
  return 'medium';
};

interface DeviceProviderProps {
  children: ReactNode;
  debugMode?: boolean;
}

export const DeviceProvider: React.FC<DeviceProviderProps> = ({ 
  children, 
  debugMode = false 
}) => {
  const [device, setDevice] = useState<DeviceInfo>(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = getPixelRatio();
    const deviceMemory = getDeviceMemory();
    const hardwareConcurrency = getHardwareConcurrency();
    const connectionType = getConnectionType();
    
    return {
      type: getDeviceType(width),
      orientation: getOrientation(width, height),
      viewportSize: getViewportSize(width),
      width,
      height,
      isTouchDevice: isTouchDevice(),
      isLandscape: width > height,
      isPortrait: width <= height,
      pixelRatio,
      isRetina: pixelRatio >= 2,
      connectionType,
      isOnline: navigator.onLine,
      deviceMemory,
      hardwareConcurrency,
      isStandalone: isStandaloneApp(),
      canInstallPWA: canInstallPWA(),
      hasServiceWorker: hasServiceWorker(),
      performanceLevel: getPerformanceLevel(deviceMemory, hardwareConcurrency, connectionType),
    };
  });

  useEffect(() => {
    const updateDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const pixelRatio = getPixelRatio();
      
      const newDevice: DeviceInfo = {
        type: getDeviceType(width),
        orientation: getOrientation(width, height),
        viewportSize: getViewportSize(width),
        width,
        height,
        isTouchDevice: isTouchDevice(),
        isLandscape: width > height,
        isPortrait: width <= height,
        pixelRatio,
        isRetina: pixelRatio >= 2,
        connectionType: getConnectionType(),
        isOnline: navigator.onLine,
        deviceMemory: getDeviceMemory(),
        hardwareConcurrency: getHardwareConcurrency(),
        isStandalone: isStandaloneApp(),
        canInstallPWA: canInstallPWA(),
        hasServiceWorker: hasServiceWorker(),
        performanceLevel: getPerformanceLevel(getDeviceMemory(), getHardwareConcurrency(), getConnectionType()),
      };

      setDevice(newDevice);

      if (debugMode) {
        console.log('📱 Device Info Updated:', {
          type: newDevice.type,
          size: `${newDevice.width}x${newDevice.height}`,
          viewport: newDevice.viewportSize,
          orientation: newDevice.orientation,
          touch: newDevice.isTouchDevice,
          retina: newDevice.isRetina,
        });
      }
    };

    const handleResize = () => {
      // Debounce resize events
      clearTimeout((window as any).__resizeTimeout);
      (window as any).__resizeTimeout = setTimeout(updateDevice, 150);
    };

    const handleOrientationChange = () => {
      // Add small delay for orientation change to complete
      setTimeout(updateDevice, 300);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Initial update
    updateDevice();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      clearTimeout((window as any).__resizeTimeout);
    };
  }, [debugMode]);

  // Derived device states
  const isMobile = device.type === 'mobile';
  const isTablet = device.type === 'tablet';
  const isDesktop = device.type === 'desktop';
  
  const isSmallMobile = device.width < 384; // iPhone SE, etc.
  const isLargeMobile = device.width >= 414 && device.width < 768; // iPhone Pro Max, etc.
  const isSmallTablet = device.width >= 768 && device.width < 900; // iPad Mini
  const isLargeTablet = device.width >= 900 && device.width < 1024; // iPad Pro
  const isSmallDesktop = device.width >= 1024 && device.width < 1440;
  const isLargeDesktop = device.width >= 1440;

  // Intelligent layout decisions
  const getOptimalLayout = (): 'mobile' | 'tablet' | 'desktop' => {
    if (device.isTouchDevice && device.width < 900) return 'mobile';
    if (device.width < 1024) return 'tablet';
    return 'desktop';
  };

  const getOptimalColumns = (): number => {
    if (isSmallMobile) return 1;
    if (isMobile) return device.isLandscape ? 2 : 1;
    if (isSmallTablet) return device.isLandscape ? 3 : 2;
    if (isLargeTablet) return device.isLandscape ? 4 : 3;
    if (isSmallDesktop) return 4;
    return 5;
  };

  const getOptimalSpacing = (): 'tight' | 'normal' | 'loose' => {
    if (isMobile) return 'tight';
    if (isTablet) return 'normal';
    return 'loose';
  };

  // Navigation preferences
  const shouldUseBottomNav = isMobile || (isTablet && device.isPortrait);
  const shouldUseSideNav = isDesktop || (isTablet && device.isLandscape);
  const shouldShowCompactHeader = isMobile || (device.height < 700);

  // Touch target sizing
  const maxTouchTargetSize = isSmallMobile ? 52 : isMobile ? 56 : isTablet ? 60 : 64;
  const minTouchTargetSize = device.isTouchDevice ? 44 : 32;

  // Font size preferences
  const preferredFontSize: 'small' | 'normal' | 'large' = 
    isSmallMobile ? 'small' : 
    isLargeDesktop ? 'large' : 'normal';

  // Performance optimization functions
  const shouldOptimizeForPerformance = device.performanceLevel === 'low' || 
                                       ['2g', 'slow-2g'].includes(device.connectionType);
  
  const shouldPreloadContent = device.performanceLevel === 'high' && 
                              device.connectionType !== '2g' && 
                              device.connectionType !== 'slow-2g';
  
  const shouldUseAdvancedFeatures = device.performanceLevel !== 'low' && device.isOnline;

  const getImageQuality = (): 'low' | 'medium' | 'high' => {
    if (device.performanceLevel === 'low' || ['2g', 'slow-2g'].includes(device.connectionType)) {
      return 'low';
    }
    if (device.performanceLevel === 'high' && device.connectionType === '4g') {
      return 'high';
    }
    return 'medium';
  };

  const getAnimationLevel = (): 'none' | 'reduced' | 'full' => {
    if (device.performanceLevel === 'low') return 'none';
    if (device.performanceLevel === 'medium') return 'reduced';
    return 'full';
  };

  const contextValue: DeviceContextType = {
    device,
    isMobile,
    isTablet,
    isDesktop,
    isSmallMobile,
    isLargeMobile,
    isSmallTablet,
    isLargeTablet,
    isSmallDesktop,
    isLargeDesktop,
    getOptimalLayout,
    getOptimalColumns,
    getOptimalSpacing,
    shouldUseBottomNav,
    shouldUseSideNav,
    shouldShowCompactHeader,
    maxTouchTargetSize,
    minTouchTargetSize,
    preferredFontSize,
    shouldOptimizeForPerformance,
    shouldPreloadContent,
    shouldUseAdvancedFeatures,
    getImageQuality,
    getAnimationLevel,
  };

  // Add device class to body for CSS targeting
  useEffect(() => {
    const body = document.body;
    
    // Remove existing device classes
    body.classList.remove('device-mobile', 'device-tablet', 'device-desktop');
    body.classList.remove('device-touch', 'device-no-touch');
    body.classList.remove('device-retina', 'device-standard');
    body.classList.remove('device-portrait', 'device-landscape');
    body.classList.remove('device-small-mobile', 'device-large-mobile');
    body.classList.remove('device-small-tablet', 'device-large-tablet');
    body.classList.remove('device-small-desktop', 'device-large-desktop');
    body.classList.remove('performance-low', 'performance-medium', 'performance-high');
    body.classList.remove('pwa-standalone', 'pwa-browser', 'pwa-installable');
    body.classList.remove('connection-slow', 'connection-medium', 'connection-fast');

    // Add current device classes
    body.classList.add(`device-${device.type}`);
    body.classList.add(device.isTouchDevice ? 'device-touch' : 'device-no-touch');
    body.classList.add(device.isRetina ? 'device-retina' : 'device-standard');
    body.classList.add(`device-${device.orientation}`);
    
    // Add specific size classes
    if (isSmallMobile) body.classList.add('device-small-mobile');
    if (isLargeMobile) body.classList.add('device-large-mobile');
    if (isSmallTablet) body.classList.add('device-small-tablet');
    if (isLargeTablet) body.classList.add('device-large-tablet');
    if (isSmallDesktop) body.classList.add('device-small-desktop');
    if (isLargeDesktop) body.classList.add('device-large-desktop');

    // Add performance classes
    body.classList.add(`performance-${device.performanceLevel}`);
    
    // Add PWA classes
    if (device.isStandalone) {
      body.classList.add('pwa-standalone');
    } else {
      body.classList.add('pwa-browser');
    }
    
    if (device.canInstallPWA) {
      body.classList.add('pwa-installable');
    }

    // Add connection classes
    const connectionSpeed = ['4g', 'ethernet', 'wifi'].includes(device.connectionType) ? 'fast' :
                           ['3g'].includes(device.connectionType) ? 'medium' : 'slow';
    body.classList.add(`connection-${connectionSpeed}`);

    // Add viewport size class
    body.classList.add(`viewport-${device.viewportSize}`);

    return () => {
      // Cleanup on unmount
      body.classList.remove(
        'device-mobile', 'device-tablet', 'device-desktop',
        'device-touch', 'device-no-touch',
        'device-retina', 'device-standard',
        'device-portrait', 'device-landscape',
        'device-small-mobile', 'device-large-mobile',
        'device-small-tablet', 'device-large-tablet',
        'device-small-desktop', 'device-large-desktop',
        `viewport-${device.viewportSize}`
      );
    };
  }, [device, isSmallMobile, isLargeMobile, isSmallTablet, isLargeTablet, isSmallDesktop, isLargeDesktop]);

  return (
    <DeviceContext.Provider value={contextValue}>
      {children}
      {debugMode && (
        <div className="fixed top-0 right-0 z-[9999] bg-black text-white text-xs p-2 m-2 rounded opacity-80 font-mono">
          <div>Type: {device.type}</div>
          <div>Size: {device.width}×{device.height}</div>
          <div>Viewport: {device.viewportSize}</div>
          <div>Orient: {device.orientation}</div>
          <div>Touch: {device.isTouchDevice ? 'Yes' : 'No'}</div>
          <div>Retina: {device.isRetina ? 'Yes' : 'No'}</div>
          <div>Layout: {getOptimalLayout()}</div>
          <div>Cols: {getOptimalColumns()}</div>
        </div>
      )}
    </DeviceContext.Provider>
  );
};

// Custom hook to use device context
export const useDevice = (): DeviceContextType => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
};

// Utility hooks for specific use cases
export const useIsMobile = (): boolean => {
  const { isMobile } = useDevice();
  return isMobile;
};

export const useIsTablet = (): boolean => {
  const { isTablet } = useDevice();
  return isTablet;
};

export const useIsDesktop = (): boolean => {
  const { isDesktop } = useDevice();
  return isDesktop;
};

export const useOptimalLayout = (): 'mobile' | 'tablet' | 'desktop' => {
  const { getOptimalLayout } = useDevice();
  return getOptimalLayout();
};

export const useResponsiveColumns = (): number => {
  const { getOptimalColumns } = useDevice();
  return getOptimalColumns();
};

export const useTouchDevice = (): boolean => {
  const { device } = useDevice();
  return device.isTouchDevice;
};

// Component for conditional rendering based on device
interface DeviceOnlyProps {
  mobile?: boolean;
  tablet?: boolean;
  desktop?: boolean;
  touch?: boolean;
  children: ReactNode;
}

export const DeviceOnly: React.FC<DeviceOnlyProps> = ({
  mobile = false,
  tablet = false,
  desktop = false,
  touch,
  children
}) => {
  const { isMobile, isTablet, isDesktop, device } = useDevice();
  
  const shouldShow = 
    (mobile && isMobile) ||
    (tablet && isTablet) ||
    (desktop && isDesktop) ||
    (touch !== undefined && device.isTouchDevice === touch);

  return shouldShow ? <>{children}</> : null;
};

export default DeviceProvider;
