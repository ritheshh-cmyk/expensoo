import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  CreditCard,
  Users,
  Receipt,
  TrendingUp,
  FileText,
  Settings,
  X,
  Smartphone,
  LogOut,
} from "lucide-react";

const navigation = [
  {
    name: "dashboard",
    href: "/",
    icon: LayoutDashboard,
    exact: true,
    roles: ["admin", "owner", "worker"] as UserRole[],
  },
  {
    name: "transactions",
    href: "/transactions",
    icon: CreditCard,
    roles: ["admin", "owner", "worker"] as UserRole[],
  },
  {
    name: "suppliers",
    href: "/suppliers",
    icon: Users,
    roles: ["admin", "owner"] as UserRole[],
  },
  {
    name: "expenditures",
    href: "/expenditures",
    icon: TrendingUp,
    roles: ["admin", "owner"] as UserRole[],
  },
  {
    name: "bills",
    href: "/bills",
    icon: Receipt,
    roles: ["admin", "owner", "worker"] as UserRole[],
  },
  {
    name: "reports",
    href: "/reports",
    icon: FileText,
    roles: ["admin", "owner"] as UserRole[],
  },
  {
    name: "settings",
    href: "/settings",
    icon: Settings,
    roles: ["admin", "owner", "worker"] as UserRole[],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const { t } = useLanguage();
  const { hasAccess, logout, user } = useAuth();

  const isActive = (item: (typeof navigation)[0]) => {
    if (item.exact) {
      return location.pathname === item.href;
    }
    return location.pathname.startsWith(item.href);
  };

  const visibleNavigation = navigation.filter((item) => hasAccess(item.roles));

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-sidebar border-r border-sidebar-border px-6 py-6">
          <div className="flex h-16 shrink-0 items-center">
            <div className="flex items-center space-x-3">
              <div className="expenso-gradient w-10 h-10 rounded-xl flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-sidebar-foreground">
                  CallMeMobiles
                </h1>
                <p className="text-xs text-sidebar-foreground/60">
                  Mobile Repair Tracker
                </p>
              </div>
            </div>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              {visibleNavigation.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={cn(
                      "group flex gap-x-3 rounded-lg p-4 text-sm font-medium leading-6 transition-all duration-200 min-h-[48px] items-center touch-manipulation",
                      isActive(item)
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent/80",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-colors",
                        isActive(item)
                          ? "text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground",
                      )}
                    />
                    {t(item.name)}
                  </Link>
                </li>
              ))}
              <li className="mt-auto pt-4 border-t border-sidebar-border">
                <div className="px-4 py-2 mb-2">
                  <div className="text-xs text-sidebar-foreground/60 uppercase tracking-wider">
                    Logged in as
                  </div>
                  <div className="text-sm font-medium text-sidebar-foreground capitalize">
                    {user?.role}
                  </div>
                </div>
                <Button
                  onClick={logout}
                  variant="ghost"
                  className="w-full justify-start gap-x-3 rounded-lg p-4 text-sm font-medium leading-6 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  Sign out
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 z-50 flex w-64 flex-col transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-sidebar border-r border-sidebar-border px-6 py-6 safe-area-top">
          <div className="flex h-16 shrink-0 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="expenso-gradient w-10 h-10 rounded-xl flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-sidebar-foreground">
                  CallMeMobiles
                </h1>
                <p className="text-xs text-sidebar-foreground/60">
                  Mobile Repair Tracker
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 electron-no-drag"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              {visibleNavigation.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex gap-x-3 rounded-lg p-4 text-sm font-medium leading-6 transition-all duration-200 min-h-[48px] items-center touch-manipulation",
                      isActive(item)
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent/80",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-colors",
                        isActive(item)
                          ? "text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground",
                      )}
                    />
                    {t(item.name)}
                  </Link>
                </li>
              ))}
              <li className="mt-auto pt-4 border-t border-sidebar-border">
                <div className="px-4 py-2 mb-2">
                  <div className="text-xs text-sidebar-foreground/60 uppercase tracking-wider">
                    Logged in as
                  </div>
                  <div className="text-sm font-medium text-sidebar-foreground capitalize">
                    {user?.role}
                  </div>
                </div>
                <Button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  variant="ghost"
                  className="w-full justify-start gap-x-3 rounded-lg p-4 text-sm font-medium leading-6 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  Sign out
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
