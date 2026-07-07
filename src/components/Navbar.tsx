import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Menu, X, LogIn, User } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

// Updated Google Calendar appointment URL
const CALENDAR_BOOKING_URL = "https://calendar.app.google/EgRs3h4riwwpo4cs6";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleBookCall = () => {
    window.location.href = CALENDAR_BOOKING_URL;
  };

  const handleLogin = () => {
    setIsMenuOpen(false);
    navigate("/login");
  };

  const handleDashboard = () => {
    setIsMenuOpen(false);
    navigate("/dashboard");
  };

  // Check if we're on landing page (show anchor links) or internal page
  const isLandingPage = location.pathname === "/";

  return (
    <nav className="py-4 bg-slate-950/75 backdrop-blur-md sticky top-0 z-50 border-b border-slate-900/80 shadow-md text-slate-100">
      <div className="container-custom flex justify-between items-center">
        <div className="flex items-center">
          <a href="/" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/9db0c2f7-eb51-4b0e-9a7f-6826c267607d.png" 
              alt="Sienvi Logo" 
              className="h-8 w-auto"
            />
            <span className="text-lg font-bold text-white">Sienvi</span>
          </a>
        </div>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {isLandingPage && (
            <>
              <a href="#services" className="text-sm font-medium text-slate-300 hover:text-primary transition-colors">Services</a>
              <a href="#about" className="text-sm font-medium text-slate-300 hover:text-primary transition-colors">About</a>
              <a href="#process" className="text-sm font-medium text-slate-300 hover:text-primary transition-colors">Process</a>
              <a href="#pricing" className="text-sm font-medium text-slate-300 hover:text-primary transition-colors">Pricing</a>
              <a href="#contact" className="text-sm font-medium text-slate-300 hover:text-primary transition-colors">Contact</a>
            </>
          )}
          <a href="/referral" className="text-sm font-medium text-slate-300 hover:text-primary transition-colors">Referral</a>
          
          {isLoggedIn ? (
            <Button 
              size="sm" 
              variant="outline"
              className="ml-4 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900/60 bg-transparent"
              onClick={handleDashboard}
            >
              <User className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="outline"
              className="ml-4 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900/60 bg-transparent"
              onClick={handleLogin}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Client Login
            </Button>
          )}
          
          <Button 
            size="sm" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            onClick={handleBookCall}
          >
            Book a Call
          </Button>
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden flex items-center text-slate-300 hover:text-white" 
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-slate-950/95 backdrop-blur-md border-b border-slate-900 py-6 px-6 shadow-xl absolute w-full left-0 z-50">
          <div className="flex flex-col space-y-4">
            {isLandingPage && (
              <>
                <a 
                  href="#services" 
                  className="text-sm font-medium text-slate-300 hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Services
                </a>
                <a 
                  href="#about" 
                  className="text-sm font-medium text-slate-300 hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </a>
                <a 
                  href="#process" 
                  className="text-sm font-medium text-slate-300 hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Process
                </a>
                <a 
                  href="#pricing" 
                  className="text-sm font-medium text-slate-300 hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Pricing
                </a>
                <a 
                  href="#contact" 
                  className="text-sm font-medium text-slate-300 hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </a>
              </>
            )}
            <a 
              href="/referral" 
              className="text-sm font-medium text-slate-300 hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Referral
            </a>
            
            {isLoggedIn ? (
              <Button 
                size="sm" 
                variant="outline"
                className="w-full border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900/60 bg-transparent"
                onClick={handleDashboard}
              >
                <User className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline"
                className="w-full border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900/60 bg-transparent"
                onClick={handleLogin}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Client Login
              </Button>
            )}
            
            <Button 
              size="sm" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
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
