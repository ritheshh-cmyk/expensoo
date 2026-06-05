import { useState, useRef } from "react";
import { PasswordStrengthMeter, validatePassword } from "@/components/ui/PasswordStrengthMeter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Camera,
  Trash2,
  Shield,
  LogOut,
  Loader2,
  Key,
  Mail,
  AtSign,
  UserCircle,
  Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";

const AVATAR_KEY = "profile_avatar";

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved avatar from localStorage
  const [avatarSrc, setAvatarSrc] = useState<string | null>(() =>
    localStorage.getItem(AVATAR_KEY)
  );
  const [uploading, setUploading] = useState(false);
  
  // Forms state
  const [newPassword, setNewPassword] = useState('');
  const [isSubmittingInfo, setIsSubmittingInfo] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // ── image processing ────────────────────────────────────────────────────────
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image under 5 MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 400;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        const resized = canvas.toDataURL("image/jpeg", 0.85);
        localStorage.setItem(AVATAR_KEY, resized);
        setAvatarSrc(resized);
        setUploading(false);
        window.dispatchEvent(new CustomEvent("avatar-updated"));
        toast({ title: "Photo updated", description: "Your profile photo has been saved." });
      };
      img.onerror = () => {
        setUploading(false);
        toast({ title: "Invalid image", description: "Could not decode the image. Try a different file.", variant: "destructive" });
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      setUploading(false);
      toast({ title: "Read error", description: "Failed to read the file. Please try again.", variant: "destructive" });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const removePhoto = () => {
    localStorage.removeItem(AVATAR_KEY);
    setAvatarSrc(null);
    window.dispatchEvent(new CustomEvent("avatar-updated"));
    toast({ title: "Photo removed", description: "Your profile photo has been cleared." });
  };

  // ── Form Handlers ────────────────────────────────────────────────────────
  const handleUpdateInfo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string)?.trim();
    const username = (formData.get("username") as string)?.trim();

    if ((!name || name === user?.name) && (!username || username === user?.username)) {
      toast({ title: "No changes", description: "You didn't make any changes." });
      return;
    }

    setIsSubmittingInfo(true);
    try {
      const updates: any = {
        full_name: name || user?.name || user?.username,
        email: user?.email || '',
      };
      
      const res = await apiClient.updateProfile(updates);
      if (!res.success) throw new Error(res.message || "Failed to update profile info");

      updateUser({
        name: updates.full_name !== undefined ? updates.full_name : user?.name,
        username: updates.username !== undefined ? updates.username : user?.username,
      });
      toast({ title: "Profile updated", description: "Your personal information has been saved." });
    } catch (error: any) {
      toast({ title: "Update Failed", description: error.message || String(error), variant: "destructive" });
    } finally {
      setIsSubmittingInfo(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newPassword) return;

    const pwError = validatePassword(newPassword);
    if (pwError) {
      toast({ title: 'Weak Password', description: pwError, variant: 'destructive' });
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const updates: any = {
        full_name: user?.name || user?.username || '',
        email: user?.email || '',
        password: newPassword
      };

      const res = await apiClient.updateProfile(updates);
      if (!res.success) throw new Error(res.message || "Failed to update password");

      toast({ title: "Password updated", description: "Your password was changed successfully. Please log in again." });
      setTimeout(() => {
        logout();
        navigate("/login", { replace: true });
      }, 1500);
    } catch (error: any) {
      toast({ title: "Update Failed", description: error.message || String(error), variant: "destructive" });
    } finally {
      setIsSubmittingPassword(false);
      setNewPassword('');
    }
  };

  const roleColor = {
    admin: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",
    owner: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400",
    worker: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  }[user?.role ?? "worker"];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground font-heading tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your profile, security, and account preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="overflow-hidden border-border/50 shadow-sm">
            <div className="h-24 bg-gradient-to-br from-primary/20 to-primary/5 w-full" />
            <CardContent className="px-6 pb-6 pt-0 text-center flex flex-col items-center">
              <div className="relative -mt-12 mb-4">
                <div className="w-24 h-24 rounded-full border-4 border-background overflow-hidden bg-muted flex items-center justify-center shadow-sm">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-muted-foreground/50" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 z-10 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg hover:bg-primary/90 active:scale-95 transition-all ring-2 ring-background"
                  aria-label="Upload photo"
                >
                  <Camera className="h-3.5 w-3.5 text-primary-foreground" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
              
              <h2 className="text-lg font-bold text-foreground font-heading">{user?.name || user?.username || '—'}</h2>
              <p className="text-sm text-muted-foreground mb-3">{user?.email || 'No email provided'}</p>
              
              <Badge variant="outline" className={cn("capitalize px-3 py-1 font-medium", roleColor)}>
                <Shield className="h-3.5 w-3.5 mr-1.5" />
                {user?.role ?? "—"}
              </Badge>

              {avatarSrc && (
                <Button variant="ghost" size="sm" onClick={removePhoto} className="mt-4 text-destructive hover:text-destructive hover:bg-destructive/10 w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Photo
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Personal Information */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription>Update your name and username.</CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdateInfo}>
              <CardContent className="space-y-4 pt-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="name" name="name" className="pl-9" placeholder="Your full name" defaultValue={user?.name || ''} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="username" name="username" className="pl-9" placeholder="Your username" defaultValue={user?.username || ''} />
                    </div>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="email" className="pl-9 bg-muted/50" value={user?.email || ''} readOnly disabled />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">Email cannot be changed currently.</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/20 border-t border-border/50 px-6 py-4">
                <Button type="submit" disabled={isSubmittingInfo} className="ml-auto flex items-center gap-2 shadow-sm hover:shadow">
                  {isSubmittingInfo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Security */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Security
              </CardTitle>
              <CardDescription>Change your password to secure your account.</CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdatePassword}>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2 max-w-md">
                  <Label htmlFor="password">New Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter a strong password" 
                  />
                  <PasswordStrengthMeter password={newPassword} />
                </div>
              </CardContent>
              <CardFooter className="bg-muted/20 border-t border-border/50 px-6 py-4">
                <Button type="submit" disabled={isSubmittingPassword || !newPassword} className="ml-auto flex items-center gap-2 shadow-sm hover:shadow">
                  {isSubmittingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                  Update Password
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/30 shadow-sm bg-destructive/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-destructive flex items-center gap-2">
                <LogOut className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Actions here cannot be undone.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-medium text-foreground">Sign out of your account</h4>
                  <p className="text-sm text-muted-foreground mt-0.5">You will need to enter your credentials to log back in.</p>
                </div>
                <Button variant="destructive" onClick={handleLogout} className="shrink-0 flex items-center gap-2 shadow-sm">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
