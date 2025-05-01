import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Menu, X } from 'lucide-react';

// Updated Google Calendar appointment URL
const CALENDAR_BOOKING_URL = "https://calendar.app.google/EgRs3h4riwwpo4cs6";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleBookCall = () => {
    // Use window.location.href instead of window.open for consistent behavior
    window.location.href = CALENDAR_BOOKING_URL;
  };

  return (
    <nav className="py-4 bg-white sticky top-0 z-50 shadow-sm">
      <div className="container-custom flex justify-between items-center">
        <div className="flex items-center">
          <a href="/" className="text-lg font-bold">Sienvi</a>
        </div>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <a href="#services" className="text-sm font-medium hover:text-plc-purple transition-colors">Services</a>
          <a href="#about" className="text-sm font-medium hover:text-plc-purple transition-colors">About</a>
          <a href="#process" className="text-sm font-medium hover:text-plc-purple transition-colors">Process</a>
          <a href="#pricing" className="text-sm font-medium hover:text-plc-purple transition-colors">Pricing</a>
          <a href="#contact" className="text-sm font-medium hover:text-plc-purple transition-colors">Contact</a>
          <Button 
            size="sm" 
            className="ml-4 bg-plc-purple hover:bg-plc-purple/90 text-white"
            onClick={handleBookCall}
          >
            Book a Call
          </Button>
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden flex items-center" 
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white py-4 px-4 shadow-md absolute w-full">
          <div className="flex flex-col space-y-4">
            <a 
              href="#services" 
              className="text-sm font-medium hover:text-plc-purple transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Services
            </a>
            <a 
              href="#about" 
              className="text-sm font-medium hover:text-plc-purple transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </a>
            <a 
              href="#process" 
              className="text-sm font-medium hover:text-plc-purple transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Process
            </a>
            <a 
              href="#pricing" 
              className="text-sm font-medium hover:text-plc-purple transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </a>
            <a 
              href="#contact" 
              className="text-sm font-medium hover:text-plc-purple transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </a>
            <Button 
              size="sm" 
              className="w-full bg-plc-purple hover:bg-plc-purple/90 text-white"
              onClick={handleBookCall}
            >
              Book a Call
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
