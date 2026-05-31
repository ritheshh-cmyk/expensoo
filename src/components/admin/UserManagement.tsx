import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import {
  Shield, Trash2, RefreshCw, UserPlus, KeyRound,
  ChevronDown, Check, X, Eye, EyeOff, Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const BASE = 'https://backendmobile-4swg.onrender.com';

// ── Token helper — reads the correct key written by api.ts ───────────────────
const getToken = () =>
  localStorage.getItem('auth_token') ??
  localStorage.getItem('token') ??
  '';

// ── Role badge colour map ─────────────────────────────────────────────────────
const roleMeta: Record<string, { label: string; cls: string }> = {
  admin:  { label: 'Admin',  cls: 'bg-red-500/10 text-red-500 border-red-500/20' },
  owner:  { label: 'Owner',  cls: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  worker: { label: 'Worker', cls: 'bg-green-500/10 text-green-600 border-green-500/20' },
};

// ── Sub-form: Create User ─────────────────────────────────────────────────────
function CreateUserForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen]         = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState<'admin' | 'owner' | 'worker'>('worker');
  const [showPw, setShowPw]     = useState(false);
  const [busy, setBusy]         = useState(false);
  const [err, setErr]           = useState('');

  const submit = async () => {
    setErr('');
    if (!username.trim() || !password.trim()) {
      setErr('Username and password are required');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${BASE}/api/auth/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ username: username.trim(), password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      toast({ title: 'User created', description: `${username} (${role}) added successfully` });
      setOpen(false);
      setUsername(''); setPassword(''); setRole('worker');
      onCreated();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4 mr-1.5" />
        Create User
      </Button>
    );
  }

  return (
    <div className="border rounded-xl p-4 bg-muted/30 space-y-3 mt-4">
      <p className="font-semibold text-sm">New User</p>
      {err && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">{err}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          autoFocus
        />
        <div className="relative">
          <Input
            type={showPw ? 'text' : 'password'}
            placeholder="Password (8+ chars, #, num)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="pr-9"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPw(v => !v)}
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <select
          value={role}
          onChange={e => setRole(e.target.value as any)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="worker">Worker</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
          Create
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setOpen(false); setErr(''); }}>
          <X className="h-4 w-4 mr-1" /> Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Sub-form: Reset Password ──────────────────────────────────────────────────
function ResetPasswordForm({
  userId,
  username,
  onDone,
}: {
  userId: number;
  username: string;
  onDone: () => void;
}) {
  const [pw, setPw]       = useState('');
  const [showPw, setShow] = useState(false);
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState('');

  const submit = async () => {
    setErr('');
    setBusy(true);
    try {
      const res = await fetch(`${BASE}/api/auth/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ newPassword: pw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast({ title: 'Password reset', description: `${username}'s password was reset` });
      onDone();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-2 p-3 bg-muted/40 rounded-lg border">
      <p className="text-xs font-medium text-muted-foreground">Force-reset password for <strong>{username}</strong></p>
      {err && <p className="text-xs text-red-500">{err}</p>}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={showPw ? 'text' : 'password'}
            placeholder="New password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            className="pr-9 h-9 text-sm"
            autoFocus
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            onClick={() => setShow(v => !v)}
          >
            {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
        <Button size="sm" className="h-9" onClick={submit} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </Button>
        <Button size="sm" variant="ghost" className="h-9" onClick={onDone}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Main UserManagement component ─────────────────────────────────────────────
export function UserManagement() {
  const { user: me } = useAuth();
  const [users, setUsers]           = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [editRoleId, setEditRoleId] = useState<number | null>(null);
  const [resetPwId, setResetPwId]   = useState<number | null>(null);
  const [savingRole, setSavingRole] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/auth/users`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.data ?? []);
    } catch (e: any) {
      setError(e.message);
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async (id: number, username: string) => {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${BASE}/api/auth/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Failed to delete');
      toast({ title: 'Deleted', description: `${username} removed` });
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleRoleSave = async (id: number, newRole: string) => {
    setSavingRole(id);
    try {
      const res = await fetch(`${BASE}/api/auth/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Failed to update role');
      toast({ title: 'Role updated', description: `Role changed to ${newRole}` });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
      setEditRoleId(null);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSavingRole(null);
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-start justify-between gap-4 flex-wrap">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            User Management
          </CardTitle>
          <CardDescription>
            Create users, change roles, reset passwords, delete accounts
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Create User form */}
        <CreateUserForm onCreated={fetchUsers} />

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">No users found.</p>
        ) : (
          <div className="space-y-2">
            {users.map(user => {
              const meta = roleMeta[user.role?.toLowerCase()] ?? roleMeta.worker;
              const isSelf = me?.id === String(user.id) || me?.username === user.username;
              const isEditingRole  = editRoleId  === user.id;
              const isResettingPw  = resetPwId   === user.id;

              return (
                <div
                  key={user.id}
                  className="border rounded-xl p-4 space-y-2 hover:bg-muted/30 transition-colors"
                >
                  {/* Main row */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary uppercase">
                        {user.username?.[0] ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">
                          {user.username}
                          {isSelf && (
                            <span className="ml-2 text-xs text-muted-foreground font-normal">(you)</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">ID #{user.id}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {/* Role badge / inline editor */}
                      {isEditingRole ? (
                        <div className="flex items-center gap-1">
                          <select
                            defaultValue={user.role}
                            id={`role-select-${user.id}`}
                            className="h-8 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            <option value="worker">Worker</option>
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                          </select>
                          <Button
                            size="sm"
                            className="h-8 px-2"
                            disabled={savingRole === user.id}
                            onClick={() => {
                              const sel = document.getElementById(`role-select-${user.id}`) as HTMLSelectElement;
                              handleRoleSave(user.id, sel.value);
                            }}
                          >
                            {savingRole === user.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Check className="h-3.5 w-3.5" />}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditRoleId(null)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <Badge
                          variant="outline"
                          className={`cursor-pointer text-xs ${meta.cls}`}
                          title="Click to change role"
                          onClick={() => {
                            setEditRoleId(user.id);
                            setResetPwId(null);
                          }}
                        >
                          {meta.label}
                          <ChevronDown className="h-3 w-3 ml-1 opacity-60" />
                        </Badge>
                      )}

                      {/* Reset password */}
                      {!isSelf && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            setResetPwId(isResettingPw ? null : user.id);
                            setEditRoleId(null);
                          }}
                        >
                          <KeyRound className="h-3.5 w-3.5 mr-1" />
                          Reset PW
                        </Button>
                      )}

                      {/* Delete */}
                      {!isSelf && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                          title="Delete user"
                          onClick={() => handleDelete(user.id, user.username)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Inline reset password form */}
                  {isResettingPw && (
                    <ResetPasswordForm
                      userId={user.id}
                      username={user.username}
                      onDone={() => setResetPwId(null)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center pt-2">
          {users.length} user{users.length !== 1 ? 's' : ''} total
        </p>
      </CardContent>
    </Card>
  );
}
