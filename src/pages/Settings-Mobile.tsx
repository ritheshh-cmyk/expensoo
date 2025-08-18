import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Settings as SettingsIcon,
  User,
  Building,
  Bell,
  Shield,
  Palette,
  Download,
  Upload,
  RefreshCw,
  Save,
  Eye,
  EyeOff,
  Phone,
  Mail,
  MapPin,
  Globe,
  Lock,
  Key,
  Smartphone,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface UserSettings {
  profile: {
    name: string;
    email: string;
    phone: string;
    role: string;
  };
  business: {
    name: string;
    address: string;
    city: string;
    pincode: string;
    gstNumber: string;
    website: string;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    weeklyReports: boolean;
    lowStockAlerts: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: string;
    passwordExpiry: string;
  };
  appearance: {
    theme: string;
    language: string;
    currency: string;
    dateFormat: string;
    timeZone: string;
  };
}

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");

  const [settings, setSettings] = useState<UserSettings>({
    profile: {
      name: user?.name || "John Doe",
      email: user?.email || "john@example.com",
      phone: "+91 98765 43210",
      role: user?.role || "owner",
    },
    business: {
      name: "CallMeMobiles Repair Center",
      address: "123 Electronic Market, Nehru Place",
      city: "New Delhi",
      pincode: "110019",
      gstNumber: "07AAACH7409R1ZZ",
      website: "www.callmemobiles.com",
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      weeklyReports: true,
      lowStockAlerts: true,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: "30",
      passwordExpiry: "90",
    },
    appearance: {
      theme: "light",
      language: "en",
      currency: "INR",
      dateFormat: "DD/MM/YYYY",
      timeZone: "Asia/Kolkata",
    },
  });

  const handleSaveSettings = async () => {
    setSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      toast({
        title: "Settings Saved",
        description: "Your settings have been updated successfully.",
      });
    }, 1000);
  };

  const sections = [
    { id: "profile", title: "Profile", icon: User, color: "bg-blue-100 text-blue-700" },
    { id: "business", title: "Business", icon: Building, color: "bg-green-100 text-green-700" },
    { id: "notifications", title: "Notifications", icon: Bell, color: "bg-yellow-100 text-yellow-700" },
    { id: "security", title: "Security", icon: Shield, color: "bg-red-100 text-red-700" },
    { id: "appearance", title: "Appearance", icon: Palette, color: "bg-purple-100 text-purple-700" },
  ];

  const updateSetting = (section: keyof UserSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const renderProfileSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={settings.profile.name}
              onChange={(e) => updateSetting("profile", "name", e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={settings.profile.email}
              onChange={(e) => updateSetting("profile", "email", e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={settings.profile.phone}
              onChange={(e) => updateSetting("profile", "phone", e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select 
              value={settings.profile.role} 
              onValueChange={(value) => updateSetting("profile", "role", value)}
            >
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="worker">Worker</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">Password & Security</h3>
        <div className="space-y-4">
          <Button variant="outline" className="w-full h-12">
            <Key className="mr-2 h-5 w-5" />
            Change Password
          </Button>
          <Button variant="outline" className="w-full h-12">
            <Lock className="mr-2 h-5 w-5" />
            Reset Security Questions
          </Button>
        </div>
      </div>
    </div>
  );

  const renderBusinessSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Business Details</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={settings.business.name}
              onChange={(e) => updateSetting("business", "name", e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={settings.business.address}
              onChange={(e) => updateSetting("business", "address", e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={settings.business.city}
                onChange={(e) => updateSetting("business", "city", e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                value={settings.business.pincode}
                onChange={(e) => updateSetting("business", "pincode", e.target.value)}
                className="h-12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gstNumber">GST Number</Label>
            <Input
              id="gstNumber"
              value={settings.business.gstNumber}
              onChange={(e) => updateSetting("business", "gstNumber", e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={settings.business.website}
              onChange={(e) => updateSetting("business", "website", e.target.value)}
              className="h-12"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="text-base font-medium">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive updates via email</p>
            </div>
            <Switch
              checked={settings.notifications.emailNotifications}
              onCheckedChange={(checked) => updateSetting("notifications", "emailNotifications", checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="text-base font-medium">SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive SMS alerts</p>
            </div>
            <Switch
              checked={settings.notifications.smsNotifications}
              onCheckedChange={(checked) => updateSetting("notifications", "smsNotifications", checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="text-base font-medium">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Browser push notifications</p>
            </div>
            <Switch
              checked={settings.notifications.pushNotifications}
              onCheckedChange={(checked) => updateSetting("notifications", "pushNotifications", checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="text-base font-medium">Weekly Reports</Label>
              <p className="text-sm text-muted-foreground">Weekly business summary</p>
            </div>
            <Switch
              checked={settings.notifications.weeklyReports}
              onCheckedChange={(checked) => updateSetting("notifications", "weeklyReports", checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="text-base font-medium">Low Stock Alerts</Label>
              <p className="text-sm text-muted-foreground">Alert when inventory is low</p>
            </div>
            <Switch
              checked={settings.notifications.lowStockAlerts}
              onCheckedChange={(checked) => updateSetting("notifications", "lowStockAlerts", checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="text-base font-medium">Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">Add extra security to your account</p>
            </div>
            <Switch
              checked={settings.security.twoFactorAuth}
              onCheckedChange={(checked) => updateSetting("security", "twoFactorAuth", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
            <Select 
              value={settings.security.sessionTimeout} 
              onValueChange={(value) => updateSetting("security", "sessionTimeout", value)}
            >
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
            <Select 
              value={settings.security.passwordExpiry} 
              onValueChange={(value) => updateSetting("security", "passwordExpiry", value)}
            >
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="never">Never expires</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Display Settings</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select 
              value={settings.appearance.theme} 
              onValueChange={(value) => updateSetting("appearance", "theme", value)}
            >
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center">
                    <Sun className="mr-2 h-4 w-4" />
                    Light Theme
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center">
                    <Moon className="mr-2 h-4 w-4" />
                    Dark Theme
                  </div>
                </SelectItem>
                <SelectItem value="auto">Auto (System)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select 
              value={settings.appearance.language} 
              onValueChange={(value) => updateSetting("appearance", "language", value)}
            >
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select 
              value={settings.appearance.currency} 
              onValueChange={(value) => updateSetting("appearance", "currency", value)}
            >
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">₹ Indian Rupee (INR)</SelectItem>
                <SelectItem value="USD">$ US Dollar (USD)</SelectItem>
                <SelectItem value="EUR">€ Euro (EUR)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select 
              value={settings.appearance.dateFormat} 
              onValueChange={(value) => updateSetting("appearance", "dateFormat", value)}
            >
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeZone">Time Zone</Label>
            <Select 
              value={settings.appearance.timeZone} 
              onValueChange={(value) => updateSetting("appearance", "timeZone", value)}
            >
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case "profile": return renderProfileSection();
      case "business": return renderBusinessSection();
      case "notifications": return renderNotificationsSection();
      case "security": return renderSecuritySection();
      case "appearance": return renderAppearanceSection();
      default: return renderProfileSection();
    }
  };

  return (
    <AppLayout showBreadcrumbs={false}>
      <div className="space-y-4 sm:space-y-6">
        {/* Mobile-First Header */}
        <div className="space-y-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Settings
            </h1>
            <p className="text-base text-muted-foreground mt-1">
              Manage your account and business preferences
            </p>
          </div>
        </div>

        {/* Mobile-First Section Navigation */}
        <Card className="border-2 border-slate-100">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {sections.map((section) => {
                const SectionIcon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <Button
                    key={section.id}
                    variant={isActive ? "default" : "outline"}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "h-16 flex-col gap-2 text-xs font-medium transition-all duration-200",
                      isActive ? "shadow-md" : "border-2 hover:border-primary/30"
                    )}
                  >
                    <SectionIcon className="h-5 w-5" />
                    <span>{section.title}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Settings Content */}
        <Card className="border-2 border-slate-100">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold">
              {sections.find(s => s.id === activeSection)?.title} Settings
            </CardTitle>
            <CardDescription>
              Configure your {sections.find(s => s.id === activeSection)?.title.toLowerCase()} preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderSection()}
          </CardContent>
        </Card>

        {/* Save Button - Fixed to Bottom on Mobile */}
        <div className="sticky bottom-4 sm:static">
          <Button 
            onClick={handleSaveSettings}
            disabled={saving}
            className="thumb-primary w-full text-lg py-6 shadow-lg"
          >
            <Save className={cn("mr-3 h-6 w-6", saving && "animate-pulse")} />
            {saving ? "Saving Settings..." : "Save All Settings"}
          </Button>
        </div>

        {/* Data Management */}
        <Card className="border-2 border-slate-100">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold">Data Management</CardTitle>
            <CardDescription>
              Import, export, and manage your business data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                className="touch-button h-16 flex-col gap-2 border-2"
                onClick={() => {
                  toast({
                    title: "Export Started",
                    description: "Downloading your business data.",
                  });
                }}
              >
                <Download className="h-5 w-5" />
                <span className="text-sm font-medium">Export Data</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="touch-button h-16 flex-col gap-2 border-2"
                onClick={() => {
                  toast({
                    title: "Import Ready",
                    description: "Select a file to import your data.",
                  });
                }}
              >
                <Upload className="h-5 w-5" />
                <span className="text-sm font-medium">Import Data</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="touch-button h-16 flex-col gap-2 border-2"
                onClick={() => {
                  toast({
                    title: "Backup Created",
                    description: "Your data has been backed up safely.",
                  });
                }}
              >
                <RefreshCw className="h-5 w-5" />
                <span className="text-sm font-medium">Backup Data</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
