import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useConfirm } from '@/components/ui/ConfirmModal';
import { Smartphone, Tablet, Monitor, RefreshCw, ShieldAlert, Globe, Clock, X } from 'lucide-react';

interface Session {
  id: string;
  userId: number;
  username: string;
  tokenHash: string;
  device: string;
  ip: string;
  createdAt: string;
  lastSeen: string;
  active: boolean;
}

function DeviceIcon({ device }: { device: string }) {
  if (device.includes('Mobile') || device.includes('Android')) {
    return <Smartphone className="h-5 w-5 text-brand-orange" />;
  }
  if (device.includes('Tablet') || device.includes('iPad')) {
    return <Tablet className="h-5 w-5 text-indigo-500" />;
  }
  return <Monitor className="h-5 w-5 text-teal-500" />;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function SessionsPanel() {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const { confirm, ConfirmModalElement } = useConfirm();

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.request('/api/auth/admin/sessions');
      if (!res.success) {
        throw new Error(res.error || t('error-loading-sessions'));
      }
      const data = res.data?.data ?? res.data ?? [];
      // Sort: current sessions first, then most recently active
      const sorted = [...data].sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
      setSessions(sorted);
    } catch (err: any) {
      setError(err.message ?? t('error-loading-sessions'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const revokeSession = async (id: string) => {
    const ok = await confirm({ title: t('revoke-session-confirm'), variant: 'danger' });
    if (!ok) return;
    setRevoking(id);
    try {
      const res = await apiClient.request(`/api/auth/sessions/${id}`, {
        method: 'DELETE',
      });
      if (!res.success) throw new Error(res.error || t('error-revoking-session'));
      toast({ 
        title: t('session-revoked-title'), 
        description: t('session-revoked-desc') 
      });
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      toast({ 
        title: 'Error', 
        description: err.message || t('error-revoking-session'), 
        variant: 'destructive' 
      });
    } finally {
      setRevoking(null);
    }
  };

  return (
    <Card className="border-border/60 shadow-md">
      <CardHeader className="flex flex-row items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Monitor className="h-5 w-5 text-brand-orange" />
            {t('sessions-title')}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {t('sessions-desc')}
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchSessions} 
          disabled={loading}
          className="h-9 flex items-center gap-1.5"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </Button>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="rounded-md bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        {!error && !loading && sessions.length === 0 && (
          <div className="text-center py-10 flex flex-col items-center justify-center gap-2">
            <ShieldAlert className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">{t('no-sessions-found')}</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-brand-orange" />
            <span className="text-xs text-muted-foreground">{t('retrieving-sessions')}</span>
          </div>
        )}

        {!loading && sessions.length > 0 && (
          <div className="overflow-y-auto max-h-[450px] pr-1.5 space-y-2.5">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-border/50 rounded-xl bg-background/40 hover:bg-muted/40 transition-all duration-200 shadow-sm"
              >
                {/* Left: Device + User info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="shrink-0 p-2.5 rounded-xl bg-muted/60 border border-border/20">
                    <DeviceIcon device={s.device} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground truncate">{s.username}</div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground/75" />
                        {s.ip.replace('::ffff:', '')}
                      </span>
                      <span className="text-xs text-muted-foreground/80 truncate max-w-[150px]" title={s.device}>
                        {s.device}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground/75" />
                        {t('active')} {timeAgo(s.lastSeen)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Active Indicator + Revoke action */}
                <div className="flex items-center gap-3.5 shrink-0 self-end sm:self-auto">
                  <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 font-medium text-xs px-2.5 py-0.5 shadow-none rounded-full flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    {t('active')}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 w-9 p-0 rounded-xl transition-all duration-150 active:scale-95 border border-transparent hover:border-destructive/25"
                    onClick={() => revokeSession(s.id)}
                    disabled={revoking === s.id}
                    title="Terminate session"
                  >
                    {revoking === s.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {sessions.length > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-5 font-mono">
            {sessions.length} {sessions.length !== 1 ? t('session-count-plural') : t('session-count-suffix')}
          </p>
        )}
      </CardContent>
      {ConfirmModalElement}
    </Card>
  );
}
