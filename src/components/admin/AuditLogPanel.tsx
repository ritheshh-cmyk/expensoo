import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock } from 'lucide-react';
import { SkeletonTableRow } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSearchParams } from 'react-router-dom';
import { Pagination } from '@/components/ui/pagination';

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
      return { label: 'LOGIN', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
    case 'LOGIN_FAILED':
      return { label: 'LOGIN FAILED', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' };
    case 'LOGOUT':
      return { label: 'LOGOUT', className: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20' };
    case 'CREATE_USER':
      return { label: 'CREATE USER', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' };
    case 'DELETE_USER':
      return { label: 'DELETE USER', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' };
    case 'UPDATE_ROLE':
      return { label: 'UPDATE ROLE', className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' };
    case 'CHANGE_PASSWORD':
      return { label: 'CHANGE PWD', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20' };
    // Transaction events
    case 'TRANSACTION_CREATED':
      return { label: 'TXN CREATED', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
    case 'TRANSACTION_UPDATED':
      return { label: 'TXN UPDATED', className: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' };
    case 'TRANSACTION_DELETED':
      return { label: 'TXN DELETED', className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
    // Permissions / settings
    case 'PERMISSION_UPDATED':
      return { label: 'PERMISSIONS', className: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' };
    case 'PROFILE_UPDATED':
      return { label: 'PROFILE', className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' };
    // Data operations
    case 'EXPORT_DATA':
      return { label: 'EXPORT', className: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' };
    case 'BULK_DELETE':
      return { label: 'BULK DELETE', className: 'bg-red-600/10 text-red-700 dark:text-red-300 border-red-600/20' };
    case 'SUPPLIER_CREATED':
      return { label: 'SUPPLIER', className: 'bg-lime-500/10 text-lime-600 dark:text-lime-400 border-lime-500/20' };
    default:
      return { label: action.replace(/_/g, ' '), className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' };
  }
}

const EVENT_TYPES = [
  'LOGIN',
  'LOGIN_FAILED',
  'LOGOUT',
  'CREATE_USER',
  'DELETE_USER',
  'UPDATE_ROLE',
  'CHANGE_PASSWORD',
  'TRANSACTION_CREATED',
  'TRANSACTION_UPDATED',
  'TRANSACTION_DELETED',
  'PERMISSION_UPDATED',
  'PROFILE_UPDATED',
  'EXPORT_DATA',
  'SUPPLIER_CREATED'
];

export function AuditLogPanel() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Filter States
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedActions, setSelectedActions] = useState<string[]>([]);

  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const currentPage = isNaN(pageParam) ? 1 : pageParam;

  const setCurrentPage = (page: number) => {
    setSearchParams(prev => {
      prev.set("page", String(page));
      return prev;
    });
  };

  // Filter logic
  const filteredLogs = logs.filter(log => {
    // Date filter
    const logDate = new Date(log.timestamp);
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    if (logDate < start || logDate > end) return false;

    // Action filter
    if (selectedActions.length > 0 && !selectedActions.includes(log.action)) {
      return false;
    }

    return true;
  });

  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, (currentPage - 1) * itemsPerPage + itemsPerPage);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.request(`/api/auth/audit/logs?limit=500`);
      if (!res.success) {
        throw new Error(res.error || t('error-loading'));
      }
      
      const data = res.data?.data ?? res.data ?? [];
      setLogs(data);
      setLastRefreshed(new Date());
    } catch (err: any) {
      setError(err.message ?? t('error-loading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Handle resetting and initial fetch
  const handleRefresh = () => {
    fetchLogs();
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <Card className="border-border/60 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Clock className="h-5 w-5 text-brand-orange" />
            {t('audit-log-title')}
          </CardTitle>
          <div className="flex items-center gap-3">
            {lastRefreshed && (
              <span className="text-xs text-muted-foreground">
                {t('last-updated')}: {lastRefreshed.toLocaleTimeString()}
              </span>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 h-9"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="rounded-md bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="space-y-4 mb-6 p-4 rounded-xl border border-border/40 bg-muted/10">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Start Date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">End Date</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
            {(startDate || endDate || selectedActions.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 30);
                  setStartDate(d.toISOString().split('T')[0]);
                  setEndDate(new Date().toISOString().split('T')[0]);
                  setSelectedActions([]);
                  setCurrentPage(1);
                }}
                className="text-xs h-8 text-[#d97757] hover:text-[#d97757]/80 shrink-0"
              >
                Clear Filters
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Event Type</span>
            <div className="flex flex-wrap gap-1.5">
              {EVENT_TYPES.map(type => {
                const isSelected = selectedActions.includes(type);
                const { label } = actionVariant(type);
                return (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedActions(prev =>
                        prev.includes(type)
                          ? prev.filter(a => a !== type)
                          : [...prev, type]
                      );
                      setCurrentPage(1);
                    }}
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-[#d97757] text-white border-[#d97757]'
                        : 'bg-background text-muted-foreground border-border/80 hover:bg-muted'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {!error && filteredLogs.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('no-logs')}
          </p>
        )}

        {loading && filteredLogs.length === 0 ? (
          <div className="overflow-auto rounded-xl border border-border bg-background/50 backdrop-blur-sm">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-10">
                <tr className="text-muted-foreground bg-muted/40">
                  <th className="text-left px-4 py-3.5 font-semibold whitespace-nowrap">{t('timestamp')}</th>
                  <th className="text-left px-4 py-3.5 font-semibold whitespace-nowrap">{t('action')}</th>
                  <th className="text-left px-4 py-3.5 font-semibold whitespace-nowrap">{t('actor')}</th>
                  <th className="text-left px-4 py-3.5 font-semibold whitespace-nowrap">{t('target')}</th>
                  <th className="text-left px-4 py-3.5 font-semibold whitespace-nowrap">{t('ip-address')}</th>
                  <th className="text-left px-4 py-3.5 font-semibold whitespace-nowrap">{t('status')}</th>
                  <th className="text-left px-4 py-3.5 font-semibold whitespace-nowrap">{t('details')}</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <SkeletonTableRow key={i} cols={7} />
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-auto rounded-xl border border-border bg-background/50 backdrop-blur-sm">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-10">
                  <tr className="text-muted-foreground">
                    <th className="text-left px-4 py-3.5 font-semibold whitespace-nowrap">{t('timestamp')}</th>
                    <th className="text-left px-4 py-3.5 font-semibold whitespace-nowrap">{t('action')}</th>
                    <th className="text-left px-4 py-3.5 font-semibold whitespace-nowrap">{t('actor')}</th>
                    <th className="text-left px-4 py-3.5 font-semibold whitespace-nowrap">{t('target')}</th>
                    <th className="text-left px-4 py-3.5 font-semibold whitespace-nowrap">{t('ip-address')}</th>
                    <th className="text-left px-4 py-3.5 font-semibold whitespace-nowrap">{t('status')}</th>
                    <th className="text-left px-4 py-3.5 font-semibold whitespace-nowrap">{t('details')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log, idx) => {
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
                            {log.success ? t('success') : t('failed')}
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
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 py-3 border border-border bg-background/50 backdrop-blur-sm rounded-xl mt-4">
                <div className="text-xs text-muted-foreground text-center sm:text-left">
                  Showing page {currentPage} of {totalPages} ({filteredLogs.length} logs found)
                </div>
                <div className="flex-1 flex justify-center sm:justify-end">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
