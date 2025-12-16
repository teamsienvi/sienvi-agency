import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-plc-dark text-white">
      <div className="container-custom py-12">
        <div className="flex justify-center mb-8">
          <img 
            src="/lovable-uploads/9db0c2f7-eb51-4b0e-9a7f-6826c267607d.png" 
            alt="Sienvi Logo" 
            className="h-[100pt] w-auto"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">Sienvi</h3>
            <p className="text-gray-400 text-sm mb-4">
              Transforming businesses through expert agency support, coaching, and AI-driven automation solutions.
            </p>
            <div className="flex space-x-4">
              <a href="https://x.com/Sienviagency" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/sienviagency/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://www.facebook.com/profile.php?id=61581875227035" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://www.linkedin.com/in/sienvi-agency-8961b2385/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Services</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Agency Support</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Coaching</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Web Development</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">AI Automation</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">About Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Our Process</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Pricing</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Contact</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Contact Us</h3>
            <a href="mailto:info@sienvi.com" className="text-gray-400 hover:text-white transition-colors text-sm block mb-2">
              info@sienvi.com
            </a>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">© 2024 Sienvi. All rights reserved.</p>
          <div className="mt-4 md:mt-0">
            <a href="#" className="text-gray-500 hover:text-white text-sm mx-3">Terms of Service</a>
            <a href="#" className="text-gray-500 hover:text-white text-sm mx-3">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
