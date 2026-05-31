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
    roles: ["admin", "owner"] as UserRole[],
  },
];

export function MobileBottomNav() {
  const location = useLocation();
  const { t } = useLanguage();
  const { hasAccess } = useAuth();

  const isActive = (item: (typeof mobileNavigation)[0]) => {
    if (item.exact) {
      return location.pathname === item.href;
    }
    return location.pathname.startsWith(item.href);
  };

  const visibleNavigation = mobileNavigation.filter((item) =>
    hasAccess(item.roles),
  );

  return (
    <nav className="mobile-nav fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur border-t border-border safe-area-bottom lg:hidden">
      <div
        className="grid px-1 py-1"
        style={{
          gridTemplateColumns: `repeat(${visibleNavigation.length}, 1fr)`,
        }}
      >
        {visibleNavigation.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 rounded-xl min-h-[52px] px-1 py-2",
                "touch-action-manipulation select-none",
                "transition-all duration-150 active:scale-95",
                active
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
              )}
              style={{ touchAction: "manipulation" }}
            >
              {/* Active indicator dot at top */}
              {active && (
                <span className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
              <item.icon className={cn("h-[22px] w-[22px] shrink-0", active && "stroke-[2.2px]")} />
              <span className="text-[10px] font-semibold leading-tight text-center max-w-full truncate">
                {t(item.name)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
