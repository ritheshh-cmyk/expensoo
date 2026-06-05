import { useState, useEffect } from "react";

export function useBackendStatus(apiUrl: string, interval = 10000) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let lastStatus = navigator.onLine;
    const check = async () => {
      let online = navigator.onLine;
      if (online) {
        try {
          const res = await fetch(`${apiUrl}/health`, { method: "GET" });
          online = res.ok;
        } catch {
          online = false;
        }
      }
      // Debounce rapid changes
      if (online !== lastStatus) {
        setIsOnline(online);
        lastStatus = online;
      }
      timer = setTimeout(check, interval);
    };
    check();
    return () => clearTimeout(timer);
  }, [apiUrl, interval]);

  return isOnline;
} 