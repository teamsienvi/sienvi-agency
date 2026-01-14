import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Copy, ExternalLink, Check } from "lucide-react";

interface Client {
  id: string;
  email: string | null;
  clientName: string | null;
  plan: string | null;
  customPrice: number | null;
  paymentMethod: string;
  selectedServices: string[];
}

interface MigrateToStripeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onMigrationStarted: () => void;
}

export const MigrateToStripeModal = ({
  open,
  onOpenChange,
  client,
  onMigrationStarted,
}: MigrateToStripeModalProps) => {
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [customPrice, setCustomPrice] = useState<number>(client?.customPrice || 0);

  const handleMigrate = async () => {
    if (!client) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const response = await supabase.functions.invoke("migrate-client-to-stripe", {
        body: {
          clientId: client.id,
          customPrice: client.plan === "custom" ? customPrice : undefined,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      setCheckoutUrl(response.data.checkoutUrl);
      toast.success("Migration checkout link generated!");
      onMigrationStarted();
    } catch (error: any) {
      console.error("Error migrating client:", error);
      toast.error(error.message || "Failed to generate migration link");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!checkoutUrl) return;
    await navigator.clipboard.writeText(checkoutUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const openCheckoutLink = () => {
    if (checkoutUrl) {
      window.open(checkoutUrl, "_blank");
    }
  };

  const handleClose = () => {
    setCheckoutUrl(null);
    setCopied(false);
    onOpenChange(false);
  };

  if (!client) return null;

  const planLabels: Record<string, string> = {
    single: "Single Service",
    triple: "Triple Automation",
    full: "Full Automation",
    custom: "Custom Plan",
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Migrate to Stripe</DialogTitle>
          <DialogDescription>
            Generate a Stripe checkout link to migrate this client from manual payment to Stripe billing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Client Info */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Client</span>
              <span className="font-medium">{client.clientName || client.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="font-medium">{client.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Plan</span>
              <Badge variant="secondary">{planLabels[client.plan || ""] || client.plan}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Payment</span>
              <Badge variant="outline" className="capitalize">{client.paymentMethod}</Badge>
            </div>
            {client.selectedServices.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">Services</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {client.selectedServices.map((service, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Custom Price (for custom plans) */}
          {client.plan === "custom" && !checkoutUrl && (
            <div className="space-y-2">
              <Label htmlFor="customPrice">Monthly Price ($)</Label>
              <Input
                id="customPrice"
                type="number"
                min="0"
                step="0.01"
                value={customPrice}
                onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                This will create a custom Stripe price for this client.
              </p>
            </div>
          )}

          {/* Checkout URL Result */}
          {checkoutUrl && (
            <div className="space-y-3">
              <Label>Checkout Link</Label>
              <div className="flex gap-2">
                <Input
                  value={checkoutUrl}
                  readOnly
                  className="text-xs font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Send this link to the client. Once they complete checkout, their account will be automatically migrated to Stripe billing.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {!checkoutUrl ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleMigrate} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Generate Checkout Link
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={openCheckoutLink}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Link
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
