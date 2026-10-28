import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
  LogOut,
  User,
  Home,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  onOpenMobileNav?: () => void;
}

export function AdminHeader({
  title,
  description,
  breadcrumbs = [{ label: "Admin", href: "/admin/dashboard" }],
  actions,
  onOpenMobileNav,
}: AdminHeaderProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/admin");
    } catch (err: any) {
      toast.error(err.message || "Failed to sign out");
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-card/85 backdrop-blur-md border-b border-border/80 px-4 sm:px-6 lg:px-8 py-3.5 transition-colors">
      <div className="flex flex-col gap-3">
        {/* Top Operational Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile menu trigger */}
            {onOpenMobileNav && (
              <Button
                variant="outline"
                size="icon"
                onClick={onOpenMobileNav}
                aria-label="Open navigation menu"
                className="lg:hidden h-8 w-8 border-border text-foreground hover:bg-muted shrink-0"
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}

            {/* Breadcrumb Trail */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <div key={crumb.label} className="flex items-center gap-1.5 shrink-0">
                    {index > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />}
                    {crumb.href && !isLast ? (
                      <Link
                        to={crumb.href}
                        className="hover:text-foreground hover:underline transition-colors font-medium"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className={isLast ? "text-foreground font-semibold" : "font-medium"}>
                        {crumb.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* System Status Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Production Live</span>
            </div>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="User account menu"
                  className="h-8 gap-2 border-border/80 bg-background text-foreground hover:bg-muted text-xs px-2.5"
                >
                  <div className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold text-[10px] flex items-center justify-center">
                    A
                  </div>
                  <span className="hidden md:inline font-medium">admin@sienvi.com</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 text-xs">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs font-semibold leading-none text-foreground">Sienvi Agency</p>
                    <p className="text-[11px] leading-none text-muted-foreground">admin@sienvi.com</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/")} className="gap-2 cursor-pointer">
                  <Home className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Public Landing Page</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => window.open("https://dashboard.stripe.com", "_blank")}
                  className="gap-2 cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Stripe Console</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Page Title & Main Actions Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {description}
              </p>
            )}
          </div>

          {actions && <div className="flex items-center gap-2.5 shrink-0 flex-wrap">{actions}</div>}
        </div>
      </div>
    </header>
  );
}
