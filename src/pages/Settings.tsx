import { AppLayout } from "@/components/layout/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/theme-provider";
import BackendSettings from "@/components/BackendSettings";
import {
  Settings as SettingsIcon,
  User,
  Globe,
  Moon,
  Sun,
  Monitor,
  Bell,
  Database,
  Shield,
  Server,
  Smartphone,
} from "lucide-react";

export default function Settings() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t("settings")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your application preferences and Ubuntu-in-Termux backend configuration
          </p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="backend" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="backend" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Backend
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          {/* Backend Settings Tab */}
          <TabsContent value="backend" className="space-y-6">
            <BackendSettings />
          </TabsContent>

          {/* Appearance Settings Tab */}
          <TabsContent value="appearance" className="space-y-6">
        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Theme Settings
            </CardTitle>
            <CardDescription>
              Choose your preferred color scheme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Light Mode</Label>
                <p className="text-sm text-muted-foreground">Use light theme</p>
              </div>
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
              >
                <Sun className="mr-2 h-4 w-4" />
                Light
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Use dark theme</p>
              </div>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
              >
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">System</Label>
                <p className="text-sm text-muted-foreground">
                  Follow system preference
                </p>
              </div>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("system")}
              >
                <Monitor className="mr-2 h-4 w-4" />
                System
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Language Settings
            </CardTitle>
            <CardDescription>Choose your preferred language</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">English</Label>
                <p className="text-sm text-muted-foreground">
                  Use English interface
                </p>
              </div>
              <Button
                variant={language === "en" ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage("en")}
              >
                🇺🇸 English
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">తెలుగు</Label>
                <p className="text-sm text-muted-foreground">
                  తెలుగు భాషలో ఉపయోగించండి
                </p>
              </div>
              <Button
                variant={language === "te" ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage("te")}
              >
                🇮🇳 తెలుగు
              </Button>
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          {/* System Settings Tab */}
          <TabsContent value="system" className="space-y-6">
        {/* App Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              App Information
            </CardTitle>
            <CardDescription>Version and system details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Version
                </Label>
                <p className="text-base font-semibold">v1.0.0</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Build
                </Label>
                <p className="text-base font-semibold">#20240115.1</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Platform
                </Label>
                <p className="text-base font-semibold">
                  {navigator.platform || "Web"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </Label>
                <p className="text-base font-semibold">Jan 15, 2024</p>
              </div>
            </div>
          </CardContent>
        </Card>

            {/* Mobile Optimization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Mobile Optimization
                </CardTitle>
                <CardDescription>
                  Settings optimized for mobile devices and Ubuntu-in-Termux
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Touch Optimization</Label>
                    <p className="text-sm text-muted-foreground">
                      Optimize interface for touch devices
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Offline Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable offline data caching
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Auto Sync</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically sync when connection is restored
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
