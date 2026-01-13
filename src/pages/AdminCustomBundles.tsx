import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  LogOut,
  Package,
  DollarSign,
  Users,
  FileText,
  Mail,
  User,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  ArrowLeft,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CreatedBundle {
  checkoutUrl: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  maxServices: number;
  createdAt: Date;
}

const AdminCustomBundles = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Auth state
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Form state
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [maxServices, setMaxServices] = useState("3");
  const [notes, setNotes] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  // Result state
  const [createdBundle, setCreatedBundle] = useState<CreatedBundle | null>(null);
  const [copied, setCopied] = useState(false);
  const [recentBundles, setRecentBundles] = useState<CreatedBundle[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/admin");
        return;
      }

      // Check if user has admin role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        navigate("/admin");
        return;
      }

      setUser(session.user);
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/admin");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!clientName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a client name.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount < 1) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid price (minimum $1).",
        variant: "destructive",
      });
      return;
    }

    if (clientEmail && !clientEmail.includes("@")) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "create-custom-checkout-session",
        {
          body: {
            clientName: clientName.trim(),
            clientEmail: clientEmail.trim() || undefined,
            customAmount: amount,
            maxServices: parseInt(maxServices),
            notes: notes.trim() || undefined,
          },
        }
      );

      if (error) {
        console.error("Checkout error:", error);
        toast({
          title: "Error",
          description: "Failed to create checkout session. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        const bundle: CreatedBundle = {
          checkoutUrl: data.url,
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim(),
          amount,
          maxServices: parseInt(maxServices),
          createdAt: new Date(),
        };
        
        setCreatedBundle(bundle);
        setRecentBundles((prev) => [bundle, ...prev.slice(0, 4)]);
        
        toast({
          title: "Bundle Created!",
          description: "Checkout link is ready to share.",
        });
        
        // Reset form
        setClientName("");
        setClientEmail("");
        setCustomAmount("");
        setMaxServices("3");
        setNotes("");
      } else {
        toast({
          title: "Error",
          description: "No checkout URL received. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Checkout link copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1219] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1219]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/dashboard")}
                className="text-gray-400 hover:text-white hover:bg-[#2a3142] -ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Package className="h-8 w-8 text-cyan-400" />
              Custom Bundles
            </h1>
            <p className="text-gray-400 mt-1">
              Create custom automation packages with flexible pricing
            </p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-[#2a3142] bg-[#1a1f2e] text-white hover:bg-[#2a3142]"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Bundle Form */}
          <Card className="lg:col-span-2 bg-[#1a1f2e] border-[#2a3142]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cyan-400" />
                Create Custom Bundle
              </CardTitle>
              <CardDescription className="text-gray-400">
                Generate a Stripe checkout link for a custom automation package
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Client Name */}
                <div className="space-y-2">
                  <Label htmlFor="clientName" className="text-gray-300 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    Client Name *
                  </Label>
                  <Input
                    id="clientName"
                    type="text"
                    placeholder="John Smith"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                    className="bg-[#0f1219] border-[#2a3142] text-white placeholder:text-gray-500 focus:border-cyan-500"
                  />
                </div>

                {/* Client Email */}
                <div className="space-y-2">
                  <Label htmlFor="clientEmail" className="text-gray-300 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    Client Email (Optional)
                  </Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    placeholder="client@example.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="bg-[#0f1219] border-[#2a3142] text-white placeholder:text-gray-500 focus:border-cyan-500"
                  />
                  <p className="text-xs text-gray-500">
                    If provided, the email will be pre-filled at checkout
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Custom Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="customAmount" className="text-gray-300 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      Monthly Price (USD) *
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
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
                        className="pl-7 bg-[#0f1219] border-[#2a3142] text-white placeholder:text-gray-500 focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Max Services */}
                  <div className="space-y-2">
                    <Label htmlFor="maxServices" className="text-gray-300 flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      Services Included *
                    </Label>
                    <Select value={maxServices} onValueChange={setMaxServices}>
                      <SelectTrigger className="bg-[#0f1219] border-[#2a3142] text-white focus:border-cyan-500">
                        <SelectValue placeholder="Select services" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1f2e] border-[#2a3142]">
                        <SelectItem value="1" className="text-white hover:bg-[#2a3142]">1 Service</SelectItem>
                        <SelectItem value="2" className="text-white hover:bg-[#2a3142]">2 Services</SelectItem>
                        <SelectItem value="3" className="text-white hover:bg-[#2a3142]">3 Services</SelectItem>
                        <SelectItem value="4" className="text-white hover:bg-[#2a3142]">4 Services</SelectItem>
                        <SelectItem value="5" className="text-white hover:bg-[#2a3142]">5 Services</SelectItem>
                        <SelectItem value="6" className="text-white hover:bg-[#2a3142]">6 Services (Full Suite)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-gray-300 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    Internal Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Special terms, client requirements, negotiation details..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="resize-none bg-[#0f1219] border-[#2a3142] text-white placeholder:text-gray-500 focus:border-cyan-500"
                    rows={3}
                  />
                </div>

                {/* Summary Preview */}
                {customAmount && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="bg-cyan-500/10 rounded-lg p-4 border border-cyan-500/20"
                  >
                    <p className="text-sm text-cyan-400 mb-1">Bundle Preview</p>
                    <p className="text-lg font-semibold text-white">
                      ${parseFloat(customAmount).toFixed(2)}/month • {maxServices} service{parseInt(maxServices) > 1 ? "s" : ""}
                      {clientName && ` • ${clientName}`}
                    </p>
                  </motion.div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-6 text-lg font-semibold"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Bundle...
                    </>
                  ) : (
                    <>
                      <Package className="w-5 h-5 mr-2" />
                      Create Custom Bundle
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Result & History */}
          <div className="space-y-6">
            {/* Created Bundle Result */}
            {createdBundle && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-gradient-to-br from-cyan-500/20 to-[#1a1f2e] border-cyan-500/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center gap-2 text-lg">
                      <Check className="h-5 w-5 text-green-400" />
                      Bundle Created!
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      {createdBundle.clientName} • ${createdBundle.amount.toFixed(2)}/mo
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-[#0f1219] rounded-lg p-3 border border-[#2a3142]">
                      <p className="text-xs text-gray-500 mb-1">Checkout Link</p>
                      <p className="text-sm text-cyan-400 break-all line-clamp-2">
                        {createdBundle.checkoutUrl}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleCopyLink(createdBundle.checkoutUrl)}
                        className="flex-1 bg-[#2a3142] hover:bg-[#3a4152] text-white"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Link
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => window.open(createdBundle.checkoutUrl, "_blank")}
                        variant="outline"
                        className="border-[#2a3142] text-cyan-400 hover:bg-[#2a3142]"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Recent Bundles */}
            {recentBundles.length > 0 && (
              <Card className="bg-[#1a1f2e] border-[#2a3142]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <History className="h-5 w-5 text-gray-500" />
                    Recent Bundles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recentBundles.map((bundle, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-[#0f1219] rounded-lg border border-[#2a3142] hover:border-[#3a4152] transition-colors"
                    >
                      <div>
                        <p className="text-white text-sm font-medium">{bundle.clientName}</p>
                        <p className="text-gray-500 text-xs">
                          ${bundle.amount.toFixed(2)}/mo • {bundle.maxServices} services
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyLink(bundle.checkoutUrl)}
                        className="text-gray-400 hover:text-white hover:bg-[#2a3142]"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Info Card */}
            <Card className="bg-[#1a1f2e] border-[#2a3142]">
              <CardContent className="pt-6">
                <div className="space-y-3 text-sm text-gray-400">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-cyan-400 text-xs">1</span>
                    </div>
                    <p>Create bundle with custom pricing</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-cyan-400 text-xs">2</span>
                    </div>
                    <p>Share checkout link with client</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-cyan-400 text-xs">3</span>
                    </div>
                    <p>Client completes payment & selects services</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCustomBundles;
