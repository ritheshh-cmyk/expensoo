import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Monitor, Smartphone, RefreshCw, X, Clock, Globe, Tablet } from 'lucide-react';

const BASE_URL = 'https://backendmobile-4swg.onrender.com';

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
    return <Smartphone className="h-5 w-5 text-blue-500" />;
  }
  if (device.includes('Tablet') || device.includes('iPad')) {
    return <Tablet className="h-5 w-5 text-purple-500" />;
  }
  return <Monitor className="h-5 w-5 text-gray-500" />;
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
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') ?? sessionStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/auth/admin/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      setSessions(json.data ?? []);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const revokeSession = async (id: string) => {
    if (!confirm('Revoke this session? The user will be logged out on that device.')) return;
    setRevoking(id);
    try {
      const token = localStorage.getItem('token') ?? sessionStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/auth/sessions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to revoke');
      toast({ title: 'Session revoked', description: 'The session has been terminated.' });
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch {
      toast({ title: 'Error', description: 'Could not revoke session.', variant: 'destructive' });
    } finally {
      setRevoking(null);
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-start justify-between gap-4 flex-wrap">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-blue-500" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            All currently active user sessions across devices — revoke any suspicious ones
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSessions} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        {!error && !loading && sessions.length === 0 && (
          <p className="text-center text-muted-foreground py-10 text-sm">
            No active sessions found.
          </p>
        )}

        {loading && (
          <div className="flex justify-center py-10">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}

        {!loading && sessions.length > 0 && (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-xl hover:bg-muted/40 transition-colors"
              >
                {/* Left: device + info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 p-2 rounded-lg bg-muted">
                    <DeviceIcon device={s.device} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{s.username}</div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        {s.ip.replace('::ffff:', '')}
                      </span>
                      <span className="text-xs text-muted-foreground">{s.device}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Active {timeAgo(s.lastSeen)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: status + revoke */}
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-green-600 border-green-500 text-xs">
                    ● Active
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                    onClick={() => revokeSession(s.id)}
                    disabled={revoking === s.id}
                    title="Revoke session"
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
          <p className="text-xs text-muted-foreground text-center mt-4">
            {sessions.length} active session{sessions.length !== 1 ? 's' : ''} • Sessions auto-expire after 24 hours of inactivity
          </p>
        )}
      </CardContent>
    </Card>
  );
}
