
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/theme-provider";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Bell,
  Settings,
  User,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Shield,
  ChevronDown,
} from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

// ── Simple hook: close when clicking outside a ref ────────────────────────────
function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, cb]);
}

// ── Pure-CSS dropdown (no Radix Portal = no Chromium positioning bug) ─────────
// Uses position:absolute inside a position:relative wrapper so coordinates
// are always exactly "below the trigger button", regardless of sticky/isolation.
interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

function NativeMenu({
  trigger,
  items,
  width = "w-52",
}: {
  trigger: React.ReactNode;
  items: MenuItemProps[];
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  // Inject the toggle onClick directly onto the trigger element so no extra
  // wrapper div is needed — keeps the DOM flat and the trigger a real button.
  const triggerWithHandler = React.cloneElement(
    trigger as React.ReactElement<React.HTMLAttributes<HTMLElement>>,
    { onClick: () => setOpen((v) => !v) }
  );

  return (
    // position:relative is the containing block for the absolute menu
    <div className="relative" ref={ref}>
      {triggerWithHandler}

      {open && (
        <div
          role="menu"
          className={`
            absolute right-0 top-full mt-2 ${width} z-[200]
            rounded-xl border border-border bg-popover text-popover-foreground
            shadow-xl ring-1 ring-black/5
            origin-top-right
            animate-in fade-in-0 zoom-in-95 duration-150
          `}
          style={{ minWidth: "13rem" }}
        >
          <div className="py-1">
            {items.map((item, i) => (
              <button
                key={i}
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 text-sm
                  hover:bg-accent hover:text-accent-foreground
                  transition-colors duration-100 text-left
                  ${item.danger ? "text-destructive hover:text-destructive" : ""}
                  ${i > 0 && items[i - 1].danger !== item.danger ? "border-t border-border mt-1 pt-2" : ""}
                `}
              >
                <span className="shrink-0 opacity-70">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
export function Header({ onMenuClick }: HeaderProps) {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // Avatar sync — updated instantly when Profile page fires the custom event
  const [avatarSrc, setAvatarSrc] = useState<string | null>(
    () => localStorage.getItem("profile_avatar")
  );

  useEffect(() => {
    const sync = () => setAvatarSrc(localStorage.getItem("profile_avatar"));
    window.addEventListener("avatar-updated", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("avatar-updated", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const themeIcon =
    theme === "dark" ? <Moon className="h-4 w-4" /> :
    theme === "light" ? <Sun className="h-4 w-4" /> :
    <Monitor className="h-4 w-4" />;

  const themeItems: MenuItemProps[] = [
    { icon: <Sun className="h-4 w-4" />,     label: t("light-mode"),  onClick: () => setTheme("light")  },
    { icon: <Moon className="h-4 w-4" />,    label: t("dark-mode"),   onClick: () => setTheme("dark")   },
    { icon: <Monitor className="h-4 w-4" />, label: t("system-mode"), onClick: () => setTheme("system") },
  ];

  const userItems: MenuItemProps[] = [
    { icon: <User className="h-4 w-4" />,     label: t("profile"),  onClick: () => navigate("/profile")  },
    { icon: <Settings className="h-4 w-4" />, label: t("settings"), onClick: () => navigate("/settings") },
    { icon: <LogOut className="h-4 w-4" />,   label: t("sign-out"),  onClick: handleLogout, danger: true  },
  ];

  return (
    <header className="sticky top-0 z-50 h-16 border-b bg-background">
      <div className="flex items-center justify-between px-4 lg:px-6 h-full">

        {/* ── Left ── */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden min-h-[44px] min-w-[44px] active:scale-95"
            onClick={onMenuClick}
            aria-label="Toggle navigation menu"
            style={{ touchAction: "manipulation" }}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>

          <div className="hidden lg:flex flex-col">
            <h1 className="text-base sm:text-lg font-semibold text-foreground truncate max-w-[160px] sm:max-w-none">CallMeMobiles</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">{t("professional-management")}</p>
          </div>
        </div>

        {/* ── Centre: System status ── */}
        <div className="hidden md:flex items-center">
          <Badge variant="outline" className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {t("system-online")}
          </Badge>
        </div>

        {/* ── Right ── */}
        <div className="flex items-center gap-1">

          {/* Theme switcher */}
          <NativeMenu
            trigger={
              <Button variant="ghost" size="sm">
                {themeIcon}
              </Button>
            }
            items={themeItems}
            width="w-36"
          />

          {/* Notifications (static for now) */}
          <Button variant="ghost" size="sm">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>

          {/* User menu */}
          <NativeMenu
            trigger={
              <Button variant="ghost" className="flex items-center gap-2 px-3 h-10">
                {/* Avatar circle */}
                <div className="w-7 h-7 rounded-full overflow-hidden border border-border flex items-center justify-center bg-primary/10 shrink-0">
                  {avatarSrc
                    ? <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
                    : <User className="h-4 w-4 text-primary" />
                  }
                </div>
                {/* Name + role — hidden on mobile */}
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium leading-none">
                    {user?.name || user?.username || "User"}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Shield className="h-3 w-3" />
                    {user?.role}
                  </span>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground hidden md:block" />
              </Button>
            }
            items={userItems}
          />
        </div>
      </div>
    </header>
  );
}
