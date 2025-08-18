import { ReactNode, useState } from "react";
import { useDevice } from "@/contexts/DeviceContext";
import { AdaptiveNavigation } from "../navigation/AdaptiveNavigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileBottomNav } from "./MobileBottomNav";
import { Breadcrumbs } from "./Breadcrumbs";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  showBreadcrumbs?: boolean;
}

export function AppLayout({
  children,
  showBreadcrumbs = true,
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    isMobile,
    isTablet,
    isDesktop,
    shouldUseBottomNav,
    shouldUseSideNav,
    shouldShowCompactHeader,
    getOptimalLayout,
    device
  } = useDevice();

  const layout = getOptimalLayout();
  
  return (
    <div className={cn(
      "auto-layout min-h-screen bg-background theme-transition",
      `device-${device.type}`,
      device.isTouchDevice ? "device-touch" : "device-no-touch",
      `device-${device.orientation}`
    )}>
      {/* Adaptive Navigation System */}
      {shouldUseSideNav && (
        <AdaptiveNavigation />
      )}

      {/* Mobile sidebar backdrop - Only when using legacy sidebar */}
      {sidebarOpen && !shouldUseSideNav && (
        <div
          className="mobile-menu-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Legacy Desktop Sidebar - Only when not using adaptive nav */}
      {!shouldUseSideNav && (
        <div className="hidden lg:block">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className={cn(
        shouldUseSideNav && !isMobile && "ml-64 lg:ml-80",
        !shouldUseSideNav && "lg:pl-64"
      )}>
        {/* Adaptive Header */}
        <header className={cn(
          "auto-header sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm transition-all",
          shouldShowCompactHeader ? "h-14" : "h-16"
        )}>
          <Header 
            onMenuClick={() => setSidebarOpen(true)}
            showMenuButton={!shouldUseSideNav}
            compact={shouldShowCompactHeader}
          />
        </header>

        {/* Adaptive Breadcrumbs */}
        {showBreadcrumbs && !isMobile && (
          <div className="px-4 lg:px-6 py-3 border-b bg-muted/30">
            <div className="mx-auto max-w-7xl">
              <Breadcrumbs />
            </div>
          </div>
        )}

        {/* Adaptive Main Content */}
        <main className={cn(
          "auto-content flex-1 transition-all",
          // Mobile spacing
          isMobile && "p-4 pb-24 space-y-4",
          // Tablet spacing  
          isTablet && "p-6 pb-8 space-y-6",
          // Desktop spacing
          isDesktop && "p-8 pb-8 space-y-8",
          // Bottom nav padding
          shouldUseBottomNav && "pb-24",
          // Minimum height
          "min-h-[calc(100vh-3.5rem)]"
        )}>
          <div className={cn(
            "w-full animate-in fade-in-50 duration-300",
            // Adaptive container
            isMobile && "container-mobile",
            isTablet && "container-tablet", 
            isDesktop && "container-desktop"
          )}>
            {children}
          </div>
        </main>

        {/* Enhanced Footer */}
        <Footer />
      </div>

      {/* Adaptive Bottom Navigation */}
      {shouldUseBottomNav && (
        <AdaptiveNavigation />
      )}

      {/* Legacy Mobile Bottom Nav - Fallback */}
      {!shouldUseBottomNav && isMobile && (
        <MobileBottomNav />
      )}

      {/* Development Device Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-16 right-4 z-[9999] bg-black/90 text-white text-xs p-3 rounded-lg font-mono max-w-48 opacity-75 hover:opacity-100 transition-opacity">
          <div className="space-y-1">
            <div className="font-bold text-green-400">Device Auto-Switch</div>
            <div>Type: {device.type}</div>
            <div>Size: {device.width}×{device.height}</div>
            <div>Layout: {layout}</div>
            <div>Nav: {shouldUseBottomNav ? 'Bottom' : shouldUseSideNav ? 'Side' : 'Overlay'}</div>
            <div>Touch: {device.isTouchDevice ? 'Yes' : 'No'}</div>
            <div>Orientation: {device.orientation}</div>
            <div className="border-t border-gray-600 pt-1 mt-1">
              <div className="text-yellow-300">Auto-Switching Active</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
