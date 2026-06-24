import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, KeyRound } from "lucide-react";

export const AuthErrorHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{
    code: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    // Check both hash params and search params
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    const searchParams = new URLSearchParams(window.location.search);

    const error = hashParams.get("error") || searchParams.get("error");
    const errorCode = hashParams.get("error_code") || searchParams.get("error_code");
    const errorDesc = hashParams.get("error_description") || searchParams.get("error_description");

    if (error || errorCode || errorDesc) {
      setErrorDetails({
        code: errorCode || error || "unknown_error",
        description: errorDesc ? decodeURIComponent(errorDesc.replace(/\+/g, " ")) : "An unknown authentication error occurred.",
      });
      setIsOpen(true);

      // Clear hash/query parameter to prevent repeating on refresh
      // Create new URL without the error hash/query parameters
      const cleanUrl = window.location.pathname + window.location.search.replace(/[?&]error[^&]*/g, "").replace(/^&/, "?");
      window.history.replaceState({}, document.title, cleanUrl);
      return;
    }

    // Redirect user to the login/setup page if they land elsewhere (like home page) with invite/signup/recovery hash
    const type = hashParams.get("type");
    if (type && location.pathname !== "/login") {
      if (type === "invite" || type === "signup") {
        navigate(`/login?setup=password#${hash}`);
      } else if (type === "recovery") {
        navigate(`/login#${hash}`);
      }
    }
  }, [location, navigate]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleGoToLogin = () => {
    setIsOpen(false);
    navigate("/login");
  };

  if (!errorDetails) return null;

  const isLinkExpired = errorDetails.code === "otp_expired" || errorDetails.description.toLowerCase().includes("expired");

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md bg-white border border-slate-100 rounded-2xl shadow-xl">
        <DialogHeader className="space-y-3 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 animate-pulse">
            {isLinkExpired ? (
              <KeyRound className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <DialogTitle className="text-xl font-bold text-slate-800">
            {isLinkExpired ? "Login Link Expired" : "Authentication Error"}
          </DialogTitle>
          <DialogDescription className="text-slate-600 text-sm leading-relaxed max-w-sm">
            {isLinkExpired 
              ? "The login or invitation link you clicked is invalid or has expired. For security reasons, these links are only valid for a limited time."
              : errorDetails.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 sm:justify-center">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            className="sm:w-32 border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Close
          </Button>
          <Button 
            onClick={handleGoToLogin} 
            className="sm:w-48 bg-primary hover:bg-primary/90 text-white font-semibold shadow-md shadow-primary/20"
          >
            Go to Login
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
