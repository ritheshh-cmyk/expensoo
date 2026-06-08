import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { loginSchema } from "@/lib/schemas";
import {
  Eye,
  EyeOff,
  Loader2,
  Wrench,
  AlertCircle,
  CheckCircle2,
  Zap,
  Sun,
  Moon
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/theme-provider";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });

  // Detect session-expiry from router state OR localStorage fallback flag
  useEffect(() => {
    const fromState   = (location.state as any)?.sessionExpired === true;
    const fromStorage = localStorage.getItem('session_expired_flag') === 'true';

    // Always clear the flag so it doesn't persist on next visit
    localStorage.removeItem('session_expired_flag');

    if (fromState || fromStorage) {
      setSessionExpired(true);
      // Auto-dismiss after 5 seconds
      dismissTimer.current = setTimeout(() => setSessionExpired(false), 5000);
    }

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Zod field validation before hitting the API
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const errs = result.error.flatten().fieldErrors;
      setFieldErrors({
        username: errs.username?.[0],
        password: errs.password?.[0],
      });
      return;
    }
    setFieldErrors({});

    setIsLoading(true);
    try {
      const success = await login(result.data.username, result.data.password);
      if (success) {
        toast({
          title: "Welcome back!",
          description: "Login successful",
        });
        navigate("/");
      } else {
        // login() returned false without throwing
        setLoginError("Invalid username or password. Please try again.");
      }
    } catch (error: any) {
      const msg = error.message || "Invalid username or password. Please try again.";
      setLoginError(msg);
      toast({
        title: "Login Failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (loginError) setLoginError("");
    if (fieldErrors[field as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    // Dismiss the session-expired banner as soon as the user starts interacting
    if (sessionExpired) {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      setSessionExpired(false);
    }
  };

  const features = [
    "Track every repair job from intake to pickup",
    "Live revenue & profit dashboards",
    "Role-based access for admin, owner & workers",
    "Real-time SMS billing and customer alerts",
  ];

  return (
    <main className="min-h-[100dvh] w-full flex bg-background relative overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-full bg-background/50 backdrop-blur-sm border shadow-sm"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      {/* ── LEFT PANEL: Hero / Branding ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        {/* Background image overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(180deg, rgba(13,13,12,0.3) 0%, rgba(13,13,12,0.7) 50%, rgba(13,13,12,0.95) 100%),
              url('/repair-hero.png')
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* Content over image */}
        <div className="relative z-10 flex flex-col justify-between w-full p-10">
          {/* Brand logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            <span className="text-lg font-semibold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
              CallMeMobiles
            </span>
          </div>

          {/* Hero text */}
          <div className="space-y-6 max-w-lg">
            <div>
              <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-3"
                style={{ fontFamily: "'Poppins', sans-serif" }}>
                Repair Shop Management
              </p>
              <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight"
                style={{ fontFamily: "'Poppins', sans-serif" }}>
                MANAGE YOUR<br />
                <span className="text-primary">REPAIRS SMARTER</span>
              </h1>
            </div>

            <p className="text-gray-300 text-sm font-semibold tracking-widest uppercase"
              style={{ fontFamily: "'Poppins', sans-serif" }}>
              Complete control over every job
            </p>

            {/* Feature list */}
            <ul className="space-y-3">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-200 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            {/* Live system badge */}
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl border border-primary/30 bg-primary/10 backdrop-blur-sm">
              <Zap className="w-5 h-5 text-primary" />
              <div>
                <p className="text-primary text-xs font-bold uppercase tracking-wide">Live System</p>
                <p className="text-gray-200 text-sm">Real-time updates across all devices</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-gray-500 text-xs">
            © 2026 CallMeMobiles · Repair Shop Management System
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL: Login Form Card ─────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 bg-background min-h-[100dvh] relative overflow-hidden py-8">
        {/* Decorative Overlay for bottom edge blending if needed */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        {/* Glow ambient background elements for premium feel (especially visible on mobile) */}
        <div className="absolute top-[-20%] left-[-25%] w-[80%] h-[80%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-25%] w-[80%] h-[80%] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />

        <Card className="w-full max-w-md border-border/60 shadow-2xl rounded-2xl glass z-10 transition-all duration-300 hover:shadow-primary/5">
          <CardHeader className="space-y-1.5 pb-4">
            <CardTitle className="text-2xl font-bold tracking-tight text-center sm:text-left" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Sign in
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm text-center sm:text-left">
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ── Session-expired banner ────────────────────────────── */}
            {sessionExpired && (
              <div
                role="alert"
                className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/25 text-primary text-sm mb-4"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>
                  <strong>Session Expired</strong> — Please log in again.
                </span>
              </div>
            )}

            {/* ── Login form ───────────────────────────────────────── */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground text-sm font-medium">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value)
                  }
                  className={`h-12 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/30 ${fieldErrors.username ? "border-destructive focus:ring-destructive/30" : ""}`}
                  aria-describedby={fieldErrors.username ? "username-error" : undefined}
                />
                {fieldErrors.username && (
                  <p id="username-error" className="text-xs text-destructive mt-1">
                    {fieldErrors.username}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className={`h-12 pr-12 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/30 ${fieldErrors.password ? "border-destructive focus:ring-destructive/30" : ""}`}
                    aria-describedby={fieldErrors.password ? "password-error" : undefined}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent z-10"
                    onClick={() => setShowPassword(!showPassword)}
                    onMouseDown={(e) => e.preventDefault()}
                    onPointerDown={(e) => e.preventDefault()}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {fieldErrors.password && (
                  <p id="password-error" className="text-xs text-destructive mt-1">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Inline error message */}
              {loginError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {loginError}
                </div>
              )}

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => handleInputChange("rememberMe", e.target.checked)}
                    className="w-4 h-4 rounded border-input bg-background text-primary focus:ring-primary/30 cursor-pointer accent-primary"
                  />
                  <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none">
                    Remember me
                  </label>
                </div>
                <Link
                  to="/auth/forgot-password"
                  className="text-sm text-primary hover:text-primary/80 transition-colors duration-150 font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl transition-colors duration-150 cursor-pointer min-h-[48px] mt-2 flex items-center justify-center gap-2 text-base shadow-lg shadow-primary/20"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pb-6 pt-0">
            <div className="text-center text-sm text-muted-foreground">
              Need help?{" "}
              <a
                href="tel:+919392404104"
                className="text-primary hover:text-primary/80 transition-colors duration-150 font-semibold"
              >
                Call Support
              </a>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
