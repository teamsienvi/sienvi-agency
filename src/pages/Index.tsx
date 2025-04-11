
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ServicePreview from "@/components/ServicePreview";
import Services from "@/components/Services";
import About from "@/components/About";
import Process from "@/components/Process";
import Pricing from "@/components/Pricing";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <ServicePreview />
      <Services />
      <About />
      <Process />
      <Pricing />
      <Contact />
      <Footer />
    </div>
  );
};

export default Index;
