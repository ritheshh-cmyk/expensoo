
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Menu, 
  Bell, 
  Settings, 
  User, 
  Sun, 
  Moon, 
  Monitor,
  Search,
  Building2,
  Shield,
  LogOut,
  Smartphone,
  Tablet,
  Laptop,
  Wifi,
  WifiOff,
  Activity,
  Users,
  Package
} from "lucide-react";

interface CorporateHeaderProps {
  onMenuClick: () => void;
}

export function CorporateHeader({ onMenuClick }: CorporateHeaderProps) {
  const { user, logout, hasAccess } = useAuth();
  const { theme, setTheme } = useTheme();
  const [systemStatus, setSystemStatus] = useState({
    status: 'online',
    connections: 0,
    version: '2.1.0'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [deviceInfo, setDeviceInfo] = useState({
    type: 'desktop',
    screen: 'lg'
  });

  // Device detection
  useEffect(() => {
    const updateDevice = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceInfo({ type: 'mobile', screen: 'sm' });
      } else if (width < 1024) {
        setDeviceInfo({ type: 'tablet', screen: 'md' });
      } else {
        setDeviceInfo({ type: 'desktop', screen: 'lg' });
      }
    };

    updateDevice();
    window.addEventListener('resize', updateDevice);
    return () => window.removeEventListener('resize', updateDevice);
  }, []);

  // System status monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate system monitoring
      setSystemStatus(prev => ({
        ...prev,
        connections: Math.floor(Math.random() * 100) + 50
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getDeviceIcon = () => {
    switch(deviceInfo.type) {
      case 'mobile': return <Smartphone className="h-3 w-3" />;
      case 'tablet': return <Tablet className="h-3 w-3" />;
      default: return <Laptop className="h-3 w-3" />;
    }
  };

  const getThemeIcon = () => {
    switch(theme) {
      case 'dark': return <Moon className="h-4 w-4" />;
      case 'light': return <Sun className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch(role?.toLowerCase()) {
      case 'admin': return 'bg-brand-orange-50 text-brand-orange-600 dark:bg-brand-orange/15 dark:text-brand-orange';
      case 'owner': return 'bg-brand-blue-50 text-brand-blue-600 dark:bg-brand-blue/15 dark:text-brand-blue';
      case 'worker': return 'bg-brand-green-50 text-brand-green-600 dark:bg-brand-green/15 dark:text-brand-green';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 lg:px-6 h-full">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="expenso-gradient w-8 h-8 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-foreground font-heading">CallMeMobiles</h1>
              <p className="text-xs text-muted-foreground">Professional Repair Management</p>
            </div>
          </div>
        </div>

        {/* Center Section - Search & Status */}
        <div className="hidden md:flex items-center gap-4 flex-1 max-w-md mx-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search transactions, customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-9 bg-muted/50"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {systemStatus.status === 'online' ? (
                <Wifi className="h-3 w-3 mr-1 text-brand-green" />
              ) : (
                <WifiOff className="h-3 w-3 mr-1 text-red-600" />
              )}
              {systemStatus.status}
            </Badge>
            
            <Badge variant="secondary" className="text-xs">
              {getDeviceIcon()}
              <span className="ml-1">{deviceInfo.screen.toUpperCase()}</span>
            </Badge>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Theme Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                {getThemeIcon()}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                Light Mode
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                Dark Mode
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 h-4 w-4" />
                System Default
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-brand-orange text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
            <span className="sr-only">Notifications</span>
          </Button>

          {/* System Status Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <Activity className="h-4 w-4" />
                <span className="sr-only">System status</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>System Status</DialogTitle>
                <DialogDescription>
                  Current system performance and connectivity
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status</span>
                  <Badge variant="outline" className="text-green-600">
                    <Wifi className="h-3 w-3 mr-1" />
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Version</span>
                  <Badge variant="secondary">{systemStatus.version}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active Connections</span>
                  <span className="text-sm font-medium">{systemStatus.connections}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Device Type</span>
                  <div className="flex items-center gap-1 text-sm">
                    {getDeviceIcon()}
                    <span>{deviceInfo.type}</span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-3 h-9">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-3 w-3 text-primary-foreground" />
                </div>
                <div className="hidden md:flex flex-col items-start text-left">
                  <span className="text-sm font-medium">{user?.name || 'User'}</span>
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    <span className="text-xs text-muted-foreground">{user?.role || 'Guest'}</span>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <div className="flex items-center gap-1">
                    <Badge className={`text-xs ${getRoleColor(user?.role || '')}`}>
                      {user?.role}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Preferences
              </DropdownMenuItem>
              {hasAccess(["admin", "owner"]) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Users className="mr-2 h-4 w-4" />
                    User Management
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Package className="mr-2 h-4 w-4" />
                    System Settings
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
