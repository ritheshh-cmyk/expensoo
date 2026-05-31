import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileBottomNav } from "./MobileBottomNav";
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

      {/* Main content — clips horizontal overflow without breaking scroll */}
      <div className="lg:pl-64 overflow-x-clip">
        {/* Header — sticky z-50, NO backdrop-blur (prevents GPU layer conflict) */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {showBreadcrumbs && (
          <div className="px-4 lg:px-6 py-3 border-b bg-muted/30">
            <div className="mx-auto max-w-7xl">
              <Breadcrumbs />
            </div>
          </div>
        )}

        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 min-h-[calc(100vh-4rem)]">
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </main>
      </div>

      <IdleWarning />
      <MobileBottomNav />
    </div>
  );
}
