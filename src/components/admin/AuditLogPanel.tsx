import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock } from 'lucide-react';

const getApiUrl = () => {
  const envBaseUrl = import.meta.env.VITE_BACKEND_URL;
  const prodUrl = 'https://expensoo-app-gu3wg.ondigitalocean.app';
  return envBaseUrl !== undefined && envBaseUrl !== ''
    ? envBaseUrl
    : (import.meta.env.PROD ? prodUrl : '');
};
const BASE_URL = getApiUrl();

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

// Badge color per action type
function actionVariant(action: string): { label: string; className: string } {
  switch (action) {
    case 'LOGIN':
      return { label: 'LOGIN', className: 'bg-blue-100 text-blue-800 border-blue-200' };
    case 'LOGIN_FAILED':
      return { label: 'LOGIN FAILED', className: 'bg-red-100 text-red-800 border-red-200' };
    case 'LOGOUT':
      return { label: 'LOGOUT', className: 'bg-gray-100 text-gray-700 border-gray-200' };
    case 'CREATE_USER':
      return { label: 'CREATE USER', className: 'bg-green-100 text-green-800 border-green-200' };
    case 'DELETE_USER':
      return { label: 'DELETE USER', className: 'bg-red-100 text-red-800 border-red-200' };
    case 'UPDATE_ROLE':
      return { label: 'UPDATE ROLE', className: 'bg-orange-100 text-orange-800 border-orange-200' };
    case 'CHANGE_PASSWORD':
      return { label: 'CHANGE PWD', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    default:
      return { label: action, className: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

export function AuditLogPanel() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token') ?? localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/auth/audit/logs?limit=200`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      setLogs(json.data ?? []);
      setLastRefreshed(new Date());
    } catch (err: any) {
      setError(err.message ?? 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-500" />
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
              onClick={fetchLogs}
              disabled={loading}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Last 100 security events — login attempts, role changes, and deletions
        </p>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        {!error && logs.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No audit events recorded yet.
          </p>
        )}

        {logs.length > 0 && (
          <div className="overflow-auto max-h-[500px] rounded-md border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Timestamp</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Action</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Actor</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Target</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">IP</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => {
                  const { label, className: badgeClass } = actionVariant(log.action);
                  return (
                    <tr
                      key={log.id}
                      className={`border-t transition-colors hover:bg-muted/40 ${
                        idx % 2 === 0 ? '' : 'bg-muted/20'
                      }`}
                    >
                      {/* Timestamp */}
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-muted-foreground font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>

                      {/* Action Badge */}
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}
                        >
                          {label}
                        </span>
                      </td>

                      {/* Actor */}
                      <td className="px-4 py-2 whitespace-nowrap font-medium">{log.actor}</td>

                      {/* Target */}
                      <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">
                        {log.target ?? <span className="text-xs">—</span>}
                      </td>

                      {/* IP */}
                      <td className="px-4 py-2 whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {log.ip ?? '—'}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            log.success ? 'text-green-600' : 'text-red-600'
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
                      <td className="px-4 py-2 text-xs text-muted-foreground max-w-[200px] truncate">
                        {log.details ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
