import React, { useState } from 'react';
import { useDevice } from '@/contexts/DeviceContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Receipt,
  Plus,
  Building,
  CreditCard,
  FileText,
  Users,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react';

const navigationItems = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/',
    roles: ['admin', 'owner', 'worker']
  },
  {
    id: 'transactions',
    title: 'Transactions',
    icon: Receipt,
    path: '/transactions',
    roles: ['admin', 'owner', 'worker']
  },
  {
    id: 'new-transaction',
    title: 'New Order',
    icon: Plus,
    path: '/transactions/new',
    roles: ['admin', 'owner', 'worker'],
    priority: 'primary'
  },
  {
    id: 'suppliers',
    title: 'Suppliers',
    icon: Building,
    path: '/suppliers',
    roles: ['admin', 'owner']
  },
  {
    id: 'expenditures',
    title: 'Expenses',
    icon: CreditCard,
    path: '/expenditures',
    roles: ['admin', 'owner']
  },
  {
    id: 'expenditure-management',
    title: 'Expenditure Management',
    icon: FileText,
    path: '/expenditure-management',
    roles: ['admin', 'owner', 'worker']
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: FileText,
    path: '/reports',
    roles: ['admin', 'owner']
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
    path: '/settings',
    roles: ['admin', 'owner', 'worker']
  }
];

interface AdaptiveNavigationProps {
  className?: string;
}

export const AdaptiveNavigation: React.FC<AdaptiveNavigationProps> = ({ className }) => {
  const {
    isMobile,
    isTablet,
    isDesktop,
    shouldUseBottomNav,
    shouldUseSideNav,
    device,
    getOptimalLayout,
    maxTouchTargetSize
  } = useDevice();

  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const currentLayout = getOptimalLayout();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  // Device indicator for debugging
  const DeviceIndicator = () => (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg text-xs">
      {isMobile && <Smartphone className="h-4 w-4" />}
      {isTablet && <Tablet className="h-4 w-4" />}
      {isDesktop && <Monitor className="h-4 w-4" />}
      <span className="font-medium">
        {device.type} • {device.width}×{device.height}
      </span>
      {device.isTouchDevice && (
        <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs">
          Touch
        </span>
      )}
    </div>
  );

  // Mobile Bottom Navigation
  if (shouldUseBottomNav) {
    const primaryItems = navigationItems.filter(item => 
      ['dashboard', 'transactions', 'new-transaction', 'settings'].includes(item.id)
    );

    return (
      <div className={cn("auto-navigation mobile-nav-bottom", className)}>
        <div className="safe-area-bottom">
          <div className="grid grid-cols-4 gap-1 p-2">
            {primaryItems.map(item => {
              const ItemIcon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => handleNavigation(item.path)}
                  className={cn(
                    "auto-interactive flex-col gap-1 h-16 p-2 text-xs rounded-xl transition-all",
                    active && "bg-primary text-primary-foreground shadow-md",
                    !active && "hover:bg-muted/50"
                  )}
                  style={{
                    minHeight: `${maxTouchTargetSize}px`,
                    minWidth: `${maxTouchTargetSize}px`
                  }}
                >
                  <ItemIcon className="h-5 w-5" />
                  <span className="font-medium leading-tight">
                    {item.title === 'New Order' ? 'New' : item.title}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
        
        {/* Development Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-2 border-t bg-muted/30">
            <DeviceIndicator />
          </div>
        )}
      </div>
    );
  }

  // Tablet/Desktop Side Navigation
  if (shouldUseSideNav) {
    return (
      <div className={cn(
        "auto-navigation flex flex-col border-r bg-muted/30",
        isTablet && "w-64",
        isDesktop && "w-80",
        className
      )}>
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Receipt className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold">CallMeMobiles</h2>
              <p className="text-sm text-muted-foreground">Repair Center</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigationItems.map(item => {
            const ItemIcon = item.icon;
            const active = isActive(item.path);
            const isPrimary = item.priority === 'primary';
            
            return (
              <Button
                key={item.id}
                variant={active ? "default" : isPrimary ? "outline" : "ghost"}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "auto-interactive w-full justify-start gap-3 p-4 transition-all",
                  active && "shadow-md",
                  isPrimary && !active && "border-2 border-primary/30 text-primary hover:bg-primary/10",
                  isTablet && "h-12 text-sm",
                  isDesktop && "h-14 text-base"
                )}
                style={{
                  minHeight: `${Math.max(48, maxTouchTargetSize - 8)}px`
                }}
              >
                <ItemIcon className={cn(
                  isTablet && "h-5 w-5",
                  isDesktop && "h-6 w-6"
                )} />
                <span className="font-medium">{item.title}</span>
                {isPrimary && !active && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  </div>
                )}
              </Button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t space-y-3">
          {/* Layout Indicator */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Layout: {currentLayout}</span>
            <div className="flex gap-1">
              {isMobile && <Smartphone className="h-3 w-3" />}
              {isTablet && <Tablet className="h-3 w-3" />}
              {isDesktop && <Monitor className="h-3 w-3" />}
            </div>
          </div>
          
          {/* Development Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <DeviceIndicator />
          )}
        </div>
      </div>
    );
  }

  // Fallback: Mobile hamburger menu overlay
  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        onClick={() => setIsMobileMenuOpen(true)}
        className="auto-interactive p-2 fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border shadow-md"
        style={{
          minHeight: `${maxTouchTargetSize}px`,
          minWidth: `${maxTouchTargetSize}px`
        }}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="mobile-menu-backdrop"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="mobile-menu open">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="font-bold">CallMeMobiles</h2>
                    <p className="text-sm text-muted-foreground">Menu</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="auto-interactive p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-2 flex-1">
              {navigationItems.map(item => {
                const ItemIcon = item.icon;
                const active = isActive(item.path);
                const isPrimary = item.priority === 'primary';
                
                return (
                  <Button
                    key={item.id}
                    variant={active ? "default" : isPrimary ? "outline" : "ghost"}
                    onClick={() => handleNavigation(item.path)}
                    className={cn(
                      "auto-interactive w-full justify-start gap-3 p-4 transition-all",
                      active && "shadow-md",
                      isPrimary && !active && "border-2 border-primary/30 text-primary"
                    )}
                    style={{
                      minHeight: `${maxTouchTargetSize}px`
                    }}
                  >
                    <ItemIcon className="h-5 w-5" />
                    <span className="font-medium">{item.title}</span>
                  </Button>
                );
              })}
            </div>

            <div className="p-4 border-t">
              <DeviceIndicator />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AdaptiveNavigation;
