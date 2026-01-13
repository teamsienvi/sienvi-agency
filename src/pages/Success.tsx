import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Success = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<{
    email: string;
    plan: string;
    selectedServices: string[];
  } | null>(null);
  
  useEffect(() => {
    const handleRedirect = async () => {
      const sessionId = searchParams.get("session_id");
      
      if (sessionId) {
        try {
          // Fetch session details from Stripe via edge function
          const { data, error } = await supabase.functions.invoke("get-checkout-session", {
            body: { sessionId },
          });
          
          if (error) throw error;
          
          if (data?.email) {
            // Get services from session storage (set before checkout)
            const pendingServices = sessionStorage.getItem("pending_services");
            const pendingPlan = sessionStorage.getItem("pending_plan");
            
            setSubscriptionData({
              email: data.email,
              plan: data.plan || pendingPlan || "single",
              selectedServices: pendingServices ? JSON.parse(pendingServices) : [],
            });
            
            // Clear session storage
            sessionStorage.removeItem("pending_services");
            sessionStorage.removeItem("pending_plan");
          }
        } catch (err) {
          console.error("Error fetching session:", err);
        }
      }
      
      setIsLoading(false);
    };

    handleRedirect();
  }, [searchParams]);

  if (isLoading) {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      return (
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Setting up your account...</p>
            </div>
          </main>
          <Footer />
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-20">
        <motion.div
          className="text-center px-4 max-w-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          </motion.div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Welcome to Sienvi!
          </h1>
          
          <p className="text-muted-foreground mb-8">
            Your subscription has been activated successfully and your services are being set up. 
            Our team will be in touch shortly to get you started.
          </p>
          
          {subscriptionData?.selectedServices && subscriptionData.selectedServices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card border border-border rounded-lg p-6 mb-8 text-left"
            >
              <h3 className="font-semibold mb-3">Your selected services:</h3>
              <ul className="space-y-2">
                {subscriptionData.selectedServices.map((service) => (
                  <li key={service} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="capitalize">{service.replace(/-/g, ' ')}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
          
          <Button
            onClick={() => navigate("/")}
            className="bg-primary hover:bg-primary/90"
          >
            Return to Home
          </Button>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Success;
