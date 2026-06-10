import { ReactNode, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Smartphone, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

import { Breadcrumbs } from "./Breadcrumbs";
import { IdleWarning } from "./IdleWarning";

interface AppLayoutProps {
  children: ReactNode;
  showBreadcrumbs?: boolean;
}

export function AppLayout({
  children,
  showBreadcrumbs = true,
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // 1. Session-based visit counter
    if (!sessionStorage.getItem('expensoo_session_active')) {
      const visits = parseInt(localStorage.getItem('expensoo_visit_count') || '0', 10);
      localStorage.setItem('expensoo_visit_count', String(visits + 1));
      sessionStorage.setItem('expensoo_session_active', 'true');
    }

    // 2. Determine if banner should be displayed
    const visits = parseInt(localStorage.getItem('expensoo_visit_count') || '0', 10);
    const isDismissed = localStorage.getItem('expensoo_pwa_banner_dismissed') === 'true';
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (visits >= 3 && !isDismissed && !isStandalone) {
      setShowBanner(true);
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent navigating to /install
    localStorage.setItem('expensoo_pwa_banner_dismissed', 'true');
    setShowBanner(false);
  };

  return (
    /*
      Z-INDEX LAYER HIERARCHY (highest wins):
        z-[200]  — Radix portals (dropdowns, dialogs, selects)   ← always on top
        z-50     — Header (sticky)
        z-50     — Mobile sidebar overlay
        z-40     — Mobile backdrop
        z-30     — Desktop sidebar

      NO isolation:isolate on this root — it breaks getBoundingClientRect() on
      position:sticky children in Chromium (crbug.com/1251018), causing Radix
      floating-ui to misplace portals at (0,0).
    */
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop — z-40 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop sidebar z-30, mobile z-50 */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content — padding-left offsets desktop sidebar */}
      <div className="lg:pl-64">
        {/* Header — sticky z-50, NO backdrop-blur (prevents GPU layer conflict) */}
        <Header onMenuClick={() => setSidebarOpen(prev => !prev)} sidebarOpen={sidebarOpen} />

        {showBanner && (
          <div 
            onClick={() => navigate('/install')}
            className="bg-gradient-to-r from-brand-orange/20 via-[#ea580c]/10 to-transparent border-b border-brand-orange/20 px-4 py-3 cursor-pointer hover:bg-brand-orange/15 transition-all relative flex items-center justify-between gap-4 animate-in slide-in-from-top duration-300"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange shrink-0">
                <Smartphone className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground">Install Expensoo App</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  Get offline access, instant loading, and a full-screen native experience!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[10px] font-semibold text-brand-orange hover:underline hidden sm:inline-block">
                Install now &rarr;
              </span>
              <button 
                onClick={handleDismiss}
                className="p-1.5 rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {showBreadcrumbs && (
          <div className="px-4 lg:px-6 py-3 border-b bg-muted/30">
            <div className="mx-auto max-w-7xl">
              <Breadcrumbs />
            </div>
          </div>
        )}

        {/* pb accounts for mobile bottom-nav (64px) + safe-area on notched phones */}
        <main
          className="flex-1 p-3 sm:p-4 lg:p-6 lg:pb-6"
          style={{
            minHeight: 'calc(100vh - 4rem)',
            paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
            WebkitOverflowScrolling: 'touch' as any,
          }}
        >
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </main>
      </div>

      <IdleWarning />
    </div>
  );
}
