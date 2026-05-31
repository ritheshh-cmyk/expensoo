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
  SmartphoneNfc,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = "https://backendmobile-4swg.onrender.com";
const getToken = () =>
  localStorage.getItem("auth_token") ?? localStorage.getItem("token") ?? "";

// ── Password-strength metre ──────────────────────────────────────────────────
function strengthLevel(pw: string, t: (key: string) => string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (score <= 1) return { score, label: t("strength-weak"), color: "bg-red-500" };
  if (score <= 3) return { score, label: t("strength-fair"), color: "bg-yellow-500" };
  return { score, label: t("strength-strong"), color: "bg-green-500" };
}

// ── Change-Password panel (visible to all users) ─────────────────────────────
function ChangePasswordPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [current, setCurrent]   = useState("");
  const [next, setNext]         = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showCurrent, setShowC] = useState(false);
  const [showNext, setShowN]    = useState(false);
  const [busy, setBusy]         = useState(false);
  const [success, setSuccess]   = useState(false);

  const strength = strengthLevel(next, t);
  const mismatch = confirm.length > 0 && next !== confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current || !next || !confirm) {
      toast({ title: t("req-fields-error"), variant: "destructive" });
      return;
    }
    if (next !== confirm) {
      toast({ title: t("mismatch-error"), variant: "destructive" });
      return;
    }
    if (next.length < 8) {
      toast({ title: t("min-char-error"), variant: "destructive" });
      return;
    }
    if (!/[0-9]/.test(next)) {
      toast({ title: t("num-error"), variant: "destructive" });
      return;
    }
    if (!/[^A-Za-z0-9]/.test(next)) {
      toast({ title: t("spec-error"), variant: "destructive" });
      return;
    }

    setBusy(true);
    try {
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
      toast({ title: t("pw-success-toast"), description: t("pw-success-toast-desc") });
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      toast({ title: t("error-label"), description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card/65 backdrop-blur-md p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-brand-orange/20 relative overflow-hidden">
      {/* Visual top bar glow */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-orange to-[#e8a07a]" />
      
      <h2 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-brand-orange animate-pulse" />
        {t("change-password")}
      </h2>
      <p className="text-xs sm:text-sm text-muted-foreground mb-6">
        {t("pw-requirements-desc")}
      </p>

      {success && (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-5 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-200">
          <ShieldCheck className="h-5 w-5 shrink-0" />
          {t("pw-success-toast-desc")}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current password */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">{t("current-password")}</Label>
          <div className="relative">
            <Input
              type={showCurrent ? "text" : "password"}
              placeholder={t("enter-current-password")}
              value={current}
              onChange={e => setCurrent(e.target.value)}
              className="pr-10 bg-background/50 border-border text-foreground placeholder:text-muted-foreground min-h-[48px] rounded-xl focus:border-brand-orange focus:ring-brand-orange/10"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md"
              onClick={() => setShowC(v => !v)}
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* New password */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">{t("new-password")}</Label>
          <div className="relative">
            <Input
              type={showNext ? "text" : "password"}
              placeholder={t("enter-new-password")}
              value={next}
              onChange={e => setNext(e.target.value)}
              className="pr-10 bg-background/50 border-border text-foreground placeholder:text-muted-foreground min-h-[48px] rounded-xl focus:border-brand-orange focus:ring-brand-orange/10"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md"
              onClick={() => setShowN(v => !v)}
            >
              {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {/* Strength bar */}
          {next && (
            <div className="space-y-2 pt-1 animate-in fade-in duration-200">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      i <= strength.score ? strength.color : "bg-muted/60"
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs font-semibold ${
                strength.score >= 4 ? "text-green-500" :
                strength.score >= 2   ? "text-yellow-500" : "text-red-500"
              }`}>
                {strength.label}
              </p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">{t("confirm-new-password")}</Label>
          <Input
            type="password"
            placeholder={t("re-enter-new-password")}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className={`bg-background/50 border-border text-foreground placeholder:text-muted-foreground min-h-[48px] rounded-xl focus:border-brand-orange focus:ring-brand-orange/10 ${
              mismatch ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/10" : ""
            }`}
            required
          />
          {mismatch && (
            <p className="text-xs text-red-500 font-medium animate-in slide-in-from-top-1 duration-150">{t("mismatch-error")}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={busy || mismatch}
          className="w-full min-h-[48px] rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-black font-semibold shadow-md active:scale-[0.98] transition-all"
        >
          {busy ? (
            <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> {t("updating-btn")}</>
          ) : success ? (
            <><Check className="h-5 w-5 mr-2" /> {t("save")}</>
          ) : (
            <><KeyRound className="h-5 w-5 mr-2" /> {t("update-password-btn")}</>
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
    toast({ title: t("setting-saved"), description: t("setting-saved-desc") });
  };

  const tabCount = isAdmin ? 4 : 3;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Premium Terracotta Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#ea580c]/10 via-[#ea580c]/5 to-transparent border border-brand-orange/15 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground font-heading flex items-center gap-3">
            <SettingsIcon className="h-8 w-8 text-brand-orange animate-spin-slow" />
            {t("settings")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
            {t("manage-preferences")}
          </p>
        </div>
      </div>

      <Tabs defaultValue="password" className="space-y-6">
        {/* Navigation Tabs Bar */}
        <TabsList className={`grid w-full grid-cols-${tabCount} bg-muted/30 border border-border p-1 rounded-2xl min-h-[50px]`}>
          <TabsTrigger
            value="password"
            className="flex items-center justify-center gap-2 rounded-xl data-[state=active]:bg-brand-orange data-[state=active]:text-black text-xs sm:text-sm font-semibold transition-all cursor-pointer py-2.5"
          >
            <KeyRound className="h-4 w-4 shrink-0" />
            <span>{t("change-password")}</span>
          </TabsTrigger>

          <TabsTrigger
            value="appearance"
            className="flex items-center justify-center gap-2 rounded-xl data-[state=active]:bg-brand-orange data-[state=active]:text-black text-xs sm:text-sm font-semibold transition-all cursor-pointer py-2.5"
          >
            <Monitor className="h-4 w-4 shrink-0" />
            <span>{t("appearance")}</span>
          </TabsTrigger>

          <TabsTrigger
            value="system"
            className="flex items-center justify-center gap-2 rounded-xl data-[state=active]:bg-brand-orange data-[state=active]:text-black text-xs sm:text-sm font-semibold transition-all cursor-pointer py-2.5"
          >
            <SettingsIcon className="h-4 w-4 shrink-0" />
            <span>{t("system")}</span>
          </TabsTrigger>

          {isAdmin && (
            <TabsTrigger
              value="backend"
              className="flex items-center justify-center gap-2 rounded-xl data-[state=active]:bg-brand-orange data-[state=active]:text-black text-xs sm:text-sm font-semibold transition-all cursor-pointer py-2.5"
            >
              <Server className="h-4 w-4 shrink-0" />
              <span>{t("backend")}</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── Password Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="password" className="space-y-6 animate-in slide-in-from-bottom-3 duration-250">
          <ChangePasswordPanel />
        </TabsContent>

        {/* ── Appearance Tab ───────────────────────────────────────────────── */}
        <TabsContent value="appearance" className="space-y-6 animate-in slide-in-from-bottom-3 duration-250">
          {/* Theme Settings card */}
          <div className="rounded-2xl border border-border bg-card/65 backdrop-blur-md p-6 shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-orange to-[#e8a07a]" />
            <h2 className="text-base sm:text-lg font-bold text-foreground mb-2 flex items-center gap-2">
              <Monitor className="h-5 w-5 text-brand-orange" />
              {t("theme-settings")}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mb-6">{t("choose-theme")}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: "light", icon: Sun, label: t("light-mode"), desc: t("use-light-theme") },
                { id: "dark", icon: Moon, label: t("dark-mode"), desc: t("use-dark-theme") },
                { id: "system", icon: Monitor, label: t("system-mode"), desc: t("follow-system-pref") }
              ].map(item => {
                const Icon = item.icon;
                const isSelected = theme === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setTheme(item.id as any)}
                    className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all cursor-pointer select-none text-center ${
                      isSelected
                        ? "border-brand-orange bg-brand-orange/5 shadow-md shadow-brand-orange/5"
                        : "border-border bg-background/40 hover:bg-muted/30"
                    }`}
                  >
                    <Icon className={`h-8 w-8 mb-3 transition-colors ${isSelected ? "text-brand-orange" : "text-muted-foreground"}`} />
                    <span className="font-semibold text-sm text-foreground">{item.label}</span>
                    <span className="text-[11px] text-muted-foreground mt-1 max-w-[120px]">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language Settings card */}
          <div className="rounded-2xl border border-border bg-card/65 backdrop-blur-md p-6 shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-orange to-[#e8a07a]" />
            <h2 className="text-base sm:text-lg font-bold text-foreground mb-2 flex items-center gap-2">
              <Globe className="h-5 w-5 text-brand-orange" />
              {t("language-settings")}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mb-6">{t("choose-language")}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: "en", flag: "🇺🇸", label: "English", desc: t("use-english-interface") },
                { id: "te", flag: "🇮🇳", label: "తెలుగు (Telugu)", desc: t("use-telugu-interface") }
              ].map(item => {
                const isSelected = language === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setLanguage(item.id as any)}
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                      isSelected
                        ? "border-brand-orange bg-brand-orange/5 shadow-md shadow-brand-orange/5"
                        : "border-border bg-background/40 hover:bg-muted/30"
                    }`}
                  >
                    <span className="text-3xl shrink-0 filter drop-shadow-sm">{item.flag}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* ── System Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="system" className="space-y-6 animate-in slide-in-from-bottom-3 duration-250">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* App Information Card */}
            <div className="rounded-2xl border border-border bg-card/65 backdrop-blur-md p-6 shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-orange to-[#e8a07a]" />
              <h2 className="text-base sm:text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-brand-orange" />
                {t("app-information")}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: t("version"), value: "v2.1.0" },
                  { label: t("build"), value: "#20260531" },
                  { label: t("platform"), value: navigator.platform || "Web" },
                  { label: t("last-updated"), value: "May 31, 2026" },
                ].map(item => (
                  <div key={item.label} className="p-3 rounded-xl bg-background/45 border border-border/50">
                    <Label className="text-xs text-muted-foreground">{item.label}</Label>
                    <p className="text-sm font-bold text-foreground mt-1 truncate">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Optimization Card */}
            <div className="rounded-2xl border border-border bg-card/65 backdrop-blur-md p-6 shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-orange to-[#e8a07a]" />
              <h2 className="text-base sm:text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-brand-orange animate-bounce-slow" />
                {t("mobile-optimization")}
              </h2>
              
              <div className="space-y-5">
                {/* Touch Optimization */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-background/45 border border-border/50">
                  <div className="space-y-0.5 min-w-0">
                    <Label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <SmartphoneNfc className="h-4 w-4 text-brand-orange/85 shrink-0" />
                      {t("touch-optimization")}
                    </Label>
                    <p className="text-xs text-muted-foreground">{t("touch-optimization-desc")}</p>
                  </div>
                  <Switch
                    checked={touchOptimization}
                    onCheckedChange={v => handleToggle("touchOptimization", setTouchOptimization, v)}
                  />
                </div>

                {/* Auto Sync */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-background/45 border border-border/50">
                  <div className="space-y-0.5 min-w-0">
                    <Label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <RefreshCw className="h-4 w-4 text-brand-orange/85 shrink-0" />
                      {t("auto-sync")}
                    </Label>
                    <p className="text-xs text-muted-foreground">{t("auto-sync-desc")}</p>
                  </div>
                  <Switch
                    checked={autoSync}
                    onCheckedChange={v => handleToggle("autoSync", setAutoSync, v)}
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Backend Tab (admin only) ─────────────────────────────────────── */}
        {isAdmin && (
          <TabsContent value="backend" className="space-y-6 animate-in slide-in-from-bottom-3 duration-250">
            <div className="rounded-2xl border border-border bg-card/65 backdrop-blur-md p-6 shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-orange to-[#e8a07a]" />
              <BackendSettings />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
