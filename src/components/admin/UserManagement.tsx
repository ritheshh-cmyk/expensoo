import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import {
  Shield, Trash2, RefreshCw, UserPlus, KeyRound,
  ChevronDown, Check, X, Eye, EyeOff, Loader2,
  Calendar, Clock, User, ShieldCheck, Pencil,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useConfirm } from '@/components/ui/ConfirmModal';

const getApiUrl = () => {
  const envBaseUrl = import.meta.env.VITE_BACKEND_URL;
  const prodUrl = 'https://expensoo-app-gu3wg.ondigitalocean.app';
  return envBaseUrl !== undefined && envBaseUrl !== ''
    ? envBaseUrl
    : (import.meta.env.PROD ? prodUrl : '');
};
const BASE = getApiUrl();

const getToken = () =>
  localStorage.getItem('auth_token') ??
  localStorage.getItem('token') ??
  '';

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  const hrs  = Math.floor(diff / 3600000);
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs  < 24) return `${hrs}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function fmt(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── Role meta ─────────────────────────────────────────────────────────────────
const roleMeta: Record<string, { label: string; cls: string; dotCls: string }> = {
  admin:  { label: 'Admin',  cls: 'bg-red-500/10 text-red-500 border-red-500/20',     dotCls: 'bg-red-500'   },
  owner:  { label: 'Owner',  cls: 'bg-blue-500/10 text-blue-500 border-blue-500/20',  dotCls: 'bg-blue-500'  },
  worker: { label: 'Worker', cls: 'bg-green-500/10 text-green-600 border-green-500/20', dotCls: 'bg-green-500' },
};

// ── Inline Create User form ────────────────────────────────────────────────────
function CreateUserForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen]         = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState<'admin' | 'owner' | 'worker'>('worker');
  const [showPw, setShowPw]     = useState(false);
  const [busy, setBusy]         = useState(false);
  const [err, setErr]           = useState('');
  const { t } = useLanguage();

  const submit = async () => {
    setErr('');
    if (!username.trim() || !password.trim()) { setErr(t("user-mgmt-err-req")); return; }
    if (password.length < 8)                  { setErr(t("user-mgmt-err-len")); return; }
    if (!/[0-9]/.test(password))              { setErr(t("user-mgmt-err-num")); return; }
    if (!/[^A-Za-z0-9]/.test(password))       { setErr(t("user-mgmt-err-spec")); return; }
    setBusy(true);
    try {
      const res = await fetch(`${BASE}/api/auth/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ username: username.trim(), password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      toast({ title: t("user-mgmt-created-title"), description: `${username} (${role}) ${t("user-mgmt-created-desc")}` });
      setOpen(false); setUsername(''); setPassword(''); setRole('worker');
      onCreated();
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)} className="shrink-0">
        <UserPlus className="h-4 w-4 mr-1.5" /> {t("create-user")}
      </Button>
    );
  }

  return (
    <div className="border rounded-xl p-4 bg-muted/30 space-y-3 mt-2">
      <p className="font-semibold text-sm flex items-center gap-2">
        <UserPlus className="h-4 w-4" /> {t("create-user")}
      </p>
      {err && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">{err}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input placeholder={t("user-mgmt-username")} value={username} onChange={e => setUsername(e.target.value)} autoFocus />
        <div className="relative">
          <Input
            type={showPw ? 'text' : 'password'}
            placeholder={t("user-mgmt-pw-placeholder")}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="pr-9"
          />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPw(v => !v)}>
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <select value={role} onChange={e => setRole(e.target.value as any)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="worker">{t("role-worker")}</option>
          <option value="owner">{t("role-owner")}</option>
          <option value="admin">{t("role-admin")}</option>
        </select>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />} {t("create")}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setOpen(false); setErr(''); }}>
          <X className="h-4 w-4 mr-1" /> {t("cancel")}
        </Button>
      </div>
    </div>
  );
}

