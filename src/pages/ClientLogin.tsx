import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, Mail, ArrowLeft, KeyRound, CheckCircle, Loader2, ShieldCheck, HelpCircle, BarChart3, FileText, Calendar } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

type ViewMode = "login" | "reset-request" | "reset-confirm" | "set-password";

const ClientLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("login");
  const [resetSent, setResetSent] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle auth flow: PKCE code exchange, magic links, invite links, password setup
  useEffect(() => {
    const setup = searchParams.get("setup");
    const hasCode = searchParams.get("code");
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hashType = hashParams.get("type");

    // If there's a `code` param (PKCE flow) or hash tokens, Supabase is exchanging
    // them for a session in the background. We MUST wait for onAuthStateChange
    // before rendering the final view.
    const isAwaitingAuth = !!(hasCode || hashType);

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session && setup === "password") {
        // Session already exists and we need password setup
        setViewMode("set-password");
        setIsAuthLoading(false);
        return;
      }

      if (session && hashType === "recovery") {
        setViewMode("reset-confirm");
        setIsAuthLoading(false);
        return;
      }

      // If no auth exchange is pending, stop loading immediately
      if (!isAwaitingAuth) {
        setIsAuthLoading(false);
      }
      // Otherwise keep loading - onAuthStateChange will handle it
    };

    checkSession();

    // Listen for auth state changes (handles PKCE code exchange completion,
    // magic link sessions, invite sessions, and password recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Auth] Event:", event, "Setup:", setup, "Session:", !!session);

      if (event === "PASSWORD_RECOVERY") {
        setViewMode("reset-confirm");
        setIsAuthLoading(false);
      } else if (event === "SIGNED_IN" && setup === "password") {
        // User just signed in via invite/magic link and needs to set password
        setViewMode("set-password");
        setIsAuthLoading(false);
      } else if (event === "SIGNED_IN" && !setup) {
        // Regular sign-in via magic link (no password setup needed)
        setIsAuthLoading(false);
        navigate("/dashboard");
      } else if (event === "INITIAL_SESSION") {
        // Initial session loaded - if we're still waiting, check again
        if (session && setup === "password") {
          setViewMode("set-password");
          setIsAuthLoading(false);
        } else if (!isAwaitingAuth) {
          setIsAuthLoading(false);
        }
      }
    });

    // Safety timeout: if auth exchange takes too long (e.g., expired link),
    // stop loading so the user can see the login form or an error dialog
    const timeout = setTimeout(() => {
      setIsAuthLoading(false);
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password. Please try again.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        toast.success("Welcome back!");
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/login`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setResetSent(true);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (err) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Password updated successfully!");
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Error updating password:", err);
      toast.error(err?.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Password set successfully! You can now log in with your email and password.");
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Error setting password:", err);
      toast.error(err?.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-white">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-white">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90"
        disabled={isLoading}
      >
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>

      <button
        type="button"
        onClick={() => setViewMode("reset-request")}
        className="w-full text-center text-white/70 hover:text-white text-sm transition-colors"
      >
        Forgot your password?
      </button>
    </form>
  );

  const renderResetRequestForm = () => (
    <div className="space-y-6">
      {resetSent ? (
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
            <Mail className="h-8 w-8 text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Check Your Email</h2>
          <p className="text-white/70">
            We've sent a password reset link to <strong className="text-white">{email}</strong>
          </p>
          <p className="text-white/60 text-sm">
            Didn't receive the email? Check your spam folder or try again.
          </p>
          <div className="pt-4 space-y-3">
            <Button
              onClick={() => {
                setResetSent(false);
                setEmail("");
              }}
              variant="outline"
              className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Try Different Email
            </Button>
            <button
              onClick={() => {
                setViewMode("login");
                setResetSent(false);
              }}
              className="w-full text-center text-white/70 hover:text-white text-sm transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handlePasswordResetRequest} className="space-y-6">
          <p className="text-white/70 text-center">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="reset-email" className="text-white">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="reset-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>

          <button
            type="button"
            onClick={() => setViewMode("login")}
            className="w-full text-center text-white/70 hover:text-white text-sm transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </button>
        </form>
      )}
    </div>
  );

  const renderResetConfirmForm = () => (
    <form onSubmit={handlePasswordUpdate} className="space-y-6">
      <p className="text-white/70 text-center">
        Enter your new password below.
      </p>
      
      <div className="space-y-2">
        <Label htmlFor="new-password" className="text-white">New Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="new-password"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
            required
            minLength={6}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password" className="text-white">Confirm Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="confirm-password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
            required
            minLength={6}
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90"
        disabled={isLoading}
      >
        {isLoading ? "Updating..." : "Update Password"}
      </Button>
    </form>
  );

  const renderSetPasswordForm = () => (
    <form onSubmit={handleSetPassword} className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 mb-2">
          <CheckCircle className="h-6 w-6 text-green-400" />
        </div>
        <p className="text-white/70">
          Welcome! Set a password so you can easily log in next time.
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="set-password" className="text-white">Choose a Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="set-password"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
            required
            minLength={6}
          />
        </div>
        <p className="text-xs text-white/50">At least 6 characters</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-set-password" className="text-white">Confirm Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="confirm-set-password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
            required
            minLength={6}
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90"
        disabled={isLoading}
      >
        {isLoading ? "Setting Password..." : "Set Password & Continue"}
      </Button>

      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        className="w-full text-center text-white/70 hover:text-white text-sm transition-colors"
      >
        Skip for now
      </button>
    </form>
  );

  const getTitle = () => {
    switch (viewMode) {
      case "reset-request":
        return "Reset Password";
      case "reset-confirm":
        return "Create New Password";
      case "set-password":
        return "Set Your Password";
      default:
        return "Client Portal & Member Sign In";
    }
  };

  const getIcon = () => {
    switch (viewMode) {
      case "reset-request":
      case "reset-confirm":
        return <KeyRound className="h-8 w-8 text-primary" />;
      case "set-password":
        return <CheckCircle className="h-8 w-8 text-primary" />;
      default:
        return <Lock className="h-8 w-8 text-primary" />;
    }
  };

  // Show a loading state while Supabase is processing auth tokens
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <SEOHead 
          title="Sign In | Sienvi Client & Member Portal" 
          description="Access your Sienvi client dashboard to manage ad analytics, track project progress, complete onboarding, and access secure agency resources."
          canonical="https://sienvi.com/login"
        />
        <Navbar />
        <main className="flex-1 hero-gradient flex items-center justify-center px-4 py-20">
          <div className="w-full max-w-md">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <h1 className="text-2xl font-bold text-white">Setting Up Your Account</h1>
                <p className="text-white/60">Please wait while we verify your access...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead 
        title="Sign In | Sienvi Client & Member Portal" 
        description="Access your Sienvi client dashboard to manage ad analytics, track project progress, complete onboarding, and access secure agency resources."
        canonical="https://sienvi.com/login"
      />
      <Navbar />
      <main className="flex-1 hero-gradient flex flex-col items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
                {getIcon()}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{getTitle()}</h1>
              {viewMode === "login" && (
                <p className="text-white/70 mt-2 text-sm font-light">Access your custom agency workspace & real-time analytics</p>
              )}
            </div>

            {viewMode === "login" && renderLoginForm()}
            {viewMode === "reset-request" && renderResetRequestForm()}
            {viewMode === "reset-confirm" && renderResetConfirmForm()}
            {viewMode === "set-password" && renderSetPasswordForm()}
          </div>

          {viewMode === "login" && (
            <p className="text-center text-white/50 mt-6 text-sm">
              New client? You'll receive an invitation link after signing up.
            </p>
          )}
        </div>

        {/* Informational SEO & Portal Features Section */}
        <section className="w-full max-w-4xl mt-20 px-4">
          <div className="bg-card/85 border border-dashed border-border backdrop-blur-md rounded-2xl p-8 md:p-12 shadow-xl">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-white mb-3 flex items-center justify-center gap-2">
                <ShieldCheck className="h-6 w-6 text-primary" />
                Sienvi Client & Partner Portal Features
              </h2>
              <p className="text-gray-300 text-sm font-light max-w-xl mx-auto">
                Our secure client portal provides full transparency and real-time oversight for all your agency projects, ad campaigns, and automated workflows.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                <BarChart3 className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Live Performance Analytics</h3>
                <p className="text-xs text-gray-400 font-light leading-relaxed">
                  Monitor campaign metrics across Meta, Google, TikTok, and Amazon Ads with real-time KPI tracking and transparent ROI reports.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                <FileText className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Service Scoping & Contracts</h3>
                <p className="text-xs text-gray-400 font-light leading-relaxed">
                  Review service level agreements, submit onboarding discovery forms, and approve deliverables seamlessly online.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                <Calendar className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">Direct Strategy Booking</h3>
                <p className="text-xs text-gray-400 font-light leading-relaxed">
                  Schedule one-on-one strategic consulting sessions and connect directly with your dedicated account leads.
                </p>
              </div>
            </div>

            <div className="border-t border-white/10 pt-8">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Frequently Asked Portal Questions
              </h3>
              <div className="space-y-4 text-sm font-light">
                <div>
                  <h4 className="font-medium text-white">How do I obtain my Sienvi portal login credentials?</h4>
                  <p className="text-gray-400 text-xs mt-1">
                    Upon partnering with Sienvi, an invitation email with a secure setup link is dispatched to set your account password and access your dashboard.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-white">Need help logging into your client dashboard?</h4>
                  <p className="text-gray-400 text-xs mt-1">
                    If you forgot your password or need access permissions updated, click "Forgot your password?" above or contact our team directly at <a href="mailto:info@sienvi.com" className="text-primary hover:underline">info@sienvi.com</a>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ClientLogin;
