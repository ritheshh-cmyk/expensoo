import React from 'react';

// PWA Service Module
export class PWAService {
  private static instance: PWAService;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isOnline = navigator.onLine;

  private constructor() {
    this.init();
  }

  static getInstance(): PWAService {
    if (!PWAService.instance) {
      PWAService.instance = new PWAService();
    }
    return PWAService.instance;
  }

  private async init() {
    // Register service worker
    await this.registerServiceWorker();
    
    // Set up online/offline listeners
    this.setupConnectionListeners();
    
    // Request notification permission
    this.requestNotificationPermission();
  }

  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        // Use correct path for GitHub Pages deployment
        const swPath = window.location.hostname.endsWith('github.io') ? '/expenso/sw.js' : 'sw.js';
        this.swRegistration = await navigator.serviceWorker.register('/expensoo/sw.js', {
          scope: '/expensoo/'
        });
        console.log('Service Worker registered successfully:', this.swRegistration);

        // Listen for service worker updates
        this.swRegistration.addEventListener('updatefound', () => {
          const newWorker = this.swRegistration!.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available
                this.showUpdateNotification();
              }
            });
          }
        });

        // Handle service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event.data);
        });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  private setupConnectionListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.onConnectionChange(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.onConnectionChange(false);
    });
  }

  private onConnectionChange(isOnline: boolean) {
    // Dispatch custom event for connection change
    window.dispatchEvent(new CustomEvent('connectionChange', {
      detail: { isOnline }
    }));

    // Show notification
    if (isOnline) {
      this.showNotification('Connection Restored', 'You are back online!');
    } else {
      this.showNotification('Connection Lost', 'Working in offline mode');
    }
  }

  private async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
      } catch (error) {
        console.error('Failed to request notification permission:', error);
      }
    }
  }

  private showUpdateNotification() {
    if (confirm('A new version of CallMeMobiles is available. Would you like to update?')) {
      window.location.reload();
    }
  }

  private handleServiceWorkerMessage(data: any) {
    switch (data.type) {
      case 'CACHE_UPDATED':
        console.log('Cache updated:', data.payload);
        break;
      case 'OFFLINE_ACTION_QUEUED':
        console.log('Offline action queued:', data.payload);
        break;
      default:
        console.log('Service worker message:', data);
    }
  }

  // Public methods
  async showNotification(title: string, body: string, options?: NotificationOptions) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options,
        body
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    }
  }

  async requestBackgroundSync(tag: string) {
    if (this.swRegistration && 'sync' in this.swRegistration) {
      try {
        await (this.swRegistration as any).sync.register(tag);
        console.log('Background sync registered:', tag);
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  }

  getConnectionStatus() {
    return {
      isOnline: this.isOnline,
      swRegistration: this.swRegistration !== null,
      notificationPermission: Notification.permission
    };
  }

  async updateApp() {
    if (this.swRegistration) {
      try {
        await this.swRegistration.update();
        console.log('App update requested');
      } catch (error) {
        console.error('App update failed:', error);
      }
    }
  }

  async clearCache() {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('All caches cleared');
      } catch (error) {
        console.error('Cache clearing failed:', error);
      }
    }
  }

  // Install prompt handling
  private deferredPrompt: any = null;

  setInstallPrompt(prompt: any) {
    this.deferredPrompt = prompt;
  }

  async showInstallPrompt() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      return outcome;
    }
    return null;
  }

  canInstall() {
    return this.deferredPrompt !== null;
  }
}

// Export singleton instance
export const pwaService = PWAService.getInstance();

// Utility functions
export const isPWAInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

export const isOnline = () => {
  return navigator.onLine;
};

export const getAppVersion = () => {
  return '1.0.0'; // This could be read from package.json or environment
};

// PWA installation hook
export const usePWAInstall = () => {
  const [canInstall, setCanInstall] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(isPWAInstalled());

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      pwaService.setInstallPrompt(e);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    const outcome = await pwaService.showInstallPrompt();
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setCanInstall(false);
    }
    return outcome;
  };

  return { canInstall, isInstalled, install };
};