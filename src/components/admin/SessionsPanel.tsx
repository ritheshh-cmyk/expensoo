import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useConfirm } from '@/components/ui/ConfirmModal';
import { Smartphone, Tablet, Monitor, RefreshCw, ShieldAlert, Globe, Clock, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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
    return <Smartphone className="h-5 w-5 text-[#d97757]" />;
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
  const { user: me } = useAuth();
  const [userRoles, setUserRoles] = useState<Record<number, string>>({});

  const currentToken = localStorage.getItem('auth_token');
  const currentTokenHash = currentToken ? currentToken.substring(0, 8) : null;

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.request('/api/auth/admin/sessions');
      if (!res.success) {
        throw new Error(res.error || t('error-loading-sessions'));
      }
      const data = res.data?.data ?? res.data ?? [];
      
      // Filter active unexpired/unrevoked sessions (active is true and lastSeen within 24 hours)
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const activeSessions = data.filter((s: Session) => s.active && new Date(s.lastSeen).getTime() > oneDayAgo);

      // Sort: current sessions first, then most recently active
      const sorted = [...activeSessions].sort((a, b) => {
        const aIsCurrent = a.tokenHash === currentTokenHash;
        const bIsCurrent = b.tokenHash === currentTokenHash;
        if (aIsCurrent && !bIsCurrent) return -1;
        if (!aIsCurrent && bIsCurrent) return 1;
        return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
      });
      setSessions(sorted);

      // Fetch user roles to display username with role badge
      try {
        const usersRes = await apiClient.makeRequest('/api/auth/users');
        if (usersRes.success && Array.isArray(usersRes.data)) {
          const roleMap: Record<number, string> = {};
          usersRes.data.forEach((u: any) => {
            roleMap[u.id] = u.role;
          });
          setUserRoles(roleMap);
        }
      } catch (err) {
        console.warn("Failed to fetch user roles:", err);
      }
    } catch (err: any) {
      setError(err.message ?? t('error-loading-sessions'));
    } finally {
      setLoading(false);
    }
  }, [t, currentTokenHash]);

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
      <CardHeader className="flex flex-row items-start justify-between gap-4 flex-wrap pb-4 border-b border-border/40">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Monitor className="h-5 w-5 text-[#d97757]" />
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

      <CardContent className="pt-6">
        {error && (
          <div className="rounded-md bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Active Sessions Summary Card */}
        {!error && !loading && (
          <div className="grid grid-cols-1 gap-4 mb-6">
            <Card className="border border-border/60 bg-[#d97757]/5 dark:bg-[#d97757]/10">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Device Sessions</p>
                  <h3 className="text-3xl font-extrabold text-[#d97757] mt-1">{sessions.length}</h3>
                </div>
                <div className="p-3 bg-[#d97757]/10 rounded-xl">
                  <Monitor className="h-6 w-6 text-[#d97757]" />
                </div>
              </CardContent>
            </Card>
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
            <RefreshCw className="h-8 w-8 animate-spin text-[#d97757]" />
            <span className="text-xs text-muted-foreground">{t('retrieving-sessions')}</span>
          </div>
        )}

        {!loading && sessions.length > 0 && (
          <div className="space-y-3">
            {sessions.map((s) => {
              const isCurrent = s.tokenHash === currentTokenHash;
              const role = userRoles[s.userId] || 'worker';

              return (
                <div
                  key={s.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-border/50 rounded-xl bg-background/40 hover:bg-muted/40 transition-all duration-200 shadow-sm"
                >
                  {/* Left: Device + User info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="shrink-0 p-2.5 rounded-xl bg-muted/60 border border-border/20 mt-0.5">
                      <DeviceIcon device={s.device} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground truncate text-sm sm:text-base">{s.username}</span>
                        <Badge variant="outline" className={`text-[10px] font-semibold capitalize px-2 py-0.5 ${
                          role === 'admin'
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                            : role === 'owner'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                            : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20'
                        }`}>
                          {role}
                        </Badge>
                        {isCurrent && (
                          <Badge className="bg-[#d97757]/10 text-[#d97757] border border-[#d97757]/20 font-semibold text-[10px] px-2 py-0.5 rounded-full shrink-0">
                            Current session
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 mt-1.5">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground/75" />
                          {s.ip.replace('::ffff:', '')}
                        </span>
                        <span className="text-xs text-muted-foreground/80 leading-relaxed truncate max-w-[250px]" title={s.device}>
                          {s.device}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground/75" />
                          {t('active')} {timeAgo(s.lastSeen)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center justify-end shrink-0 gap-3 w-full sm:w-auto">
                    {!isCurrent ? (
                      <Button
                        variant="destructive"
                        className="h-11 px-4 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-95 w-full sm:w-auto"
                        onClick={() => revokeSession(s.id)}
                        disabled={revoking === s.id}
                        style={{ minHeight: '44px', minWidth: '44px' }}
                      >
                        {revoking === s.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        Revoke Session
                      </Button>
                    ) : (
                      <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 font-medium text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0 self-end sm:self-auto">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        Online
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      {ConfirmModalElement}
    </Card>
  );
}
