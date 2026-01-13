import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Success = () => {
  const navigate = useNavigate();

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
          
          <p className="text-gray-600 mb-8">
            Your subscription has been activated successfully. We're excited to help you 
            transform your business with our automation services. Our team will be in 
            touch shortly to get you started.
          </p>
          
          <Button
            onClick={() => navigate("/")}
            className="bg-plc-purple hover:bg-plc-purple/90"
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
