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
    name: "suppliers",
    href: "/suppliers",
    icon: Users,
    roles: ["admin", "owner"] as UserRole[],
  },
  {
    name: "bills",
    href: "/bills",
    icon: Receipt,
    roles: ["admin", "owner", "worker"] as UserRole[],
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
    <nav className="mobile-nav fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur border-t border-border safe-area-bottom">
      <div
        className={`grid px-2 py-2`}
        style={{
          gridTemplateColumns: `repeat(${visibleNavigation.length}, 1fr)`,
        }}
      >
        {visibleNavigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-lg p-2 touch-target transition-colors",
              isActive(item)
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-accent",
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{t(item.name)}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
