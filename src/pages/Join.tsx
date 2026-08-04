import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const Join = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionConflict, setSessionConflict] = useState<{
    currentEmail: string;
    clientEmail: string;
    targetUrl: string;
  } | null>(null);

  useEffect(() => {
    const resolveLink = async () => {
      const code = searchParams.get("c") || searchParams.get("code");
      const id = searchParams.get("id");

      if (!code && !id) {
        setError("Invalid link format. Please check the URL provided by your administrator.");
        setLoading(false);
        return;
      }

      try {
        const queryParam = code ? `c=${encodeURIComponent(code)}` : `id=${encodeURIComponent(id || "")}`;
        const response = await supabase.functions.invoke(`resolve-join-link?${queryParam}`);

        if (response.error) {
          throw new Error(response.error.message || "Failed to resolve link");
        }

        if (response.data?.error) {
          throw new Error(response.data.error);
        }

        const targetUrl = response.data?.targetUrl;
        const clientEmail = response.data?.clientEmail;
        const redirectPath = response.data?.redirectPath;

        if (!targetUrl) {
          throw new Error("No target URL received");
        }

        // Check if someone is already logged in
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user?.email) {
          const currentEmail = session.user.email.toLowerCase();
          const linkEmail = (clientEmail || "").toLowerCase();

          if (currentEmail === linkEmail) {
            // Client is already signed in as themselves — just navigate to the right step
            // No need to use the magic link at all
            navigate(redirectPath || "/dashboard", { replace: true });
            return;
          } else {
            // Different user (e.g., admin testing a client link) — warn before switching
            setSessionConflict({
              currentEmail: session.user.email,
              clientEmail: clientEmail || "the client",
              targetUrl,
            });
            setLoading(false);
            return;
          }
        }

        // No existing session — proceed directly with magic link
        window.location.href = targetUrl;
      } catch (err: any) {
        console.error("Join link resolution error:", err);
        setError(err.message || "Unable to load your invitation link. Please contact support.");
        setLoading(false);
      }
    };

    resolveLink();
  }, [searchParams, navigate]);

  const handleProceedWithSwitch = async () => {
    if (!sessionConflict) return;
    setLoading(true);
    // Sign out current session first, then redirect to the magic link
    await supabase.auth.signOut();
    window.location.href = sessionConflict.targetUrl;
  };

  const handleCancel = () => {
    // Go back to wherever the user was
    window.location.href = "/admin/dashboard";
  };

  // Warning: logged in as a different user
  if (sessionConflict) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="max-w-md w-full text-center space-y-6 bg-slate-900 border border-slate-800 p-8 rounded-xl shadow-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 mb-2">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Already Signed In</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            You're currently signed in as <span className="text-white font-medium">{sessionConflict.currentEmail}</span>.
            This link is for <span className="text-white font-medium">{sessionConflict.clientEmail}</span>.
            Continuing will sign you out and switch accounts.
          </p>
          <div className="pt-2 flex flex-col gap-3">
            <Button
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium"
              onClick={handleProceedWithSwitch}
            >
              Sign Out & Continue as Client
            </Button>
            <Button
              variant="outline"
              className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={handleCancel}
            >
              Cancel — Stay Signed In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="max-w-md w-full text-center space-y-6 bg-slate-900 border border-slate-800 p-8 rounded-xl shadow-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-400 mb-2">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            {error.includes("already been set up") ? "Account Already Active" : "Link Expired or Invalid"}
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">{error}</p>
          <div className="pt-2">
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
              onClick={() => (window.location.href = "/login")}
            >
              Go to Member Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white px-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="relative inline-block">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mx-auto mb-2">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Authenticating...</h2>
          <p className="text-xs text-slate-400 mt-1">Connecting you to Sienvi Client Portal</p>
        </div>
      </div>
    </div>
  );
};

export default Join;
