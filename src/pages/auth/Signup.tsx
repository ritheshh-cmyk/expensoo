import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DollarSign, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Stepper, { Step } from "@/components/ui/Stepper";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    agreeToTerms: false,
  });

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!formData.companyName.trim()) {
        toast({
          title: "Company Name Required",
          description: "Please enter your business name.",
          variant: "destructive",
        });
        return false;
      }
      if (!formData.email.trim()) {
        toast({
          title: "Email Required",
          description: "Please enter your email address.",
          variant: "destructive",
        });
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (!formData.password) {
        toast({
          title: "Password Required",
          description: "Please create a password.",
          variant: "destructive",
        });
        return false;
      }
      if (formData.password.length < 8) {
        toast({
          title: "Weak Password",
          description: "Password must be at least 8 characters.",
          variant: "destructive",
        });
        return false;
      }
      if (!/[A-Z]/.test(formData.password)) {
        toast({
          title: "Uppercase Letter Required",
          description: "Password must contain at least one uppercase letter.",
          variant: "destructive",
        });
        return false;
      }
      if (!/[a-z]/.test(formData.password)) {
        toast({
          title: "Lowercase Letter Required",
          description: "Password must contain at least one lowercase letter.",
          variant: "destructive",
        });
        return false;
      }
      if (!/\d/.test(formData.password)) {
        toast({
          title: "Number Required",
          description: "Password must contain at least one number.",
          variant: "destructive",
        });
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Password Mismatch",
          description: "Passwords do not match.",
          variant: "destructive",
        });
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (!formData.agreeToTerms) {
        toast({
          title: "Terms Required",
          description: "Please agree to the Terms of Service.",
          variant: "destructive",
        });
        return false;
      }
      return true;
    }
    return true;
  };

  const handleStepChange = (nextStep: number) => {
    if (nextStep > activeStep) {
      const isValid = validateStep(activeStep);
      if (!isValid) return;
    }
    setActiveStep(nextStep);
  };

  const handleFinalStepCompleted = async () => {
    if (!formData.agreeToTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms and conditions.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);

    toast({
      title: "Account Created!",
      description: "Your Expenso account has been created successfully.",
    });

    // Redirect to dashboard on success
    window.location.href = "/dashboard";
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const passwordRequirements = [
    { text: "At least 8 characters", met: formData.password.length >= 8 },
    { text: "Contains uppercase letter", met: /[A-Z]/.test(formData.password) },
    { text: "Contains lowercase letter", met: /[a-z]/.test(formData.password) },
    { text: "Contains number", met: /\d/.test(formData.password) },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-12 lg:py-24 expenso-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 text-white">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <DollarSign className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Expenso</h1>
              <p className="text-white/80 text-sm">Business Manager</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold mb-4">
            Start managing your business expenses today
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-md">
            Join thousands of businesses using Expenso to streamline their
            expense tracking and customer management.
          </p>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold">✓</span>
              </div>
              <span className="text-white/90">Free 30-day trial</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold">✓</span>
              </div>
              <span className="text-white/90">No credit card required</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold">✓</span>
              </div>
              <span className="text-white/90">24/7 customer support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Signup Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center justify-center space-x-3 mb-8 lg:hidden">
            <div className="expenso-gradient w-10 h-10 rounded-xl flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Expenso</h1>
              <p className="text-xs text-muted-foreground">Business Manager</p>
            </div>
          </div>

          <Card className="shadow-soft">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold text-center">
                Create your account
              </CardTitle>
              <CardDescription className="text-center">
                Start your free trial today
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Stepper
                activeStep={activeStep}
                onStepChange={handleStepChange}
                onFinalStepCompleted={handleFinalStepCompleted}
                stepCircleContainerClassName="border-0 shadow-none p-0 max-w-full"
                stepContainerClassName="px-0 py-4"
                contentClassName="pt-2"
                footerClassName="px-0 pb-0"
                backButtonText="Back"
                nextButtonText="Continue"
                backButtonProps={{
                  type: "button",
                  className: "px-4 py-2 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                }}
                nextButtonProps={{
                  type: "button",
                  disabled: isLoading,
                  className: "px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors flex items-center justify-center min-w-[100px]"
                }}
              >
                <Step>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        placeholder="Your Business Name"
                        value={formData.companyName}
                        onChange={(e) =>
                          handleInputChange("companyName", e.target.value)
                        }
                        required
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number (Optional)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className="h-11"
                      />
                    </div>
                  </div>
                </Step>

                <Step>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          value={formData.password}
                          onChange={(e) =>
                            handleInputChange("password", e.target.value)
                          }
                          required
                          className="h-11 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-11 w-10"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {formData.password && (
                        <div className="space-y-2 mt-3 bg-muted/30 p-3 rounded-md">
                          <p className="text-xs text-muted-foreground font-semibold">
                            Password requirements:
                          </p>
                          <div className="grid grid-cols-1 gap-1">
                            {passwordRequirements.map((req, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 text-xs"
                              >
                                <CheckCircle
                                  className={`h-3.5 w-3.5 ${
                                    req.met
                                      ? "text-success text-green-600 dark:text-green-500"
                                      : "text-muted-foreground"
                                  }`}
                                />
                                <span
                                  className={
                                    req.met
                                      ? "text-success text-green-700 dark:text-green-400 font-medium"
                                      : "text-muted-foreground"
                                  }
                                >
                                  {req.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            handleInputChange("confirmPassword", e.target.value)
                          }
                          required
                          className="h-11 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-11 w-10"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Step>

                <Step>
                  <div className="space-y-6 py-4">
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 text-center">
                      <h3 className="font-bold text-lg mb-1 text-primary">Almost there!</h3>
                      <p className="text-sm text-muted-foreground">
                        Please review and agree to our Terms of Service to finalize your account creation.
                      </p>
                    </div>

                    <div className="flex items-start space-x-3 bg-muted/20 p-4 rounded-lg">
                      <Checkbox
                        id="terms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) =>
                          handleInputChange("agreeToTerms", !!checked)
                        }
                        className="mt-1"
                      />
                      <Label htmlFor="terms" className="text-sm font-normal leading-relaxed">
                        I agree to the{" "}
                        <Link to="/terms" className="text-primary hover:underline font-semibold">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link
                          to="/privacy"
                          className="text-primary hover:underline font-semibold"
                        >
                          Privacy Policy
                        </Link>
                        .
                      </Label>
                    </div>

                    {isLoading && (
                      <div className="flex justify-center items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        Creating Account...
                      </div>
                    )}
                  </div>
                </Step>
              </Stepper>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <div className="text-center text-sm text-muted-foreground border-t border-border/50 pt-4 w-full">
                Already have an account?{" "}
                <Link
                  to="/auth/login"
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
