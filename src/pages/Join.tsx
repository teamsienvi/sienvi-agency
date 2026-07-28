import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const Join = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        if (targetUrl) {
          // Immediately redirect client to their Supabase auth magic link
          window.location.href = targetUrl;
        } else {
          throw new Error("No target URL received");
        }
      } catch (err: any) {
        console.error("Join link resolution error:", err);
        setError(err.message || "Unable to load your invitation link. Please contact support.");
        setLoading(false);
      }
    };

    resolveLink();
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="max-w-md w-full text-center space-y-6 bg-slate-900 border border-slate-800 p-8 rounded-xl shadow-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-400 mb-2">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Link Expired or Invalid</h2>
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
