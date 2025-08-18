import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CreditCard,
  Users,
  Receipt,
  Settings,
} from "lucide-react";

const mobileNavigation = [
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
    name: "expenditures",
    href: "/expenditures",
    icon: Receipt,
    roles: ["admin", "owner", "worker"] as UserRole[],
  },
  {
    name: "suppliers",
    href: "/suppliers",
    icon: Users,
    roles: ["admin", "owner"] as UserRole[],
  },
  {
    name: "settings",
    href: "/settings",
    icon: Settings,
    roles: ["admin", "owner", "worker"] as UserRole[],
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
    <nav className="mobile-nav-bottom bg-background/95 backdrop-blur border-t border-border">
      <div
        className={`grid px-1 py-1`}
        style={{
          gridTemplateColumns: `repeat(${visibleNavigation.length}, 1fr)`,
        }}
      >
        {visibleNavigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "thumb-target flex flex-col items-center justify-center gap-1 rounded-xl p-3 transition-all duration-200 active:scale-95",
              isActive(item)
                ? "text-primary bg-primary/10 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
            )}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs font-medium leading-tight">{t(item.name)}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
