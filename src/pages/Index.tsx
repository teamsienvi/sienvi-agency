
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ServicePreview from "@/components/ServicePreview";
import Services from "@/components/Services";
import About from "@/components/About";
import Process from "@/components/Process";
import Pricing from "@/components/Pricing";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const Index = () => {
  return (
    <motion.div 
      className="min-h-screen bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Navbar />
      <Hero />
      <ServicePreview />
      <Services />
      <About />
      <Process />
      <Pricing />
      <Contact />
      <Footer />
    </motion.div>
  );
};

export default Index;
