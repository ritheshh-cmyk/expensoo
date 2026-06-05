import { useState, useRef } from "react";
import { PasswordStrengthMeter, validatePassword } from "@/components/ui/PasswordStrengthMeter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Camera,
  Upload,
  Trash2,
  Shield,
  LogOut,
  Loader2,
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
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // Resize to max 400px to keep localStorage small
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
        // Notify the Header (and any other listener) to refresh the avatar immediately
        window.dispatchEvent(new CustomEvent("avatar-updated"));
        toast({ title: "Photo updated", description: "Your profile photo has been saved." });
      };
      img.onerror = () => {
        setUploading(false);
        toast({ title: "Invalid image", description: "Could not decode the image. Try a different file.", variant: "destructive" });
      };
      img.src = dataUrl;
    };
    // BUG 3 FIX: reader.onerror was missing - if FileReader fails, uploading
    // would stay true forever, permanently disabling the upload button.
    reader.onerror = () => {
      setUploading(false);
      toast({ title: "Read error", description: "Failed to read the file. Please try again.", variant: "destructive" });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const removePhoto = () => {
    localStorage.removeItem(AVATAR_KEY);
    setAvatarSrc(null);
    // Notify Header immediately
    window.dispatchEvent(new CustomEvent("avatar-updated"));
    toast({ title: "Photo removed", description: "Your profile photo has been cleared." });
  };

  // ── role badge ────────────────────────────────────────────────────────────
  const roleColor = {
    admin: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",
    owner: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400",
    worker: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  }[user?.role ?? "worker"];

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account and profile photo</p>
      </div>

      {/* Profile card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Photo
          </CardTitle>
          <CardDescription>
            Upload a photo — it's saved on this device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Avatar + upload zone */}
          <div className="flex flex-col sm:flex-row items-center gap-6">

            {/* Avatar circle */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 rounded-full border-4 border-primary/20 overflow-hidden bg-muted flex items-center justify-center">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-14 w-14 text-muted-foreground/50" />
                )}
              </div>
              {/* Camera overlay — sits outside the circle overflow:hidden */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 z-10 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg hover:bg-primary/90 active:scale-95 transition-all"
                aria-label="Upload photo"
              >
                <Camera className="h-4 w-4 text-primary-foreground" />
              </button>
            </div>

            {/* Drag & drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex-1 w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200",
                dragOver
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <Upload className={cn("h-8 w-8 transition-colors", dragOver ? "text-primary" : "text-muted-foreground")} />
              <p className="text-sm font-medium text-foreground">
                {uploading ? "Processing…" : "Click or drag & drop"}
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 5 MB</p>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              {avatarSrc ? "Change Photo" : "Upload Photo"}
            </Button>
            {avatarSrc && (
              <Button
                variant="outline"
                size="sm"
                onClick={removePhoto}
                className="flex items-center gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account info card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Name</Label>
              <p className="font-semibold text-foreground">{user?.name || user?.username || "—"}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Username</Label>
              <p className="font-semibold text-foreground">{user?.username || "—"}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Email</Label>
              <p className="font-semibold text-foreground">{user?.email || "—"}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Role</Label>
              <div>
                <Badge variant="outline" className={cn("capitalize text-xs", roleColor)}>
                  <Shield className="h-3 w-3 mr-1" />
                  {user?.role ?? "—"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Update Credentials card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Update Credentials
          </CardTitle>
          <CardDescription>Change your username or password</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const name = (formData.get("name") as string)?.trim();
            const username = (formData.get("username") as string)?.trim();
            const password = formData.get("password") as string;
            const updates: any = {};
            
            if (name && name !== user?.name) updates.full_name = name;
            if (username && username !== user?.username) updates.username = username;
            if (password) updates.password = password;

            if (Object.keys(updates).length === 0) {
              toast({ title: "No changes", description: "You didn't make any changes." });
              return;
            }

            // Validate password strength before submitting
            if (password) {
              const pwError = validatePassword(password);
              if (pwError) {
                toast({ title: 'Weak Password', description: pwError, variant: 'destructive' });
                return;
              }
            }

            setIsSubmitting(true);
            try {
              const res = await apiClient.updateProfile(updates);
              if (!res.success) {
                // Determine user-friendly error message
                let errorMsg = res.message || "Failed to update credentials";
                if (typeof errorMsg === 'string' && errorMsg.includes('email') && errorMsg.includes('value_error.missing')) {
                  // Fallback in case backend strictly requires email but we don't send it from Profile
                  errorMsg = "Server error: Email required by backend but not provided.";
                } else if (errorMsg.includes('value_error') || errorMsg.includes('loc')) {
                  errorMsg = "Server validation failed. Please check your inputs.";
                }
                
                throw new Error(errorMsg);
              }
              
              if (updates.password) {
                toast({ title: "Success", description: "Credentials updated successfully. Please log in again." });
                setTimeout(() => {
                  logout();
                  navigate("/login", { replace: true });
                }, 1500);
              } else {
                // BUG 9 FIX: use ?? not || so an intentional name update to an
                // empty-ish string is not silently discarded by the falsy check.
                updateUser({
                  name: updates.full_name !== undefined ? updates.full_name : user?.name,
                  username: updates.username !== undefined ? updates.username : user?.username,
                });
                toast({ title: "Success", description: "Profile updated successfully." });
              }
            } catch (error: any) {
              const msg = error instanceof Error ? error.message : String(error);
              toast({ title: "Update Failed", description: msg, variant: "destructive" });
            } finally {
              setIsSubmitting(false);
            }
          }}>
            <div className="space-y-2">
              <Label htmlFor="name">Display Name (optional)</Label>
              <input 
                id="name" 
                name="name" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                placeholder={user?.name || user?.username} 
                defaultValue={user?.name !== user?.username ? user?.name : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">New Username (optional)</Label>
              <input 
                id="username" 
                name="username" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                placeholder={user?.username} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New Password (optional)</Label>
              <input
                id="password"
                name="password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Leave blank to keep current"
              />
              <PasswordStrengthMeter password={newPassword} />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Profile"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Sign Out
          </CardTitle>
          <CardDescription>
            You'll be redirected to the login page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Log out of this account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
