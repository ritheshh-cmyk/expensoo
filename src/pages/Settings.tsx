import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/theme-provider";
import { useEnhancedRBAC } from "@/contexts/EnhancedRBACContext";
import { useAuth } from "@/contexts/AuthContext";
import BackendSettings from "@/components/BackendSettings";
import {
  Settings as SettingsIcon,
  Monitor,
  Globe,
  Moon,
  Sun,
  Server,
  Smartphone,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = "https://backendmobile-4swg.onrender.com";
const getToken = () =>
  localStorage.getItem("auth_token") ?? localStorage.getItem("token") ?? "";

// ── Password-strength metre ──────────────────────────────────────────────────
function strengthLevel(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 3) return { score, label: "Fair", color: "bg-yellow-500" };
  return { score, label: "Strong", color: "bg-green-500" };
}

// ── Change-Password panel (visible to all users) ─────────────────────────────
function ChangePasswordPanel() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [current, setCurrent]   = useState("");
  const [next, setNext]         = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showCurrent, setShowC] = useState(false);
  const [showNext, setShowN]    = useState(false);
  const [busy, setBusy]         = useState(false);
  const [success, setSuccess]   = useState(false);

  const strength = strengthLevel(next);
  const mismatch = confirm.length > 0 && next !== confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current || !next || !confirm) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }
    if (next !== confirm) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (next.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (!/[0-9]/.test(next)) {
      toast({ title: "Password must contain at least one number", variant: "destructive" });
      return;
    }
    if (!/[^A-Za-z0-9]/.test(next)) {
      toast({ title: "Password must contain at least one special character (#@!...)", variant: "destructive" });
      return;
    }

    setBusy(true);
    try {
      // Single call: PUT /users/me with currentPassword + newPassword for backend to verify
      const updateRes = await fetch(`${BASE}/api/auth/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ currentPassword: current, password: next }),
      });
      const data = await updateRes.json().catch(() => ({}));
      if (!updateRes.ok) throw new Error(data.error || 'Failed to update password');

      setSuccess(true);
      setCurrent(''); setNext(''); setConfirm('');
      toast({ title: 'Password changed!', description: 'Your password has been updated successfully.' });
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
      <h2 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-brand-orange" />
        Change Password
      </h2>
      <p className="text-sm text-muted-foreground mb-5">
        Min 8 characters · at least one number · one special character
      </p>

      {success && (
        <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3 mb-4 text-sm font-medium">
          <ShieldCheck className="h-4 w-4" />
          Password updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current password */}
        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">Current Password</Label>
          <div className="relative">
            <Input
              type={showCurrent ? "text" : "password"}
              placeholder="Enter your current password"
              value={current}
              onChange={e => setCurrent(e.target.value)}
              className="pr-10 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground min-h-[48px]"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
              onClick={() => setShowC(v => !v)}
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* New password */}
        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">New Password</Label>
          <div className="relative">
            <Input
              type={showNext ? "text" : "password"}
              placeholder="Enter new password"
              value={next}
              onChange={e => setNext(e.target.value)}
              className="pr-10 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground min-h-[48px]"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
              onClick={() => setShowN(v => !v)}
            >
              {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {/* Strength bar */}
          {next && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= strength.score ? strength.color : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs font-medium ${
                strength.label === "Strong" ? "text-green-400" :
                strength.label === "Fair"   ? "text-yellow-400" : "text-red-400"
              }`}>
                {strength.label}
              </p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">Confirm New Password</Label>
          <Input
            type="password"
            placeholder="Re-enter new password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className={`bg-white/5 border-white/10 text-white placeholder:text-muted-foreground min-h-[48px] ${
              mismatch ? "border-red-500/60" : ""
            }`}
            required
          />
          {mismatch && (
            <p className="text-xs text-red-400">Passwords do not match</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={busy || mismatch}
          className="w-full min-h-[48px] bg-brand-orange hover:bg-brand-orange-light text-black font-semibold"
        >
          {busy ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating…</>
          ) : success ? (
            <><Check className="h-4 w-4 mr-2" /> Done!</>
          ) : (
            <><KeyRound className="h-4 w-4 mr-2" /> Update Password</>
          )}
        </Button>
      </form>
    </div>
  );
}

// ── Main Settings page ───────────────────────────────────────────────────────
export default function Settings() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { isAdmin } = useEnhancedRBAC();

  const [touchOptimization, setTouchOptimization] = useState<boolean>(
    () => localStorage.getItem("settings_touchOptimization") !== "false"
  );
  const [autoSync, setAutoSync] = useState<boolean>(
    () => localStorage.getItem("settings_autoSync") !== "false"
  );

  const handleToggle = (key: string, setter: (v: boolean) => void, value: boolean) => {
    setter(value);
    localStorage.setItem(`settings_${key}`, String(value));
    toast({ title: "Setting saved", description: "Your preference has been updated." });
  };

  // Tab list: password tab is always visible, backend only for admin
  const tabCount = isAdmin ? 4 : 3;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">{t("settings")}</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage preferences, change password and backend configuration
        </p>
      </div>

      <Tabs defaultValue="password" className="space-y-6">
        <TabsList className={`grid w-full grid-cols-${tabCount} bg-white/5 border border-white/10`}>
          {/* Password — always first and most visible */}
          <TabsTrigger
            value="password"
            className="flex items-center gap-1.5 data-[state=active]:bg-brand-orange data-[state=active]:text-black text-xs sm:text-sm"
          >
            <KeyRound className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Password</span>
            <span className="sm:hidden">PW</span>
          </TabsTrigger>

          <TabsTrigger
            value="appearance"
            className="flex items-center gap-1.5 data-[state=active]:bg-brand-orange data-[state=active]:text-black text-xs sm:text-sm"
          >
            <Monitor className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Appearance</span>
            <span className="sm:hidden">Theme</span>
          </TabsTrigger>

          <TabsTrigger
            value="system"
            className="flex items-center gap-1.5 data-[state=active]:bg-brand-orange data-[state=active]:text-black text-xs sm:text-sm"
          >
            <SettingsIcon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">System</span>
            <span className="sm:hidden">Sys</span>
          </TabsTrigger>

          {isAdmin && (
            <TabsTrigger
              value="backend"
              className="flex items-center gap-1.5 data-[state=active]:bg-brand-orange data-[state=active]:text-black text-xs sm:text-sm"
            >
              <Server className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Backend</span>
              <span className="sm:hidden">API</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── Password Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="password" className="space-y-6">
          <ChangePasswordPanel />
        </TabsContent>

        {/* ── Appearance Tab ───────────────────────────────────────────────── */}
        <TabsContent value="appearance" className="space-y-6">
          {/* Theme Settings */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Monitor className="h-5 w-5 text-brand-orange" />
              Theme Settings
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Choose your preferred color scheme</p>
            <div className="space-y-4">
              {(["light", "dark", "system"] as const).map((t, i) => (
                <div key={t}>
                  {i > 0 && <div className="border-t border-white/8 mb-4" />}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm text-muted-foreground capitalize">{t === "system" ? "System" : t === "light" ? "Light Mode" : "Dark Mode"}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t === "light" ? "Use light theme" : t === "dark" ? "Use dark theme" : "Follow system preference"}
                      </p>
                    </div>
                    <Button
                      variant={theme === t ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme(t)}
                      className={
                        theme === t
                          ? "bg-brand-orange hover:bg-brand-orange-light text-black font-semibold rounded-lg cursor-pointer min-h-[44px]"
                          : "bg-white/5 hover:bg-white/10 border border-white/10 text-foreground rounded-lg cursor-pointer min-h-[44px]"
                      }
                    >
                      {t === "light" ? <Sun className="mr-2 h-4 w-4" /> : t === "dark" ? <Moon className="mr-2 h-4 w-4" /> : <Monitor className="mr-2 h-4 w-4" />}
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Language Settings */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-brand-orange" />
              Language Settings
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Choose your preferred language</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm text-muted-foreground">English</Label>
                  <p className="text-xs text-muted-foreground">Use English interface</p>
                </div>
                <Button
                  variant={language === "en" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLanguage("en")}
                  className={
                    language === "en"
                      ? "bg-brand-orange hover:bg-brand-orange-light text-black font-semibold rounded-lg cursor-pointer min-h-[44px]"
                      : "bg-white/5 hover:bg-white/10 border border-white/10 text-foreground rounded-lg cursor-pointer min-h-[44px]"
                  }
                >
                  🇺🇸 English
                </Button>
              </div>
              <div className="border-t border-white/8" />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm text-muted-foreground">తెలుగు</Label>
                  <p className="text-xs text-muted-foreground">తెలుగు భాషలో ఉపయోగించండి</p>
                </div>
                <Button
                  variant={language === "te" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLanguage("te")}
                  className={
                    language === "te"
                      ? "bg-brand-orange hover:bg-brand-orange-light text-black font-semibold rounded-lg cursor-pointer min-h-[44px]"
                      : "bg-white/5 hover:bg-white/10 border border-white/10 text-foreground rounded-lg cursor-pointer min-h-[44px]"
                  }
                >
                  🇮🇳 తెలుగు
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── System Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="system" className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-brand-orange" />
              App Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Version", value: "v2.1.0" },
                { label: "Build", value: "#20260531" },
                { label: "Platform", value: navigator.platform || "Web" },
                { label: "Last Updated", value: "May 31, 2026" },
              ].map(item => (
                <div key={item.label}>
                  <Label className="text-sm text-muted-foreground">{item.label}</Label>
                  <p className="text-base font-semibold text-white mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-brand-orange" />
              Mobile Optimization
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm text-muted-foreground">Touch Optimization</Label>
                  <p className="text-xs text-muted-foreground">Optimize interface for touch devices</p>
                </div>
                <Switch
                  checked={touchOptimization}
                  onCheckedChange={v => handleToggle("touchOptimization", setTouchOptimization, v)}
                />
              </div>
              <div className="border-t border-white/8" />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm text-muted-foreground">Auto Sync</Label>
                  <p className="text-xs text-muted-foreground">Automatically sync when connection is restored</p>
                </div>
                <Switch
                  checked={autoSync}
                  onCheckedChange={v => handleToggle("autoSync", setAutoSync, v)}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Backend Tab (admin only) ─────────────────────────────────────── */}
        {isAdmin && (
          <TabsContent value="backend" className="space-y-6">
            <BackendSettings />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
