
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Eye, EyeOff, Shield, Smartphone } from 'lucide-react';

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simulate login - in real app, this would call your API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Demo users for testing RBAC
      const demoUsers = {
        'admin': { name: 'Admin User', role: 'admin', id: '1' },
        'owner': { name: 'Shop Owner', role: 'owner', id: '2' },
        'worker': { name: 'Technician', role: 'worker', id: '3' }
      };
      
      const user = demoUsers[formData.username as keyof typeof demoUsers] || demoUsers.admin;
      await login(formData.username, formData.password, user);
      
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: string) => {
    setFormData({ username: role, password: 'demo' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Company Branding */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold">CallMeMobiles</h1>
              <p className="text-sm text-muted-foreground">Professional Edition</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Smartphone className="h-3 w-3 mr-1" />
              Mobile Repair Management
            </Badge>
            <Badge variant="secondary" className="text-xs">
              v2.1.0
            </Badge>
          </div>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Secure Login
            </CardTitle>
            <CardDescription>
              Access your professional repair management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Signing In...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
            
            {/* Demo Access */}
            <div className="mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground text-center mb-3">
                Demo Access (RBAC Testing):
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('admin')}
                  className="justify-start"
                >
                  <Shield className="h-4 w-4 mr-2 text-red-600" />
                  Admin Access (Full System)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('owner')}
                  className="justify-start"
                >
                  <Building2 className="h-4 w-4 mr-2 text-blue-600" />
                  Owner Access (Business Management)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('worker')}
                  className="justify-start"
                >
                  <Smartphone className="h-4 w-4 mr-2 text-green-600" />
                  Technician Access (Limited)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
