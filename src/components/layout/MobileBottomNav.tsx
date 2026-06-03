import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CreditCard,
  Users,
  Receipt,
  TrendingUp,
  FileText,
  Settings,
  ShieldAlert,
  ShoppingBag,
} from "lucide-react";

const mobileNavigation = [
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
    href: "/sales/new",
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
    name: "settings",
    href: "/settings",
    icon: Settings,
    roles: ["admin", "owner", "worker"] as UserRole[],
  },
  {
    name: "admin",
    href: "/admin",
    icon: ShieldAlert,
    roles: ["admin"] as UserRole[],           // ← workers/owners excluded
  },
];

export function MobileBottomNav() {
  const location = useLocation();
  const { t } = useLanguage();
  const { hasAccess } = useAuth();

  const isActive = (item: (typeof mobileNavigation)[0]) => {
    if (item.exact) return location.pathname === item.href;
    return location.pathname.startsWith(item.href);
  };

  const visibleNavigation = mobileNavigation.filter((item) =>
    hasAccess(item.roles)
  );

  // Limit to 5 items max on small screens (>5 = too cramped)
  // If admin, always show admin; else drop lower-priority ones
  const navItems = visibleNavigation.length > 5
    ? visibleNavigation.filter((_, i) => i < 4).concat(
        visibleNavigation.find(n => n.name === 'settings') ?? [],
      )
    : visibleNavigation;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Frosted glass bar */}
      <div className="bg-background/95 backdrop-blur-md border-t border-border">
        <div
          className="grid px-1 py-0.5"
          style={{ gridTemplateColumns: `repeat(${navItems.length}, 1fr)` }}
        >
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.name}
                to={item.href}
                aria-label={item.name}
                className={cn(
                  // Touch target: min 52px tall (exceeds 44px Apple HIG)
                  "relative flex flex-col items-center justify-center gap-0.5",
                  "min-h-[52px] px-1 pt-2 pb-1.5 rounded-xl mx-0.5 my-0.5",
                  "transition-all duration-150 active:scale-95",
                  // No blue flash on tap
                  "[-webkit-tap-highlight-color:transparent]",
                  active
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
                style={{ touchAction: "manipulation" }}
              >
                {/* Active indicator — animated dot above icon */}
                <span
                  className={cn(
                    "absolute top-1 left-1/2 -translate-x-1/2 rounded-full bg-primary",
                    "transition-all duration-200",
                    active ? "w-1.5 h-1.5 opacity-100" : "w-0 h-0 opacity-0",
                  )}
                />
                <item.icon
                  className={cn(
                    "shrink-0 transition-all duration-150",
                    active ? "h-[22px] w-[22px] stroke-[2.3px]" : "h-5 w-5 stroke-[1.8px]",
                  )}
                />
                <span className="text-[10px] font-semibold leading-tight text-center max-w-full truncate">
                  {t(item.name)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
