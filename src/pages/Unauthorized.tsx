import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldX, Home, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Unauthorized() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Current role:{" "}
            <span className="font-medium capitalize">{user?.role}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
            <Button onClick={logout} variant="destructive" className="flex-1">
              Switch Account
            </Button>
          </div>
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Need help?</p>
            <Button asChild variant="outline" size="sm" className="w-full">
              <a href="tel:+919392404104">
                <Phone className="mr-2 h-4 w-4" />
                Call Support
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
