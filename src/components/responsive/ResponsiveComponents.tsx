import React from 'react';
import { useDevice } from '@/contexts/DeviceContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ResponsiveCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  priority?: 'low' | 'normal' | 'high';
  onClick?: () => void;
  actions?: React.ReactNode;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  title,
  description,
  children,
  className,
  priority = 'normal',
  onClick,
  actions
}) => {
  const { 
    isMobile, 
    isTablet, 
    isDesktop, 
    getOptimalSpacing,
    device,
    maxTouchTargetSize 
  } = useDevice();

  const spacing = getOptimalSpacing();
  
  // Device-specific styling
  const cardStyles = cn(
    // Base styles
    "transition-all duration-200 border-2",
    
    // Mobile-first spacing
    spacing === 'tight' ? 'p-3 space-y-2' :
    spacing === 'normal' ? 'p-4 space-y-3' :
    'p-6 space-y-4',
    
    // Touch-friendly sizing
    device.isTouchDevice && onClick && `min-h-[${maxTouchTargetSize}px]`,
    
    // Device-specific enhancements
    isMobile && [
      "rounded-lg shadow-sm",
      onClick && "active:scale-[0.98] active:shadow-lg cursor-pointer"
    ],
    
    isTablet && [
      "rounded-xl shadow-md",
      onClick && "hover:shadow-lg hover:-translate-y-1 cursor-pointer"
    ],
    
    isDesktop && [
      "rounded-xl shadow-md",
      onClick && "hover:shadow-xl hover:-translate-y-2 cursor-pointer"
    ],
    
    // Priority-based styling
    priority === 'high' && "border-red-200 bg-red-50/50",
    priority === 'normal' && "border-slate-200 bg-white",
    priority === 'low' && "border-gray-100 bg-gray-50/50",
    
    className
  );

  const headerStyles = cn(
    // Mobile-first header sizing
    isMobile && "pb-2",
    isTablet && "pb-3", 
    isDesktop && "pb-4"
  );

  const titleStyles = cn(
    // Responsive title sizing
    isMobile && "text-lg font-semibold",
    isTablet && "text-xl font-semibold",
    isDesktop && "text-xl font-bold"
  );

  const descriptionStyles = cn(
    // Responsive description sizing
    isMobile && "text-sm text-muted-foreground",
    isTablet && "text-sm text-muted-foreground",
    isDesktop && "text-base text-muted-foreground"
  );

  return (
    <Card className={cardStyles} onClick={onClick}>
      {(title || description || actions) && (
        <CardHeader className={headerStyles}>
          {title && (
            <CardTitle className={titleStyles}>
              {title}
            </CardTitle>
          )}
          {description && (
            <p className={descriptionStyles}>
              {description}
            </p>
          )}
          {actions && (
            <div className={cn(
              "flex gap-2",
              isMobile ? "flex-col" : "flex-row justify-end"
            )}>
              {actions}
            </div>
          )}
        </CardHeader>
      )}
      <CardContent className={cn(
        title || description || actions ? "" : spacing === 'tight' ? 'p-3' : spacing === 'normal' ? 'p-4' : 'p-6'
      )}>
        {children}
      </CardContent>
    </Card>
  );
};

