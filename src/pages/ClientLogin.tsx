import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, Mail, ArrowLeft, KeyRound, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type ViewMode = "login" | "reset-request" | "reset-confirm";

const ClientLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("login");
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  // Check if user is coming from a password reset link
  useEffect(() => {
    const checkForPasswordReset = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get("type");
      
      if (type === "recovery") {
        setViewMode("reset-confirm");
      }
    };
    
    checkForPasswordReset();

    // Listen for auth state changes (for password reset flow)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setViewMode("reset-confirm");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
    } catch (err) {
      toast.error("An unexpected error occurred.");
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

  const getTitle = () => {
    switch (viewMode) {
      case "reset-request":
        return "Reset Password";
      case "reset-confirm":
        return "Create New Password";
      default:
        return "Client Login";
    }
  };

  const getIcon = () => {
    switch (viewMode) {
      case "reset-request":
      case "reset-confirm":
        return <KeyRound className="h-8 w-8 text-primary" />;
      default:
        return <Lock className="h-8 w-8 text-primary" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 hero-gradient flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
                {getIcon()}
              </div>
              <h1 className="text-2xl font-bold text-white">{getTitle()}</h1>
              {viewMode === "login" && (
                <p className="text-white/60 mt-2">Access your client dashboard</p>
              )}
            </div>

            {viewMode === "login" && renderLoginForm()}
            {viewMode === "reset-request" && renderResetRequestForm()}
            {viewMode === "reset-confirm" && renderResetConfirmForm()}
          </div>

          {viewMode === "login" && (
            <p className="text-center text-white/50 mt-6 text-sm">
              New client? You'll receive an invite email after signing up.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ClientLogin;
