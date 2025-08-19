import { Badge } from "@/components/ui/badge";

export function Footer() {
  return (
    <footer className="border-t bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Information */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">CallMeMobiles</h3>
              <p className="text-sm text-muted-foreground">
                Professional Mobile Repair Management System
              </p>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Comprehensive repair tracking</p>
              <p>Inventory management</p>
              <p>Business growth solutions</p>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Services</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>Repair Management</div>
              <div>Transaction Tracking</div>
              <div>Inventory Control</div>
              <div>Supplier Management</div>
              <div>Financial Reports</div>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Support</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>Documentation</div>
              <div>Help Center</div>
              <div>Technical Support</div>
              <div>Training Resources</div>
              <div>System Updates</div>
            </div>
          </div>

          {/* Contact & Status */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Contact</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>support@callmemobiles.com</div>
              <div>+91 98765 43210</div>
              <div>Mumbai, Maharashtra</div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Badge variant="outline" className="text-xs">
                System Online
              </Badge>
              <Badge variant="secondary" className="text-xs">
                v2.1.0
              </Badge>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © 2025 CallMeMobiles. Professional mobile repair management solution.
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Service</span>
              <span>•</span>
              <span>Security</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
