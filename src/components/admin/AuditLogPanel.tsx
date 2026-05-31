import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface AuditLog {
  id: number;
  action: string;
  actor: string;
  target?: string;
  details?: string;
  ip?: string;
  userAgent?: string;
  timestamp: string;
  success: boolean;
}

// Badge color per action type (Premium theme-aware, works perfectly in light & dark modes)
function actionVariant(action: string): { label: string; className: string } {
  switch (action) {
    case 'LOGIN':
      return { 
        label: 'LOGIN', 
        className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' 
      };
    case 'LOGIN_FAILED':
      return { 
        label: 'LOGIN FAILED', 
        className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' 
      };
    case 'LOGOUT':
      return { 
        label: 'LOGOUT', 
        className: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20' 
      };
    case 'CREATE_USER':
      return { 
        label: 'CREATE USER', 
        className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' 
      };
    case 'DELETE_USER':
      return { 
        label: 'DELETE USER', 
        className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' 
      };
    case 'UPDATE_ROLE':
      return { 
        label: 'UPDATE ROLE', 
        className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' 
      };
    case 'CHANGE_PASSWORD':
      return { 
        label: 'CHANGE PWD', 
        className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20' 
      };
    default:
      return { 
        label: action, 
        className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' 
      };
  }
}

export function AuditLogPanel() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  
  // Pagination & infinite scroll state
  const [limit, setLimit] = useState(25);
  const [hasMore, setHasMore] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchLogs = useCallback(async (targetLimit = 25, isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await apiClient.request(`/api/auth/audit/logs?limit=${targetLimit}`);
      if (!res.success) {
        throw new Error(res.error || 'Failed to load audit logs');
      }
      
      const data = res.data?.data ?? res.data ?? [];
      setLogs(data);
      
      // If we got back fewer logs than we requested, we reached the end of the list
      if (data.length < targetLimit) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      
      setLastRefreshed(new Date());
    } catch (err: any) {
      setError(err.message ?? 'Failed to load audit logs');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Handle resetting and initial fetch
  const handleRefresh = () => {
    setLimit(25);
    setHasMore(true);
    fetchLogs(25, false);
  };

  useEffect(() => {
    fetchLogs(limit, false);
  }, [fetchLogs]);

  // Infinite Scroll Trigger
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    // Trigger when scrolled within 40px of the bottom
    const isNearBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 40;
    
    if (isNearBottom && !loading && !loadingMore && hasMore) {
      const nextLimit = limit + 25;
      setLimit(nextLimit);
      fetchLogs(nextLimit, true);
    }
  };

  return (
    <Card className="border-border/60 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Clock className="h-5 w-5 text-brand-orange" />
            Audit Log
          </CardTitle>
          <div className="flex items-center gap-3">
            {lastRefreshed && (
              <span className="text-xs text-muted-foreground">
                Last updated: {lastRefreshed.toLocaleTimeString()}
              </span>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={loading || loadingMore}
              className="flex items-center gap-1.5 h-9"
            >
              <RefreshCw className={`h-4 w-4 ${loading && !loadingMore ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Real-time security events — login attempts, password changes, role updates, and user deletions
        </p>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="rounded-md bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        {!error && logs.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No audit events recorded yet.
          </p>
        )}

        {logs.length > 0 && (
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="overflow-auto max-h-[500px] rounded-xl border border-border bg-background/50 backdrop-blur-sm"
          >
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-10">
                <tr className="text-muted-foreground">
                  <th className="text-left px-4 py-3.5 font-semibold whitespace-nowrap">Timestamp</th>
                  <th className="text-left px-4 py-3.5 font-semibold whitespace-nowrap">Action</th>
                  <th className="text-left px-4 py-3.5 font-semibold whitespace-nowrap">Actor</th>
                  <th className="text-left px-4 py-3.5 font-semibold whitespace-nowrap">Target</th>
                  <th className="text-left px-4 py-3.5 font-semibold whitespace-nowrap">IP Address</th>
                  <th className="text-left px-4 py-3.5 font-semibold whitespace-nowrap">Status</th>
                  <th className="text-left px-4 py-3.5 font-semibold whitespace-nowrap">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => {
                  const { label, className: badgeClass } = actionVariant(log.action);
                  return (
                    <tr
                      key={log.id}
                      className={`border-b border-border/40 transition-colors hover:bg-muted/40 ${
                        idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                      }`}
                    >
                      {/* Timestamp */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>

                      {/* Action Badge */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}
                        >
                          {label}
                        </span>
                      </td>

                      {/* Actor */}
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-foreground">{log.actor}</td>

                      {/* Target */}
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {log.target ?? <span className="text-xs text-muted-foreground/40">—</span>}
                      </td>

                      {/* IP */}
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {log.ip ?? '—'}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                            log.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              log.success ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          />
                          {log.success ? 'Success' : 'Failed'}
                        </span>
                      </td>

                      {/* Details */}
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[240px] truncate" title={log.details}>
                        {log.details ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Loading More indicator */}
            {loadingMore && (
              <div className="flex items-center justify-center gap-2 py-4 border-t border-border bg-muted/10">
                <Loader2 className="h-4 w-4 animate-spin text-brand-orange" />
                <span className="text-xs text-muted-foreground">Loading more log entries...</span>
              </div>
            )}
            
            {/* No More Logs message */}
            {!hasMore && logs.length > 0 && (
              <div className="text-center py-4 text-xs text-muted-foreground border-t border-border bg-muted/5 font-mono">
                • End of audit trail reached •
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
