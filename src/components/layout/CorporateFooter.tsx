
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Shield, 
  Clock,
  CheckCircle,
  Wifi
} from "lucide-react";

export function CorporateFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-auto border-t bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-semibold">CallMeMobiles</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Professional mobile repair management system designed for modern repair shops and technicians.
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                System Online
              </Badge>
              <Badge variant="secondary" className="text-xs">
                v2.1.0
              </Badge>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Core Services</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="hover:text-foreground transition-colors cursor-pointer">
                Repair Management
              </div>
              <div className="hover:text-foreground transition-colors cursor-pointer">
                Inventory Tracking
              </div>
              <div className="hover:text-foreground transition-colors cursor-pointer">
                Supplier Management
              </div>
              <div className="hover:text-foreground transition-colors cursor-pointer">
                Financial Reporting
              </div>
              <div className="hover:text-foreground transition-colors cursor-pointer">
                Customer Management
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Support</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="hover:text-foreground transition-colors cursor-pointer">
                Help Documentation
              </div>
              <div className="hover:text-foreground transition-colors cursor-pointer">
                Technical Support
              </div>
              <div className="hover:text-foreground transition-colors cursor-pointer">
                Training Resources
              </div>
              <div className="hover:text-foreground transition-colors cursor-pointer">
                System Updates
              </div>
              <div className="hover:text-foreground transition-colors cursor-pointer">
                API Documentation
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Contact</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>support@callmemobiles.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Mumbai, Maharashtra, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <span>www.callmemobiles.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t mt-8 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>© {currentYear} CallMeMobiles. All rights reserved.</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Professional Repair Management Solution</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="hover:text-foreground transition-colors cursor-pointer">
                Privacy Policy
              </span>
              <span>•</span>
              <span className="hover:text-foreground transition-colors cursor-pointer">
                Terms of Service
              </span>
              <span>•</span>
              <span className="hover:text-foreground transition-colors cursor-pointer">
                Security
              </span>
            </div>
          </div>
          
          {/* System Status Footer */}
          <div className="flex items-center justify-center mt-6 pt-6 border-t">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Wifi className="h-3 w-3 text-green-600" />
                <span>Connected</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-blue-600" />
                <span>Secure</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-purple-600" />
                <span>Real-time Updates</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
