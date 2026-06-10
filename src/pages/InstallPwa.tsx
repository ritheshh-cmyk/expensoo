import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Download,
  Share,
  PlusSquare,
  ArrowLeft,
  CheckCircle2,
  WifiOff,
  Zap,
  Sparkles,
  Smartphone,
  Info,
} from "lucide-react";

export default function InstallPwa() {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalledPromptSupported, setIsInstalledPromptSupported] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / running in standalone mode
    const isStandalone = 
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    
    setIsAlreadyInstalled(isStandalone);

    // 2. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDetect = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDetect);

    // 3. Listen to beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstalledPromptSupported(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if prompt was fired already or supported
    if ("beforeinstallprompt" in window) {
      setIsInstalledPromptSupported(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the browser install prompt
    deferredPrompt.prompt();
    
    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    // Reset deferred prompt state
    setDeferredPrompt(null);
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto animate-in fade-in duration-300">
      {/* Header with back navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="h-10 w-10 rounded-xl border border-border/40 hover:bg-muted/40">
          <Link to="/settings">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground font-heading">
            {t("install-app") || "Install App"}
          </h1>
          <p className="text-xs text-muted-foreground">
            Get the full Expensoo experience on your device
          </p>
        </div>
      </div>

      {isAlreadyInstalled ? (
        /* Installed Success State */
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">
              Expensoo is Installed!
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              You are currently running the application as a standalone PWA. Enjoy offline access, fast performance, and a borderless experience!
            </p>
          </div>
        </div>
      ) : (
        /* Main Install Interface */
        <div className="space-y-6">
          {/* Main Hero Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#ea580c]/15 via-[#ea580c]/5 to-transparent border border-brand-orange/20 p-6 sm:p-8 space-y-6">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange shrink-0">
                <Smartphone className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full">
                  Progressive Web App
                </span>
                <h2 className="text-xl font-bold text-foreground">
                  Transform Expensoo into a Native App
                </h2>
                <p className="text-sm text-muted-foreground">
                  Install the app directly to your home screen or dock. It works just like a native mobile or desktop app without using up memory in your browser.
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-2">
              {isIOS ? (
                /* iOS Info Alert */
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-amber-500 flex gap-3 text-xs leading-relaxed">
                  <Info className="h-5 w-5 shrink-0" />
                  <div>
                    <span className="font-bold">iOS Safari Note:</span> Apple iOS does not support one-click installations in browsers. Please follow the step-by-step instructions below to add Expensoo to your home screen.
                  </div>
                </div>
              ) : deferredPrompt ? (
                /* Native Install Button */
                <Button
                  onClick={handleInstallClick}
                  className="w-full min-h-[48px] rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-black font-semibold shadow-lg shadow-brand-orange/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Download className="h-5 w-5" />
                  Install App
                </Button>
              ) : (
                /* Default/Unsupported state button */
                <div className="space-y-3">
                  <Button
                    disabled
                    className="w-full min-h-[48px] rounded-xl bg-muted text-muted-foreground font-semibold flex items-center justify-center gap-2"
                  >
                    <Download className="h-5 w-5" />
                    Install Unavailable
                  </Button>
                  <p className="text-[11px] text-center text-muted-foreground">
                    To install Expensoo, make sure you are accessing it through a supported browser (Chrome, Edge, Safari) and not inside an in-app browser webview.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Why Install Expensoo?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: WifiOff,
                  title: "Offline Access",
                  desc: "Log transactions and inspect history even when you have no internet connectivity.",
                },
                {
                  icon: Zap,
                  title: "Instant Loading",
                  desc: "Launches in milliseconds. Assets are stored locally to bypass latency entirely.",
                },
                {
                  icon: Sparkles,
                  title: "Premium Frame",
                  desc: "Zero browser bars, tabs, or address inputs. Enjoy 100% immersive layout usage.",
                },
              ].map((b, idx) => {
                const Icon = b.icon;
                return (
                  <div key={idx} className="p-5 rounded-2xl border border-border bg-card/40 backdrop-blur-md space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-orange/5 border border-brand-orange/10 flex items-center justify-center text-brand-orange">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-foreground">{b.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* iOS Custom Instructions */}
          {isIOS && (
            <div className="space-y-4 rounded-2xl border border-border bg-card/65 backdrop-blur-md p-6">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Share className="h-5 w-5 text-brand-orange" />
                iOS Safari Custom Instructions
              </h3>
              <p className="text-xs text-muted-foreground">
                Follow these simple steps on your iPhone or iPad to install Expensoo:
              </p>

              <div className="space-y-4 pt-2">
                {[
                  {
                    step: "1",
                    icon: Share,
                    text: "Tap the Share button in Safari's bottom toolbar (looks like a square with an up arrow).",
                  },
                  {
                    step: "2",
                    icon: PlusSquare,
                    text: 'Scroll down the list of options and select "Add to Home Screen".',
                  },
                  {
                    step: "3",
                    text: 'Confirm the name "Expensoo" and tap "Add" in the top-right corner.',
                  },
                ].map((s, idx) => {
                  const Icon = s.icon;
                  return (
                    <div key={idx} className="flex gap-4 items-start">
                      <div className="w-6 h-6 rounded-full bg-brand-orange/15 border border-brand-orange/20 text-brand-orange text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {s.step}
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xs text-foreground font-medium leading-relaxed">
                          {s.text}
                        </p>
                        {Icon && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background border border-border/80 text-[10px] text-muted-foreground">
                            <Icon className="w-3.5 h-3.5 text-brand-orange" />
                            <span>Action Icon Reference</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}