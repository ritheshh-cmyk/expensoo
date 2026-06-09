import React from "react";
import { Bell, Check, Trash2, CheckCircle2, AlertTriangle, XCircle, Info, Clock } from "lucide-react";
import { useAuth, Notification } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NotificationListProps {
  onClose?: () => void;
  className?: string;
}

const typeIcons = {
  info: <Info className="h-4 w-4 text-blue-400" />,
  success: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-400" />,
  error: <XCircle className="h-4 w-4 text-red-400" />,
};

const priorityBorderColor = {
  low: "border-l-blue-500",
  medium: "border-l-yellow-500",
  high: "border-l-orange-500",
  urgent: "border-l-red-500",
};

// Helper function for relative time formatting
function getRelativeTime(dateString: string): string {
  try {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return "Recently";
  }
}

export function NotificationList({ onClose, className }: NotificationListProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useAuth();

  return (
    <div className={cn("flex flex-col w-full max-h-[420px] bg-popover/95 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl border border-white/10", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-foreground/80" />
          <span className="font-semibold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="flex h-5 items-center justify-center rounded-full bg-[#d97757] px-2 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsRead()}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-[#d97757] hover:bg-white/5 gap-1"
          >
            <Check className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {/* List content */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin">
        {notifications.length > 0 ? (
          notifications.map((notification: Notification) => (
            <div
              key={notification.id}
              onClick={() => !notification.read && markAsRead(notification.id)}
              className={cn(
                "p-3.5 flex items-start gap-3 transition-colors hover:bg-white/5 border-l-[3px] border-l-transparent cursor-pointer",
                !notification.read && "bg-white/[0.02] border-l-[#d97757]"
              )}
            >
              {/* Icon */}
              <div className="mt-0.5 shrink-0">
                {typeIcons[notification.type] || <Info className="h-4 w-4 text-blue-400" />}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {!notification.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d97757] shrink-0" />
                    )}
                    <p className={cn("text-xs font-semibold truncate text-foreground", !notification.read && "text-white")}>
                      {notification.title}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                    <Clock className="h-3 w-3" />
                    {getRelativeTime(notification.created_at)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {notification.message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 shrink-0 self-center ml-2" onClick={(e) => e.stopPropagation()}>
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAsRead(notification.id)}
                    className="h-6 w-6 p-0 rounded-md hover:bg-white/5 hover:text-[#d97757]"
                    title="Mark as read"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteNotification(notification.id)}
                  className="h-6 w-6 p-0 rounded-md hover:bg-white/5 hover:text-red-400 text-muted-foreground"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-2.5">
            <div className="p-3 bg-white/5 rounded-full border border-white/10">
              <Bell className="h-5 w-5 text-muted-foreground opacity-60" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground/80">No notifications yet</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