interface ResponsiveButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'auto' | 'sm' | 'default' | 'lg';
  fullWidth?: boolean;
  priority?: 'primary' | 'secondary' | 'tertiary';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const ResponsiveButton: React.FC<ResponsiveButtonProps> = ({
  children,
  variant = 'default',
  size = 'auto',
  fullWidth,
  priority = 'secondary',
  onClick,
  disabled,
  className
}) => {
  const { 
    isMobile, 
    isTablet, 
    isDesktop, 
    device,
    maxTouchTargetSize,
    minTouchTargetSize 
  } = useDevice();

  // Auto-size based on device and priority
  const getResponsiveSize = () => {
    if (size !== 'auto') return size;
    
    if (priority === 'primary') {
      if (isMobile) return 'lg';
      if (isTablet) return 'lg';
      return 'default';
    }
    
    if (isMobile) return 'default';
    if (isTablet) return 'default';
    return 'default';
  };

  const buttonStyles = cn(
    // Base responsive styling
    device.isTouchDevice && `min-h-[${minTouchTargetSize}px]`,
    
    // Device-specific enhancements
    isMobile && [
      "font-medium",
      priority === 'primary' && "min-h-[56px] text-lg font-semibold",
      fullWidth && "w-full"
    ],
    
    isTablet && [
      "font-medium", 
      priority === 'primary' && "min-h-[52px] text-base font-semibold",
      fullWidth && "w-full"
    ],
    
    isDesktop && [
      "font-medium",
      priority === 'primary' && "min-h-[48px] text-base font-semibold"
    ],
    
    // Touch-friendly active states
    device.isTouchDevice && !disabled && "active:scale-[0.97]",
    
    className
  );

  return (
    <Button
      variant={variant}
      size={getResponsiveSize()}
      onClick={onClick}
      disabled={disabled}
      className={buttonStyles}
    >
      {children}
    </Button>
  );
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  minItemWidth?: number;
  maxColumns?: number;
  gap?: 'tight' | 'normal' | 'loose' | 'auto';
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  minItemWidth = 280,
  maxColumns,
  gap = 'auto',
  className
}) => {
  const { 
    getOptimalColumns, 
    getOptimalSpacing,
    isMobile,
    isTablet,
    isDesktop 
  } = useDevice();

  const optimalColumns = maxColumns ? Math.min(getOptimalColumns(), maxColumns) : getOptimalColumns();
  const spacing = gap === 'auto' ? getOptimalSpacing() : gap;
  
  const gapSize = 
    spacing === 'tight' ? 'gap-3' :
    spacing === 'normal' ? 'gap-4' :
    'gap-6';

  const gridStyles = cn(
    "grid",
    gapSize,
    
    // Responsive grid columns
    isMobile && `grid-cols-1 ${optimalColumns > 1 ? 'sm:grid-cols-2' : ''}`,
    isTablet && `grid-cols-${Math.min(optimalColumns, 3)}`,
    isDesktop && `grid-cols-${optimalColumns}`,
    
    className
  );

  return (
    <div className={gridStyles} style={{
      gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))`
    }}>
      {children}
    </div>
  );
};

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  sidebar,
  header,
  footer,
  className
}) => {
  const { 
    isMobile, 
    isTablet, 
    isDesktop,
    shouldUseBottomNav,
    shouldUseSideNav,
    shouldShowCompactHeader,
    device
  } = useDevice();

  const layoutStyles = cn(
    "min-h-screen flex flex-col",
    className
  );

  const headerStyles = cn(
    "sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm",
    shouldShowCompactHeader ? "h-14" : "h-16"
  );

  const mainStyles = cn(
    "flex-1 flex",
    isMobile && "flex-col",
    isTablet && shouldUseSideNav && "flex-row",
    isDesktop && "flex-row"
  );

  const sidebarStyles = cn(
    "border-r bg-muted/30",
    
    // Mobile: hidden by default, show as overlay when needed
    isMobile && "hidden",
    
    // Tablet: conditional sidebar
    isTablet && shouldUseSideNav && "w-64 flex-shrink-0",
    isTablet && !shouldUseSideNav && "hidden",
    
    // Desktop: always visible
    isDesktop && "w-72 flex-shrink-0"
  );

  const contentStyles = cn(
    "flex-1 overflow-hidden",
    
    // Device-specific padding
    isMobile && "p-4",
    isTablet && "p-6",
    isDesktop && "p-8"
  );

  const footerStyles = cn(
    "border-t bg-background",
    
    // Mobile: bottom navigation
    shouldUseBottomNav && "sticky bottom-0 z-40",
    
    // Others: regular footer
    !shouldUseBottomNav && "mt-auto"
  );

  return (
    <div className={layoutStyles}>
      {header && (
        <header className={headerStyles}>
          {header}
        </header>
      )}
      
      <main className={mainStyles}>
        {sidebar && shouldUseSideNav && (
          <aside className={sidebarStyles}>
            {sidebar}
          </aside>
        )}
        
        <div className={contentStyles}>
          {children}
        </div>
      </main>
      
      {footer && (
        <footer className={footerStyles}>
          {footer}
        </footer>
      )}
      
      {/* Mobile bottom navigation */}
      {sidebar && shouldUseBottomNav && (
        <nav className="sticky bottom-0 z-40 border-t bg-background p-2">
          {sidebar}
        </nav>
      )}
    </div>
  );
};

interface ResponsiveTableProps {
  data: any[];
  columns: Array<{
    key: string;
    title: string;
    render?: (value: any, row: any) => React.ReactNode;
    mobileLabel?: string;
    priority?: 'high' | 'medium' | 'low'; // High = always show, Medium = tablet+, Low = desktop only
  }>;
  onRowClick?: (row: any) => void;
  className?: string;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  data,
  columns,
  onRowClick,
  className
}) => {
  const { isMobile, isTablet, isDesktop, device, maxTouchTargetSize } = useDevice();

  // Filter columns based on device and priority
  const visibleColumns = columns.filter(col => {
    if (col.priority === 'high') return true;
    if (col.priority === 'medium') return !isMobile;
    if (col.priority === 'low') return isDesktop;
    return true; // Default: show on all devices
  });

  if (isMobile) {
    // Mobile: Card-based layout
    return (
      <div className={cn("space-y-3", className)}>
        {data.map((row, index) => (
          <ResponsiveCard
            key={index}
            onClick={() => onRowClick?.(row)}
            className={onRowClick ? "cursor-pointer" : ""}
          >
            <div className="space-y-2">
              {visibleColumns.map(col => {
                const value = row[col.key];
                const displayValue = col.render ? col.render(value, row) : value;
                const label = col.mobileLabel || col.title;
                
                return (
                  <div key={col.key} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">
                      {label}:
                    </span>
                    <span className="text-sm font-semibold">
                      {displayValue}
                    </span>
                  </div>
                );
              })}
            </div>
          </ResponsiveCard>
        ))}
      </div>
    );
  }

  // Tablet/Desktop: Traditional table
  return (
    <div className={cn("overflow-x-auto rounded-lg border", className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            {visibleColumns.map(col => (
              <th key={col.key} className="px-4 py-3 text-left font-semibold">
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={index}
              className={cn(
                "border-b hover:bg-muted/30 transition-colors",
                onRowClick && "cursor-pointer",
                device.isTouchDevice && `min-h-[${maxTouchTargetSize}px]`
              )}
              onClick={() => onRowClick?.(row)}
            >
              {visibleColumns.map(col => {
                const value = row[col.key];
                const displayValue = col.render ? col.render(value, row) : value;
                
                return (
                  <td key={col.key} className="px-4 py-3">
                    {displayValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export {
  useDevice,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useOptimalLayout,
  useResponsiveColumns,
  useTouchDevice
} from '@/contexts/DeviceContext';
