import { useDevice } from "@/contexts/DeviceContext";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { 
  Heart, 
  Code, 
  Globe, 
  Shield, 
  Zap,
  Smartphone,
  Mail,
  MapPin,
  Phone
} from "lucide-react";

export function Footer() {
  const { isMobile, isTablet } = useDevice();
  const { theme } = useTheme();
  
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={cn(
      "border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto",
      // Enhanced dark mode contrast
      "dark:bg-black/98 dark:border-white/10",
      // Responsive padding
      isMobile ? "px-4 py-6" : "px-6 py-8"
    )}>
      <div className="container mx-auto max-w-7xl">
        {/* Mobile-First Footer Layout */}
        <div className={cn(
          "grid gap-6",
          isMobile ? "grid-cols-1 text-center" : 
          isTablet ? "grid-cols-2 gap-8" : 
          "grid-cols-4 gap-8"
        )}>
          
          {/* Company Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">CallMeMobiles</h3>
                <p className="text-xs text-muted-foreground">Mobile Repair Hub</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Professional mobile repair management system. Track repairs, manage inventory, and grow your business.
            </p>
            {!isMobile && (
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-xs text-muted-foreground">Secure & Reliable</span>
              </div>
            )}
          </div>
          
          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</a></li>
              <li><a href="/transactions" className="hover:text-foreground transition-colors">Transactions</a></li>
              <li><a href="/suppliers" className="hover:text-foreground transition-colors">Suppliers</a></li>
              <li><a href="/expenditures" className="hover:text-foreground transition-colors">Expenditures</a></li>
              <li><a href="/reports" className="hover:text-foreground transition-colors">Reports</a></li>
            </ul>
          </div>
          
          {/* Support */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/help" className="hover:text-foreground transition-colors">Help Center</a></li>
              <li><a href="/docs" className="hover:text-foreground transition-colors">Documentation</a></li>
              <li><a href="/contact" className="hover:text-foreground transition-colors">Contact Us</a></li>
              <li><a href="/updates" className="hover:text-foreground transition-colors">Updates</a></li>
            </ul>
            {!isMobile && (
              <div className="flex items-center space-x-2 pt-2">
                <Zap className="h-4 w-4 text-yellow-600" />
                <span className="text-xs text-muted-foreground">24/7 Support</span>
              </div>
            )}
          </div>
          
          {/* Contact Info */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm uppercase tracking-wider">Contact</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <Mail className="h-3 w-3" />
                <span>support@callmemobiles.com</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <Phone className="h-3 w-3" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <MapPin className="h-3 w-3" />
                <span>Mumbai, Maharashtra</span>
              </div>
            </div>
            {!isMobile && (
              <div className="flex items-center space-x-2 pt-2">
                <Globe className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-muted-foreground">Available Worldwide</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className={cn(
          "mt-8 pt-6 border-t dark:border-white/10 flex items-center justify-between",
          isMobile ? "flex-col space-y-4 text-center" : "flex-row"
        )}>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>© {currentYear} CallMeMobiles. Made with</span>
            <Heart className="h-4 w-4 text-red-600 animate-pulse" />
            <span>in India</span>
            <Code className="h-4 w-4 text-primary ml-2" />
          </div>
          
          <div className="flex items-center space-x-6 text-xs text-muted-foreground">
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="/cookies" className="hover:text-foreground transition-colors">Cookie Policy</a>
          </div>
        </div>
        
        {/* Version Info */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>System Status: Online</span>
            <span>•</span>
            <span>v2.1.0</span>
            <span>•</span>
            <span>{theme === 'dark' ? '🌙' : '☀️'} {theme} mode</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
