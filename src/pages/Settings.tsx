import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/contexts/AuthContext";
import BackendSettings from "@/components/BackendSettings";
import { AspectRatio } from "@/components/ui/aspect-ratio";
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
  Building2,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { FieldInputGroup } from "@/components/ui/field-input-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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

// BUG 4 FIX: removed hardcoded BASE URL and raw fetch() in favour of apiClient
// which uses the correct env-based URL, retries, and auth headers automatically.

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


      {success && (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-5 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-200">
          <ShieldCheck className="h-5 w-5 shrink-0" />
          {t("pw-success-toast-desc")}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current password */}
        <FieldInputGroup
          label={t("current-password")}
          name="current-password"
          type="password"
          placeholder={t("enter-current-password")}
          value={current}
          onChange={setCurrent}
          required
        />

        {/* New password */}
        <div className="space-y-2">
          <FieldInputGroup
            label={t("new-password")}
            name="new-password"
            type="password"
            placeholder={t("enter-new-password")}
            value={next}
            onChange={setNext}
            required
          />
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
          <FieldInputGroup
            label={t("confirm-new-password")}
            name="confirm-password"
            type="password"
            placeholder={t("re-enter-new-password")}
            value={confirm}
            onChange={setConfirm}
            error={mismatch ? t("mismatch-error") : undefined}
            required
          />
        </div>

        <Button
          type="submit"
          loading={busy}
          disabled={mismatch}
          className="w-full min-h-[48px] rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-black font-semibold shadow-md active:scale-[0.98] transition-all"
        >
          {success ? (
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
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const [touchOptimization, setTouchOptimization] = useState<boolean>(
    () => localStorage.getItem("settings_touchOptimization") !== "false"
  );
  const [autoSync, setAutoSync] = useState<boolean>(
    () => localStorage.getItem("settings_autoSync") !== "false"
  );

  const [shopLogo, setShopLogo] = useState<string | null>(
    () => localStorage.getItem("settings_shopLogo")
  );

  const handleShopLogoUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setShopLogo(base64);
          localStorage.setItem("settings_shopLogo", base64);
          toast({ title: t("setting-saved"), description: "Shop logo updated successfully." });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleRemoveShopLogo = () => {
    setShopLogo(null);
    localStorage.removeItem("settings_shopLogo");
    toast({ title: t("setting-saved"), description: "Shop logo removed." });
  };

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

        </div>
      </div>

      {/* Desktop view: Tabs */}
      <div className="hidden sm:block">
        <Tabs defaultValue="password" className="space-y-6">
          {/* Navigation Tabs Bar */}
          <TabsList className={`flex overflow-x-auto flex-nowrap justify-start snap-x snap-mandatory sm:grid w-full sm:grid-cols-${tabCount} bg-muted/30 border border-border p-1 rounded-2xl min-h-[50px] no-scrollbar gap-1 sm:gap-0`}>
            <TabsTrigger
              value="password"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl data-[state=active]:bg-brand-orange data-[state=active]:text-black text-xs sm:text-sm font-semibold transition-all cursor-pointer py-2.5 px-4 shrink-0 whitespace-nowrap snap-center"
            >
              <KeyRound className="h-4 w-4 shrink-0" />
              <span>{t("change-password")}</span>
            </TabsTrigger>

            <TabsTrigger
              value="appearance"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl data-[state=active]:bg-brand-orange data-[state=active]:text-black text-xs sm:text-sm font-semibold transition-all cursor-pointer py-2.5 px-4 shrink-0 whitespace-nowrap snap-center"
            >
              <Monitor className="h-4 w-4 shrink-0" />
              <span>{t("appearance")}</span>
            </TabsTrigger>

            <TabsTrigger
              value="system"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl data-[state=active]:bg-brand-orange data-[state=active]:text-black text-xs sm:text-sm font-semibold transition-all cursor-pointer py-2.5 px-4 shrink-0 whitespace-nowrap snap-center"
            >
              <SettingsIcon className="h-4 w-4 shrink-0" />
              <span>{t("system")}</span>
            </TabsTrigger>

            {isAdmin && (
              <TabsTrigger
                value="backend"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl data-[state=active]:bg-brand-orange data-[state=active]:text-black text-xs sm:text-sm font-semibold transition-all cursor-pointer py-2.5 px-4 shrink-0 whitespace-nowrap snap-center"
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

              {/* Shop Logo Card */}
              <div className="rounded-2xl border border-border bg-card/65 backdrop-blur-md p-6 shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-xl flex flex-col items-center">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-orange to-[#e8a07a]" />
                <h2 className="text-base sm:text-lg font-bold text-foreground mb-4 w-full flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-brand-orange" />
                  Shop Logo
                </h2>
                <div className="w-24 h-24 relative mb-4">
                  <AspectRatio ratio={1} className="w-full h-full rounded-xl border border-border overflow-hidden bg-muted flex items-center justify-center shadow-sm">
                    {shopLogo ? (
                      <img src={shopLogo} alt="Shop Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="h-10 w-10 text-muted-foreground/50" />
                    )}
                  </AspectRatio>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleShopLogoUpload} className="min-h-[40px] px-3">
                    Upload
                  </Button>
                  {shopLogo && (
                    <Button variant="ghost" size="icon" onClick={handleRemoveShopLogo} className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
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

      {/* Mobile view: Accordion */}
      <div className="block sm:hidden">
        <Accordion type="single" collapsible defaultValue="password" className="w-full space-y-3">
          <AccordionItem value="password" className="border border-border rounded-xl overflow-hidden bg-card/65 backdrop-blur-md">
            <AccordionTrigger className="px-5 py-4 hover:no-underline font-bold text-sm text-foreground flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-brand-orange shrink-0 animate-pulse" />
              <span>{t("change-password")}</span>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 pt-2">
              <ChangePasswordPanel />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="appearance" className="border border-border rounded-xl overflow-hidden bg-card/65 backdrop-blur-md">
            <AccordionTrigger className="px-5 py-4 hover:no-underline font-bold text-sm text-foreground flex items-center gap-2">
              <Monitor className="h-4 w-4 text-brand-orange shrink-0" />
              <span>{t("appearance")}</span>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 pt-2 space-y-6">
              {/* Theme Settings */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("theme-settings")}</h3>
                <div className="flex flex-col gap-3">
                  {[
                    { id: "light", icon: Sun, label: t("light-mode") },
                    { id: "dark", icon: Moon, label: t("dark-mode") },
                    { id: "system", icon: Monitor, label: t("system-mode") }
                  ].map(item => {
                    const Icon = item.icon;
                    const isSelected = theme === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setTheme(item.id as any)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? "border-brand-orange bg-brand-orange/5"
                            : "border-border bg-background/20"
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${isSelected ? "text-brand-orange" : "text-muted-foreground"}`} />
                        <span className="font-semibold text-sm text-foreground">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language Settings */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("language-settings")}</h3>
                <div className="flex flex-col gap-3">
                  {[
                    { id: "en", flag: "🇺🇸", label: "English" },
                    { id: "te", flag: "🇮🇳", label: "తెలుగు (Telugu)" }
                  ].map(item => {
                    const isSelected = language === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setLanguage(item.id as any)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? "border-brand-orange bg-brand-orange/5"
                            : "border-border bg-background/20"
                        }`}
                      >
                        <span className="text-xl shrink-0">{item.flag}</span>
                        <span className="font-semibold text-sm text-foreground">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="system" className="border border-border rounded-xl overflow-hidden bg-card/65 backdrop-blur-md">
            <AccordionTrigger className="px-5 py-4 hover:no-underline font-bold text-sm text-foreground flex items-center gap-2">
              <SettingsIcon className="h-4 w-4 text-brand-orange shrink-0" />
              <span>{t("system")}</span>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 pt-2 space-y-6">
              {/* App Info */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("app-information")}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: t("version"), value: "v2.1.0" },
                    { label: t("build"), value: "#20260531" },
                    { label: t("platform"), value: navigator.platform || "Web" },
                    { label: t("last-updated"), value: "May 31, 2026" },
                  ].map(item => (
                    <div key={item.label} className="p-3 rounded-xl bg-background/45 border border-border/50">
                      <Label className="text-xs text-muted-foreground">{item.label}</Label>
                      <p className="text-xs font-bold text-foreground mt-1 truncate">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Optimization */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("mobile-optimization")}</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-background/45 border border-border/50">
                    <div className="space-y-0.5 min-w-0">
                      <Label className="text-sm font-bold text-foreground">{t("touch-optimization")}</Label>
                      <p className="text-[10px] text-muted-foreground">{t("touch-optimization-desc")}</p>
                    </div>
                    <Switch
                      checked={touchOptimization}
                      onCheckedChange={v => handleToggle("touchOptimization", setTouchOptimization, v)}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-background/45 border border-border/50">
                    <div className="space-y-0.5 min-w-0">
                      <Label className="text-sm font-bold text-foreground">{t("auto-sync")}</Label>
                      <p className="text-[10px] text-muted-foreground">{t("auto-sync-desc")}</p>
                    </div>
                    <Switch
                      checked={autoSync}
                      onCheckedChange={v => handleToggle("autoSync", setAutoSync, v)}
                    />
                  </div>
                </div>
              </div>

              {/* Shop Logo */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Shop Logo</h3>
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-background/45 border border-border/50">
                  <div className="w-16 h-16 relative shrink-0">
                    <AspectRatio ratio={1} className="w-full h-full rounded-xl border border-border overflow-hidden bg-muted flex items-center justify-center shadow-sm">
                      {shopLogo ? (
                        <img src={shopLogo} alt="Shop Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="h-7 w-7 text-muted-foreground/50" />
                      )}
                    </AspectRatio>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleShopLogoUpload} className="min-h-[44px] px-3">
                      Upload
                    </Button>
                    {shopLogo && (
                      <Button variant="ghost" size="icon" onClick={handleRemoveShopLogo} className="h-11 w-11 text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {isAdmin && (
            <AccordionItem value="backend" className="border border-border rounded-xl overflow-hidden bg-card/65 backdrop-blur-md">
              <AccordionTrigger className="px-5 py-4 hover:no-underline font-bold text-sm text-foreground flex items-center gap-2">
                <Server className="h-4 w-4 text-brand-orange shrink-0" />
                <span>{t("backend")}</span>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 pt-2">
                <BackendSettings />
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>
    </div>
  );
}
