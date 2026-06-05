import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
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
  ShieldAlert,
  ShoppingBag,
  BookOpen,
} from "lucide-react";

type UserRole = 'admin' | 'owner' | 'worker';

const navigation = [
  {
    name: "dashboard",
    href: "/dashboard",
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
    name: "sales",
    href: "/sales",
    icon: ShoppingBag,
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
    name: "manual",
    href: "/manual",
    icon: BookOpen,
    roles: ["admin", "owner", "worker"] as UserRole[],
  },
  {
    name: "settings",
    href: "/settings",
    icon: Settings,
    roles: ["admin", "owner", "worker"] as UserRole[],
  },
  {
    name: "admin",
    href: "/admin",
    icon: ShieldAlert,
    roles: ["admin", "owner"] as UserRole[],
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
  const { can } = usePermissions();

  const isActive = (item: (typeof navigation)[0]) => {
    if (item.exact) {
      return location.pathname === item.href;
    }
    return location.pathname.startsWith(item.href);
  };

  const visibleNavigation = navigation.filter((item) => {
    if (item.name === "admin") return user?.role === "admin";
    if (item.name === "settings" || item.name === "manual") return true;
    if (item.name === "sales") return can("transactions.edit");
    if (item.name === "bills") return can("transactions.view");
    if (item.name === "expenditures") return can("transactions.view");
    return can(`${item.name}.view`);
  });

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-[#1a1918]/95 backdrop-blur-xl border-r border-white/8 px-6 py-6">
          <div className="flex h-16 shrink-0 items-center">
            <div className="flex items-center space-x-3">
              <div className="expenso-gradient w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-brand-orange/25">
                <Smartphone strokeWidth={1.25} className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-brand-orange to-[#e8a07a] bg-clip-text text-transparent">
                  CallMeMobiles
                </h1>
                <p className="text-xs text-white/50">
                  {t("mobile-tracker")}
                </p>
              </div>
            </div>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-1">
              {visibleNavigation.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={cn(
                      "group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 min-h-[44px] text-sm font-medium",
                      isActive(item)
                        ? "bg-white text-[#1a1918] shadow-md shadow-black/10"
                        : "text-white/70 hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-brand-orange",
                    )}
                  >
                    <item.icon
                      strokeWidth={1.25}
                      className={cn(
                        "h-5 w-5 shrink-0 transition-colors",
                        isActive(item)
                          ? "text-brand-orange"
                          : "text-white/40 group-hover:text-white",
                      )}
                    />
                    {t(item.name)}
                  </Link>
                </li>
              ))}
              <li className="mt-auto pt-4 border-t border-white/8">
                <div className="px-4 py-2 mb-2">
                  <div className="text-xs text-white/40 uppercase tracking-wider font-heading">
                    {t("logged-in-as")}
                  </div>
                  <div className="text-sm font-medium text-white/90 capitalize">
                    {user?.role}
                  </div>
                </div>
                <Button
                  onClick={logout}
                  variant="ghost"
                  className="w-full justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium leading-6 text-white/70 hover:bg-white/5 hover:text-white cursor-pointer min-h-[44px] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-brand-orange"
                >
                  <LogOut strokeWidth={1.25} className="h-5 w-5 shrink-0" />
                  {t("sign-out")}
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
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-[#1a1918]/95 backdrop-blur-xl border-r border-white/8 px-6 py-6 safe-area-top">
          <div className="flex h-16 shrink-0 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="expenso-gradient w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-brand-orange/25">
                <Smartphone strokeWidth={1.25} className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-brand-orange to-[#e8a07a] bg-clip-text text-transparent">
                  CallMeMobiles
                </h1>
                <p className="text-xs text-white/50">
                  {t("mobile-tracker")}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close sidebar"
              className="h-11 w-11 shrink-0 electron-no-drag cursor-pointer hover:bg-white/5 text-white/70 hover:text-white transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-orange active:scale-95"
            >
              <X strokeWidth={1.25} className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-1">
              {visibleNavigation.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 min-h-[44px] text-sm font-medium",
                      isActive(item)
                        ? "bg-white text-[#1a1918] shadow-md shadow-black/10"
                        : "text-white/70 hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-brand-orange",
                    )}
                  >
                    <item.icon
                      strokeWidth={1.25}
                      className={cn(
                        "h-5 w-5 shrink-0 transition-colors",
                        isActive(item)
                          ? "text-brand-orange"
                          : "text-white/40 group-hover:text-white",
                      )}
                    />
                    {t(item.name)}
                  </Link>
                </li>
              ))}
              <li className="mt-auto pt-4 border-t border-white/8">
                <div className="px-4 py-2 mb-2">
                  <div className="text-xs text-white/40 uppercase tracking-wider font-heading">
                    {t("logged-in-as")}
                  </div>
                  <div className="text-sm font-medium text-white/90 capitalize">
                    {user?.role}
                  </div>
                </div>
                <Button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  variant="ghost"
                  className="w-full justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium leading-6 text-white/70 hover:bg-white/5 hover:text-white cursor-pointer min-h-[44px] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-brand-orange"
                >
                  <LogOut strokeWidth={1.25} className="h-5 w-5 shrink-0" />
                  {t("sign-out")}
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
