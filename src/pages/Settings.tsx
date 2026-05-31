import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/theme-provider";
import { useEnhancedRBAC } from "@/contexts/EnhancedRBACContext";
import BackendSettings from "@/components/BackendSettings";
import {
  Settings as SettingsIcon,
  Monitor,
  Globe,
  Moon,
  Sun,
  Server,
  Smartphone,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { isAdmin } = useEnhancedRBAC();

  // Controlled state for mobile optimization toggles, persisted in localStorage
  const [touchOptimization, setTouchOptimization] = useState<boolean>(
    () => localStorage.getItem('settings_touchOptimization') !== 'false'
  );
  const [autoSync, setAutoSync] = useState<boolean>(
    () => localStorage.getItem('settings_autoSync') !== 'false'
  );

  const handleToggle = (key: string, setter: (v: boolean) => void, value: boolean) => {
    setter(value);
    localStorage.setItem(`settings_${key}`, String(value));
    toast({ title: 'Setting saved', description: 'Your preference has been updated.' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {t("settings")}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage your application preferences and Ubuntu-in-Termux backend configuration
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue={isAdmin ? "backend" : "appearance"} className="space-y-6">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'} bg-white/5 border border-white/10`}>
          {isAdmin && (
            <TabsTrigger value="backend" className="flex items-center gap-2 data-[state=active]:bg-brand-orange data-[state=active]:text-black">
              <Server className="h-4 w-4" />
              Backend
            </TabsTrigger>
          )}
          <TabsTrigger value="appearance" className="flex items-center gap-2 data-[state=active]:bg-brand-orange data-[state=active]:text-black">
            <Monitor className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2 data-[state=active]:bg-brand-orange data-[state=active]:text-black">
            <SettingsIcon className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Backend Settings Tab */}
        {isAdmin && (
          <TabsContent value="backend" className="space-y-6">
            <BackendSettings />
          </TabsContent>
        )}

        {/* Appearance Settings Tab */}
        <TabsContent value="appearance" className="space-y-6">
          {/* Theme Settings */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Monitor className="h-5 w-5 text-brand-orange" />
              Theme Settings
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Choose your preferred color scheme</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm text-muted-foreground">Light Mode</Label>
                  <p className="text-xs text-muted-foreground">Use light theme</p>
                </div>
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("light")}
                  className={
                    theme === "light"
                      ? "bg-brand-orange hover:bg-brand-orange-light text-black font-semibold rounded-lg cursor-pointer min-h-[44px]"
                      : "bg-white/5 hover:bg-white/10 border border-white/10 text-foreground rounded-lg cursor-pointer min-h-[44px]"
                  }
                >
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </Button>
              </div>
              <div className="border-t border-white/8" />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm text-muted-foreground">Dark Mode</Label>
                  <p className="text-xs text-muted-foreground">Use dark theme</p>
                </div>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                  className={
                    theme === "dark"
                      ? "bg-brand-orange hover:bg-brand-orange-light text-black font-semibold rounded-lg cursor-pointer min-h-[44px]"
                      : "bg-white/5 hover:bg-white/10 border border-white/10 text-foreground rounded-lg cursor-pointer min-h-[44px]"
                  }
                >
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </Button>
              </div>
              <div className="border-t border-white/8" />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm text-muted-foreground">System</Label>
                  <p className="text-xs text-muted-foreground">Follow system preference</p>
                </div>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("system")}
                  className={
                    theme === "system"
                      ? "bg-brand-orange hover:bg-brand-orange-light text-black font-semibold rounded-lg cursor-pointer min-h-[44px]"
                      : "bg-white/5 hover:bg-white/10 border border-white/10 text-foreground rounded-lg cursor-pointer min-h-[44px]"
                  }
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  System
                </Button>
              </div>
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

        {/* System Settings Tab */}
        <TabsContent value="system" className="space-y-6">
          {/* App Information */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-brand-orange" />
              App Information
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Version and system details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Version</Label>
                <p className="text-base font-semibold text-white mt-1">v1.0.0</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Build</Label>
                <p className="text-base font-semibold text-white mt-1">#20240115.1</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Platform</Label>
                <p className="text-base font-semibold text-white mt-1">
                  {navigator.platform || "Web"}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Last Updated</Label>
                <p className="text-base font-semibold text-white mt-1">Jan 15, 2024</p>
              </div>
            </div>
          </div>

          {/* Mobile Optimization */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-brand-orange" />
              Mobile Optimization
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Settings optimized for mobile devices and Ubuntu-in-Termux
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm text-muted-foreground">Touch Optimization</Label>
                  <p className="text-xs text-muted-foreground">Optimize interface for touch devices</p>
                </div>
                <Switch
                  checked={touchOptimization}
                  onCheckedChange={(v) => handleToggle('touchOptimization', setTouchOptimization, v)}
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
                  onCheckedChange={(v) => handleToggle('autoSync', setAutoSync, v)}
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
