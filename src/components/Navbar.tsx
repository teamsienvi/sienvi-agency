import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Menu, X, LogIn, User, Sun, Moon } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

// Updated Google Calendar appointment URL
const CALENDAR_BOOKING_URL = "https://calendar.app.google/EgRs3h4riwwpo4cs6";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
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

    // Initialize theme
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    return () => subscription.unsubscribe();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

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
    <nav className="py-1 bg-background/80 backdrop-blur-md sticky top-0 z-50 border-b border-border shadow-sm text-foreground">
      <div className="container-custom flex justify-between items-center">
        <div className="flex items-center">
          <a href="/" className="flex items-center">
            <img 
              src="/assets/sienvi_logo_text.png" 
              alt="Sienvi Logo" 
              className={`h-28 w-auto object-contain hover:scale-105 transition-all duration-300 filter drop-shadow-[0_0_8px_rgba(0,229,255,0.35)] ${theme === 'light' ? 'invert hue-rotate-180 drop-shadow-[0_0_8px_rgba(8,145,178,0.25)]' : ''}`}
            />
          </a>
        </div>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {isLandingPage && (
            <>
              <a href="#services" className="text-sm font-medium hover:text-primary transition-colors">Services</a>
              <a href="#about" className="text-sm font-medium hover:text-primary transition-colors">About</a>
              <a href="#process" className="text-sm font-medium hover:text-primary transition-colors">Process</a>
              <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</a>
              <a href="#contact" className="text-sm font-medium hover:text-primary transition-colors">Contact</a>
            </>
          )}
          <a href="/referral" className="text-sm font-medium hover:text-primary transition-colors">Referral</a>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-foreground hover:bg-card/50 transition-all duration-300"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5" />}
          </Button>
          
          {isLoggedIn ? (
            <Button 
              size="sm" 
              variant="outline"
              className="ml-4 border-border hover:bg-card hover:text-foreground"
              onClick={handleDashboard}
            >
              <User className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="outline"
              className="ml-4 border-border hover:bg-card hover:text-foreground"
              onClick={handleLogin}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Client Login
            </Button>
          )}
          
          <Button 
            size="sm" 
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_10px_rgba(0,229,255,0.3)] hover:shadow-[0_0_15px_rgba(0,229,255,0.5)] transition-all duration-300"
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
        <div className="md:hidden bg-background/95 backdrop-blur-lg border-b border-border py-4 px-4 shadow-md absolute w-full left-0 z-50">
          <div className="flex flex-col space-y-4">
            {isLandingPage && (
              <>
                <a 
                  href="#services" 
                  className="text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Services
                </a>
                <a 
                  href="#about" 
                  className="text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </a>
                <a 
                  href="#process" 
                  className="text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Process
                </a>
                <a 
                  href="#pricing" 
                  className="text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Pricing
                </a>
                <a 
                  href="#contact" 
                  className="text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </a>
              </>
            )}
            <a 
              href="/referral" 
              className="text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Referral
            </a>
            
            {isLoggedIn ? (
              <Button 
                size="sm" 
                variant="outline"
                className="w-full border-border"
                onClick={handleDashboard}
              >
                <User className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline"
                className="w-full border-border"
                onClick={handleLogin}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Client Login
              </Button>
            )}
            
            <Button 
              size="sm" 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleBookCall}
            >
              Book a Call
            </Button>

            <div className="flex justify-between items-center py-2 border-t border-border mt-2">
              <span className="text-sm font-medium">Theme Mode</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-foreground hover:bg-card/50"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
