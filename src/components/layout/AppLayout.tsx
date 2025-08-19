import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
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

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Breadcrumbs */}
        {showBreadcrumbs && (
          <div className="px-4 lg:px-6 py-3 border-b bg-muted/30">
            <div className="mx-auto max-w-7xl">
              <Breadcrumbs />
            </div>
          </div>
        )}

        {/* Main content area */}
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 min-h-[calc(100vh-4rem)]">
          <div className="mx-auto max-w-7xl w-full animate-in fade-in-50 duration-300">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  );
}
