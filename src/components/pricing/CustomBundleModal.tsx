import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, DollarSign, Users, FileText, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CustomBundleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CustomBundleModal = ({ isOpen, onClose }: CustomBundleModalProps) => {
  const [customAmount, setCustomAmount] = useState("");
  const [maxServices, setMaxServices] = useState("3");
  const [notes, setNotes] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount < 1) {
      toast.error("Please enter a valid price (minimum $1)");
      return;
    }

    if (!customerEmail || !customerEmail.includes("@")) {
      toast.error("Please enter a valid customer email");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "create-custom-checkout-session",
        {
          body: {
            customAmount: amount,
            maxServices: parseInt(maxServices),
            notes,
            customerEmail,
          },
        }
      );

      if (error) {
        console.error("Checkout error:", error);
        toast.error("Failed to create checkout session. Please try again.");
        return;
      }

      if (data?.url) {
        // Copy the checkout URL to clipboard for sharing
        await navigator.clipboard.writeText(data.url);
        toast.success("Checkout link copied to clipboard!");
        
        // Optionally open the checkout in a new tab
        window.open(data.url, "_blank");
        onClose();
      } else {
        toast.error("No checkout URL received. Please try again.");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCustomAmount("");
    setMaxServices("3");
    setNotes("");
    setCustomerEmail("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background rounded-2xl shadow-2xl z-50 overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
              <div>
                <h2 className="text-xl font-bold text-foreground">Create Custom Bundle</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Set custom pricing for a client
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Customer Email */}
              <div className="space-y-2">
                <Label htmlFor="customerEmail" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Customer Email
                </Label>
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="client@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                  className="bg-muted/50"
                />
              </div>

              {/* Custom Amount */}
              <div className="space-y-2">
                <Label htmlFor="customAmount" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  Monthly Price (USD)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="customAmount"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="1500.00"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    required
                    className="pl-7 bg-muted/50"
                  />
                </div>
              </div>

              {/* Max Services */}
              <div className="space-y-2">
                <Label htmlFor="maxServices" className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  Services Included
                </Label>
                <Select value={maxServices} onValueChange={setMaxServices}>
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Select number of services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Service</SelectItem>
                    <SelectItem value="2">2 Services</SelectItem>
                    <SelectItem value="3">3 Services</SelectItem>
                    <SelectItem value="4">4 Services</SelectItem>
                    <SelectItem value="5">5 Services</SelectItem>
                    <SelectItem value="6">6 Services (Full Suite)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Internal Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Special terms, client requirements, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="resize-none bg-muted/50"
                  rows={3}
                />
              </div>

              {/* Summary */}
              {customAmount && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-primary/10 rounded-lg p-4 border border-primary/20"
                >
                  <p className="text-sm text-muted-foreground">Bundle Summary</p>
                  <p className="text-lg font-semibold text-foreground mt-1">
                    ${parseFloat(customAmount).toFixed(2)}/month • {maxServices} service{parseInt(maxServices) > 1 ? "s" : ""}
                  </p>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleReset}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create & Copy Link"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CustomBundleModal;
