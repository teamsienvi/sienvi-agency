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
}

interface ClientCreatedActionsProps {
  client: CreatedClient;
  onDone: () => void;
}

export const ClientCreatedActions = ({ client, onDone }: ClientCreatedActionsProps) => {
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [checkoutLink, setCheckoutLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSendInvite = async () => {
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

      if (response.error) throw new Error(response.error.message);
      if (response.data.error) throw new Error(response.data.error);

      toast.success("Login invite sent to " + client.email);
      setInviteSent(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to send invite";
      console.error("Error sending invite:", error);
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

  const copyToClipboard = async () => {
    if (!checkoutLink) return;
    await navigator.clipboard.writeText(checkoutLink);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
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
            onClick={handleSendInvite}
            disabled={sendingInvite || inviteSent}
            className="w-full justify-start"
            variant={inviteSent ? "outline" : "default"}
          >
            {sendingInvite ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : inviteSent ? (
              <Check className="w-4 h-4 mr-2 text-green-500" />
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            {inviteSent ? "Invite Sent!" : "Send Login Invite Email"}
          </Button>

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
                {checkoutLink ? "Checkout Link Ready" : "Generate Checkout Link"}
              </Button>

              {checkoutLink && (
                <div className="bg-muted rounded-lg p-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Checkout URL:</p>
                  <div className="flex gap-2">
                    <code className="flex-1 text-xs bg-background p-2 rounded break-all">
                      {checkoutLink}
                    </code>
                    <Button size="sm" variant="ghost" onClick={copyToClipboard}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
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