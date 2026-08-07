import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, Link, Loader2, Check, Copy, ExternalLink } from "lucide-react";

interface CreatedClient {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  plan: string;
  subscriptionStatus: string;
  customPrice?: number | null;
  maxServices?: number | null;
}

interface ClientCreatedActionsProps {
  client: CreatedClient;
  onDone: () => void;
}

export const ClientCreatedActions = ({ client, onDone }: ClientCreatedActionsProps) => {
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [onboardingLink, setOnboardingLink] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [checkoutLink, setCheckoutLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCheckout, setCopiedCheckout] = useState(false);

  const handleGenerateOnboardingLink = async () => {
    setSendingInvite(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const clientName = [client.firstName, client.lastName].filter(Boolean).join(" ") || null;

      const response = await supabase.functions.invoke("send-login-invite", {
        body: {
          clientId: client.id,
          clientEmail: client.email,
          clientName,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        let errMsg = response.error.message;
        try {
          const errorContext = (response.error as any).context;
          if (errorContext && typeof errorContext.json === "function") {
            const body = await errorContext.json();
            if (body?.error) errMsg = body.error;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }
      if (response.data?.error) throw new Error(response.data.error);

      const generatedUrl = response.data.loginUrl;
      if (generatedUrl) {
        setOnboardingLink(generatedUrl);
        await navigator.clipboard.writeText(generatedUrl);
        setCopiedLink(true);
        toast.success("1-Click Onboarding Link copied to clipboard!");
        setTimeout(() => setCopiedLink(false), 3000);
      } else {
        toast.success(response.data.message || "Invite created!");
      }
      setInviteSent(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to generate onboarding link";
      console.error("Error generating onboarding link:", error);
      toast.error(message);
    } finally {
      setSendingInvite(false);
    }
  };

  const handleGenerateCheckoutLink = async () => {
    setGeneratingLink(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("generate-checkout-link", {
        body: {
          clientId: client.id,
          clientEmail: client.email,
          plan: client.plan,
          customPrice: client.customPrice,
          selectedServices: [],
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data.error) throw new Error(response.data.error);

      setCheckoutLink(response.data.checkoutUrl);
      toast.success("Checkout link generated!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to generate link";
      console.error("Error generating checkout link:", error);
      toast.error(message);
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyOnboardingToClipboard = async () => {
    if (!onboardingLink) return;
    await navigator.clipboard.writeText(onboardingLink);
    setCopiedLink(true);
    toast.success("Onboarding link copied to clipboard");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyCheckoutToClipboard = async () => {
    if (!checkoutLink) return;
    await navigator.clipboard.writeText(checkoutLink);
    setCopiedCheckout(true);
    toast.success("Checkout link copied to clipboard");
    setTimeout(() => setCopiedCheckout(false), 2000);
  };

  const clientName = [client.firstName, client.lastName].filter(Boolean).join(" ") || client.email;

  return (
    <Card className="border-green-500/30 bg-green-500/5">
      <CardHeader>
        <CardTitle className="text-green-600 flex items-center gap-2">
          <Check className="w-5 h-5" />
          Client Created Successfully
        </CardTitle>
        <CardDescription>
          {clientName} has been added to your client list
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Email</p>
          <p className="font-medium">{client.email}</p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">What would you like to do next?</p>
          
          <Button
            onClick={handleGenerateOnboardingLink}
            disabled={sendingInvite}
            className="w-full justify-start bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {sendingInvite ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : onboardingLink ? (
              <Check className="w-4 h-4 mr-2 text-green-400" />
            ) : (
              <Link className="w-4 h-4 mr-2" />
            )}
            {onboardingLink ? "Copy Onboarding Link Again" : "Generate 1-Click Client Onboarding Link"}
          </Button>

          {onboardingLink && (
            <div className="bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">1-Click Client Onboarding URL:</span>
                <span className="text-[10px] bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 px-1.5 py-0.5 rounded font-mono">
                  {client.plan === "prospect" ? "Sign Up ➔ Discovery Questions" : "Sign Up ➔ Contract ➔ Payment ➔ Access"}
                </span>
              </div>
              <div className="flex gap-2">
                <code className="flex-1 text-xs bg-white dark:bg-background p-2 rounded border border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-100 font-mono break-all max-h-20 overflow-y-auto">
                  {onboardingLink}
                </code>
                <Button size="sm" variant="outline" onClick={copyOnboardingToClipboard} className="bg-white dark:bg-card">
                  {copiedLink ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-indigo-600" />}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-white dark:bg-card"
                  onClick={() => window.open(onboardingLink, "_blank")}
                >
                  <ExternalLink className="w-4 h-4 text-indigo-600" />
                </Button>
              </div>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-light">
                Send this single link directly to your client via chat or email.
              </p>
            </div>
          )}

          {client.subscriptionStatus === "pending_payment" && (
            <>
              <Button
                onClick={handleGenerateCheckoutLink}
                disabled={generatingLink || !!checkoutLink}
                variant="outline"
                className="w-full justify-start"
              >
                {generatingLink ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Link className="w-4 h-4 mr-2" />
                )}
                {checkoutLink ? "Checkout Link Ready" : "Generate Checkout Link Only"}
              </Button>

              {checkoutLink && (
                <div className="bg-muted rounded-lg p-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Checkout URL:</p>
                  <div className="flex gap-2">
                    <code className="flex-1 text-xs bg-background p-2 rounded break-all">
                      {checkoutLink}
                    </code>
                    <Button size="sm" variant="ghost" onClick={copyCheckoutToClipboard}>
                      {copiedCheckout ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => window.open(checkoutLink, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <Button onClick={onDone} variant="outline" className="w-full mt-4">
          Done
        </Button>
      </CardContent>
    </Card>
  );
};