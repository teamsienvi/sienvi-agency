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
            // Redirect to onboarding with email
            navigate(`/onboarding/services?email=${encodeURIComponent(data.email)}`);
            return;
          }
        } catch (err) {
          console.error("Error fetching session:", err);
        }
      }
      
      // If no session_id or error, show success page
      setIsLoading(false);
    };

    handleRedirect();
  }, [searchParams, navigate]);

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
