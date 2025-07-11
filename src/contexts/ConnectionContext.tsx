import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle, RefreshCw, XCircle, AlertCircle } from "lucide-react";

interface ConnectionContextType {
  isOnline: boolean;
  isConnecting: boolean;
  lastSyncTime: Date | null;
  backendUrl: string | null;
  connectionStatus: 'online' | 'offline' | 'connecting';
  connect: () => void;
  disconnect: () => void;
  refreshConnection: () => Promise<void>;
  testConnection: (url: string) => Promise<boolean>;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(
  undefined,
);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(apiClient.getConnectionStatus().online);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const backendUrl = apiClient.getBackendUrl();
  const connectionStatus: 'online' | 'offline' | 'connecting' = isOnline ? 'online' : 'offline';

  // Remove all connection/refresh logic and just provide static values

  return (
    <ConnectionContext.Provider
      value={{
        isOnline,
        isConnecting: false,
        lastSyncTime,
        backendUrl,
        connectionStatus,
        connect: () => {},
        disconnect: () => {},
        refreshConnection: async () => {},
        testConnection: async () => true,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error("useConnection must be used within a ConnectionProvider");
  }
  return context;
}

// Real-time connection status indicator component
export function ConnectionIndicator() {
  const { isOnline, isConnecting, lastSyncTime, backendUrl, connectionStatus } = useConnection();
  const { t } = useLanguage();

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case "online":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "connecting":
        return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />;
      case "offline":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case "online":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "offline":
        return "Disconnected";
      default:
        return "Unknown";
    }
  };

  if (isConnecting) {
    return (
      <div className="flex items-center gap-2 text-warning">
        <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
        <span className="text-xs font-medium">Connecting...</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 ${isOnline ? "text-success" : "text-destructive"}`}
    >
      {getStatusIcon()}
      <span className="text-xs font-medium">{getStatusText()}</span>
      {lastSyncTime && isOnline && (
        <span className="text-xs text-muted-foreground hidden sm:inline">
          • Last sync: {lastSyncTime.toLocaleTimeString()}
        </span>
      )}
      {backendUrl && (
        <span className="text-xs text-muted-foreground hidden md:inline">
          • {backendUrl.replace(/^https?:\/\//, '')}
        </span>
      )}
    </div>
  );
}