// ── Inline Reset Password form ─────────────────────────────────────────────────
function ResetPasswordForm({ userId, username, onDone }: { userId: number; username: string; onDone: () => void }) {
  const [pw, setPw]       = useState('');
  const [showPw, setShow] = useState(false);
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState('');
  const { t } = useLanguage();

  const submit = async () => {
    setErr('');
    if (pw.length < 8)             { setErr(t("user-mgmt-err-len")); return; }
    if (!/[0-9]/.test(pw))         { setErr(t("user-mgmt-err-num")); return; }
    if (!/[^A-Za-z0-9]/.test(pw))  { setErr(t("user-mgmt-err-spec")); return; }
    setBusy(true);
    try {
      const res = await fetch(`${BASE}/api/auth/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ newPassword: pw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast({ title: t("user-mgmt-pw-reset-title"), description: `${username}'s ${t("user-mgmt-pw-reset-desc")}` });
      onDone();
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2">
      <p className="text-xs font-semibold text-yellow-800 flex items-center gap-1.5">
        <KeyRound className="h-3.5 w-3.5" /> {t("user-mgmt-force-reset")} <strong>{username}</strong>
      </p>
      {err && <p className="text-xs text-red-500">{err}</p>}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={showPw ? 'text' : 'password'}
            placeholder={t("user-mgmt-new-pw-placeholder")}
            value={pw}
            onChange={e => setPw(e.target.value)}
            className="pr-9 h-9 text-sm"
            autoFocus
          />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShow(v => !v)}>
            {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
        <Button size="sm" className="h-9 bg-yellow-600 hover:bg-yellow-700 text-white" onClick={submit} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        </Button>
        <Button size="sm" variant="ghost" className="h-9" onClick={onDone}><X className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

// ── Inline Edit Username form ───────────────────────────────────────────────────────────
function EditUsernameForm({
  userId, currentUsername, onDone,
}: { userId: number; currentUsername: string; onDone: (newName: string) => void }) {
  const [value, setValue]   = useState(currentUsername);
  const [busy, setBusy]     = useState(false);
  const [err, setErr]       = useState('');
  const { t } = useLanguage();

  const submit = async () => {
    setErr('');
    const trimmed = value.trim();
    if (!trimmed)                  { setErr(t("user-mgmt-err-empty-username")); return; }
    if (trimmed === currentUsername) { onDone(currentUsername); return; }
    if (trimmed.length < 3)        { setErr(t("user-mgmt-err-min3")); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) { setErr(t("user-mgmt-err-invalid-username")); return; }
    setBusy(true);
    try {
      const res = await fetch(`${BASE}/api/auth/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ username: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update username');
      toast({ title: t("user-mgmt-username-updated"), description: `${t("user-mgmt-username-updated-desc")} "${trimmed}"` });
      onDone(trimmed);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
      <p className="text-xs font-semibold text-blue-800 flex items-center gap-1.5">
        <Pencil className="h-3.5 w-3.5" /> {t("user-mgmt-edit-username")}
      </p>
      {err && <p className="text-xs text-red-500">{err}</p>}
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onDone(currentUsername); }}
          className="h-9 text-sm flex-1"
          placeholder={t("new-username-placeholder")}
          autoFocus
        />
        <Button size="sm" className="h-9 bg-blue-600 hover:bg-blue-700 text-white" onClick={submit} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </Button>
        <Button size="sm" variant="ghost" className="h-9" onClick={() => onDone(currentUsername)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}


// ── Main component ─────────────────────────────────────────────────────────────
export function UserManagement() {
  const { user: me } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers]               = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [editRoleId, setEditRoleId]     = useState<number | null>(null);
  const [resetPwId, setResetPwId]       = useState<number | null>(null);
  const [editUsernameId, setEditUsernameId] = useState<number | null>(null);
  const [savingRole, setSavingRole]     = useState<number | null>(null);
  const [expandedId, setExpandedId]     = useState<number | null>(null);
  const { confirm, ConfirmModalElement } = useConfirm();

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${BASE}/api/auth/users`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status} — Backend may be waking up, try Refresh in 30s`);
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async (id: number, username: string) => {
    const ok = await confirm({
      title: `${t("user-mgmt-permanently-delete")} "${username}"?`,
      description: t("user-mgmt-cannot-be-undone"),
      variant: 'danger'
    });
    if (!ok) return;
    try {
      const res = await fetch(`${BASE}/api/auth/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Failed to delete');
      toast({ title: t("user-mgmt-deleted-title"), description: `${username} ${t("user-mgmt-deleted-desc")}` });
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  const handleRoleSave = async (id: number, newRole: string) => {
    setSavingRole(id);
    try {
      const res = await fetch(`${BASE}/api/auth/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ role: newRole }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Failed to update role');
      toast({ title: t("user-mgmt-role-updated-title"), description: `${newRole} ${t("user-mgmt-role-set-desc")}` });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
      setEditRoleId(null);
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setSavingRole(null); }
  };

  const handleUsernameUpdate = (id: number, newUsername: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, username: newUsername } : u));
    setEditUsernameId(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 flex-wrap pb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Shield className="h-5 w-5 text-blue-500" />
            {t("user-mgmt-title")}
          </CardTitle>
          <CardDescription>{t("user-mgmt-desc")}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> {t("refresh")}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <CreateUserForm onCreated={fetchUsers} />

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 space-y-1">
            <p className="font-semibold">Connection Error</p>
            <p>{error}</p>
            <Button size="sm" variant="outline" className="mt-2 h-8 text-xs" onClick={fetchUsers}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> {t("refresh")}
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
            <p className="text-sm text-muted-foreground">{t("user-mgmt-loading")}</p>
          </div>
        ) : users.length === 0 && !error ? (
          <p className="text-center text-muted-foreground text-sm py-8">{t("user-mgmt-no-users")}</p>
        ) : (
          <div className="space-y-2">
            {users.map(user => {
              const meta      = roleMeta[user.role?.toLowerCase()] ?? roleMeta.worker;
              const isSelf       = me?.id === String(user.id) || me?.username === user.username;
              const isEditing    = editRoleId === user.id;
              const isReset      = resetPwId  === user.id;
              const isEditingName = editUsernameId === user.id;
              const isExpanded   = expandedId === user.id;

              return (
                <div key={user.id} className="border rounded-xl overflow-hidden hover:border-primary/30 transition-colors">
                  {/* ── Main row ── */}
                  <div
                    className="flex items-center justify-between gap-3 p-4 cursor-pointer select-none"
                    onClick={() => setExpandedId(isExpanded ? null : user.id)}
                  >
                    {/* Avatar + name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary uppercase">
                        {user.username?.[0] ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm flex items-center gap-1.5 truncate">
                          {user.username}
                          {isSelf && <span className="text-xs text-muted-foreground font-normal">({t("user-mgmt-you")})</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">{t("user-mgmt-id")} #{user.id}</div>
                      </div>
                    </div>

                    {/* Role badge + expand chevron */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={`text-xs font-semibold ${meta.cls}`}>
                        <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${meta.dotCls}`} />
                        {t(`role-${meta.label.toLowerCase()}`)}
                      </Badge>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* ── Expanded detail panel ── */}
                  {isExpanded && (
                    <div className="border-t bg-muted/20 px-4 pb-4 pt-3 space-y-4">
                      {/* Info grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        <div className="space-y-0.5">
                          <p className="text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> {t("user-mgmt-username")}</p>
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium">{user.username}</p>
                            {!isSelf && (
                              <button
                                type="button"
                                className="text-muted-foreground hover:text-primary transition-colors"
                                title={t("user-mgmt-edit-username")}
                                onClick={e => { e.stopPropagation(); setEditUsernameId(isEditingName ? null : user.id); setEditRoleId(null); setResetPwId(null); }}
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-muted-foreground flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> {t("user-mgmt-role")}</p>
                          <p className="font-medium capitalize">{t(`role-${user.role}`)}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> {t("user-mgmt-created")}</p>
                          <p className="font-medium">{fmt(user.createdAt)}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-muted-foreground flex items-center gap-1"><KeyRound className="h-3 w-3" /> {t("user-mgmt-pw-last-changed")}</p>
                          <p className="font-medium">{user.passwordChangedAt ? timeAgo(user.passwordChangedAt) : t("user-mgmt-never-changed")}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {t("user-mgmt-last-seen")}</p>
                          <p className="font-medium">{timeAgo(user.lastSeen)}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-muted-foreground">{t("user-mgmt-shop-id")}</p>
                          <p className="font-medium">{user.shop_id ?? '—'}</p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {/* Change role */}
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <select
                              defaultValue={user.role}
                              id={`role-sel-${user.id}`}
                              className="h-8 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                              <option value="worker">{t("role-worker")}</option>
                              <option value="owner">{t("role-owner")}</option>
                              <option value="admin">{t("role-admin")}</option>
                            </select>
                            <Button size="sm" className="h-8 px-2" disabled={savingRole === user.id} onClick={() => {
                              const sel = document.getElementById(`role-sel-${user.id}`) as HTMLSelectElement;
                              handleRoleSave(user.id, sel.value);
                            }}>
                              {savingRole === user.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditRoleId(null)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={e => { e.stopPropagation(); setEditRoleId(user.id); setResetPwId(null); }}>
                            <Shield className="h-3.5 w-3.5 mr-1" /> {t("user-mgmt-change-role")}
                          </Button>
                        )}

                        {/* Reset password */}
                        {!isSelf && (
                          <Button
                            size="sm" variant="outline"
                            className="h-8 text-xs border-yellow-400 text-yellow-700 hover:bg-yellow-50"
                            onClick={e => { e.stopPropagation(); setResetPwId(isReset ? null : user.id); setEditRoleId(null); }}
                          >
                            <KeyRound className="h-3.5 w-3.5 mr-1" /> {t("user-mgmt-reset-pw")}
                          </Button>
                        )}

                        {/* Delete */}
                        {!isSelf && (
                          <Button
                            size="sm" variant="ghost"
                            className="h-8 text-xs text-destructive hover:bg-destructive/10 ml-auto"
                            onClick={e => { e.stopPropagation(); handleDelete(user.id, user.username); }}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> {t("user-mgmt-delete-user")}
                          </Button>
                        )}
                      </div>

                      {/* Inline edit username form */}
                      {isEditingName && (
                        <EditUsernameForm
                          userId={user.id}
                          currentUsername={user.username}
                          onDone={newName => handleUsernameUpdate(user.id, newName)}
                        />
                      )}

                      {/* Inline reset pw form */}
                      {isReset && (
                        <ResetPasswordForm
                          userId={user.id}
                          username={user.username}
                          onDone={() => { setResetPwId(null); fetchUsers(); }}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {users.length > 0 && (
          <p className="text-xs text-muted-foreground text-center pt-2 border-t">
            {users.length} {users.length !== 1 ? t("user-mgmt-users-total") : t("user-mgmt-user-total")}
          </p>
        )}
      </CardContent>
      {ConfirmModalElement}
    </Card>
  );
}
