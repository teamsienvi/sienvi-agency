import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  ArrowLeft,
  FileSignature,
  Loader2,
  CheckCircle2,
  Shield,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Contract = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [alreadySigned, setAlreadySigned] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/admin");
        return;
      }

      const response = await supabase.functions.invoke("get-client-profile", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error || response.data.error) {
        navigate("/dashboard");
        return;
      }

      const profile = response.data.profile;
      
      // Check if payment is complete
      if (profile.subscriptionStatus !== "active") {
        toast.error("Please complete payment first");
        navigate("/dashboard");
        return;
      }

      // Check if already signed
      if (profile.contractStatus === "signed") {
        setAlreadySigned(true);
      }
    } catch (error: any) {
      console.error("Error checking access:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!agreed) {
      toast.error("Please agree to the terms first");
      return;
    }

    setSigning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("update-client-status", {
        body: { action: "sign_contract" },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data.error) throw new Error(response.data.error);

      toast.success("Contract signed successfully!");
      navigate("/onboarding");
    } catch (error: any) {
      console.error("Error signing contract:", error);
      toast.error(error.message || "Failed to sign contract");
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (alreadySigned) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <Card>
              <CardHeader className="text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <CardTitle>Contract Already Signed</CardTitle>
                <CardDescription>
                  You have already signed the service agreement.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button onClick={() => navigate("/dashboard")}>
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto space-y-6"
        >
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="text-center space-y-2">
            <Badge className="bg-blue-500">Step 2 of 4</Badge>
            <h1 className="text-3xl font-bold">Service Agreement</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Please review and sign the service agreement to continue.
            </p>
          </div>

          {/* Contract Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-primary" />
                <CardTitle>Client Service Agreement</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <div className="bg-muted p-6 rounded-lg max-h-[400px] overflow-y-auto space-y-4 text-sm">
                <h3 className="font-semibold">Terms of Service</h3>
                
                <p>
                  This Service Agreement ("Agreement") is entered into between SIENVI Agency 
                  ("Provider") and the undersigned client ("Client").
                </p>

                <h4 className="font-semibold mt-4">1. Services</h4>
                <p>
                  Provider agrees to deliver the services as outlined in the selected plan, 
                  including but not limited to digital marketing, automation, and related 
                  consulting services.
                </p>

                <h4 className="font-semibold mt-4">2. Payment Terms</h4>
                <p>
                  Client agrees to pay the agreed-upon monthly subscription fee via the 
                  payment method on file. Payments are processed automatically on each 
                  billing cycle.
                </p>

                <h4 className="font-semibold mt-4">3. Term and Termination</h4>
                <p>
                  This Agreement remains in effect for the duration of the subscription. 
                  Either party may terminate with 30 days written notice.
                </p>

                <h4 className="font-semibold mt-4">4. Confidentiality</h4>
                <p>
                  Both parties agree to maintain confidentiality of proprietary information 
                  shared during the course of this engagement.
                </p>

                <h4 className="font-semibold mt-4">5. Limitation of Liability</h4>
                <p>
                  Provider's liability shall be limited to the fees paid by Client in the 
                  12 months preceding any claim.
                </p>

                <h4 className="font-semibold mt-4">6. Governing Law</h4>
                <p>
                  This Agreement shall be governed by the laws of the State of California.
                </p>

                <p className="mt-6 italic text-muted-foreground">
                  By signing below, you acknowledge that you have read, understood, and 
                  agree to be bound by the terms of this Agreement.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <div className="flex items-center space-x-3 w-full p-4 bg-muted/50 rounded-lg">
                <Checkbox 
                  id="agree" 
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked as boolean)}
                />
                <label 
                  htmlFor="agree" 
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  I have read and agree to the terms of this Service Agreement
                </label>
              </div>

              <Button 
                onClick={handleSign} 
                disabled={!agreed || signing}
                className="w-full"
                size="lg"
              >
                {signing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileSignature className="w-4 h-4 mr-2" />
                )}
                Sign Agreement
              </Button>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Your signature is legally binding and securely stored</span>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Contract;