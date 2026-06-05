
import { useState, useEffect } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  orientation: 'portrait' | 'landscape';
  hasTouch: boolean;
  pixelRatio: number;
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenSize: 'lg',
    orientation: 'landscape',
    hasTouch: false,
    pixelRatio: 1,
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const pixelRatio = window.devicePixelRatio || 1;
      
      let screenSize: DeviceInfo['screenSize'] = 'lg';
      if (width < 640) screenSize = 'sm';
      else if (width < 768) screenSize = 'md';
      else if (width < 1024) screenSize = 'lg';
      else if (width < 1280) screenSize = 'xl';
      else screenSize = '2xl';

      const isMobile = width < 768 && hasTouch;
      const isTablet = width >= 768 && width < 1024 && hasTouch;
      const isDesktop = width >= 1024 || !hasTouch;
      const orientation = height > width ? 'portrait' : 'landscape';

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        screenSize,
        orientation,
        hasTouch,
        pixelRatio,
      });
    };

    updateDeviceInfo();
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
}

export function DeviceDetection({ children }: { children: React.ReactNode }) {
  const device = useDeviceDetection();
  
  return (
    <div 
      className={`device-${device.screenSize} orientation-${device.orientation} ${device.hasTouch ? 'touch-device' : 'no-touch'}`}
      data-device-info={JSON.stringify(device)}
    >
      {children}
    </div>
  );
}
