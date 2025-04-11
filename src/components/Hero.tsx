
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="bg-plc-dark text-white py-24 md:py-32">
      <div className="container-custom">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="inline-block bg-white/10 backdrop-blur-sm rounded-full px-4 py-1 mb-8">
            <span className="text-xs font-medium">Premium Agency Support</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Turn Your Vision Into{" "}
            <span className="text-plc-purple">Business Reality</span>
          </h1>
          
          <p className="text-lg text-gray-300 mb-10 max-w-3xl">
            Park Lines Concepts helps entrepreneurs, course creators, and small businesses 
            scale with premium agency services, coaching, and AI automation tools.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto">
            <Button className="w-full bg-plc-purple hover:bg-plc-purple/90 text-white button-shadow">
              Book Your Strategy Call
            </Button>
            <Button variant="outline" className="w-full text-white border-white/30 hover:bg-white/10">
              Explore Services
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
