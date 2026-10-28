import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CreditCard,
  BarChart3,
  FileCheck2,
  Settings2,
  ExternalLink,
  LogOut,
  Sun,
  Moon,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  isPlanned?: boolean;
  isExternal?: boolean;
}

const PRIMARY_NAV: NavItem[] = [
  {
    label: "Overview",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Client Directory",
    href: "/admin/clients",
    icon: Users,
  },
  {
    label: "Create Client",
    href: "/admin/create-client",
    icon: UserPlus,
  },
];

const EXTERNAL_TOOLS: NavItem[] = [
  {
    label: "Stripe Dashboard",
    href: "https://dashboard.stripe.com",
    icon: CreditCard,
    isExternal: true,
  },
];

const PLANNED_MODULES: NavItem[] = [
  {
    label: "Revenue & Billing",
    href: "#",
    icon: BarChart3,
    badge: "Phase 2",
    isPlanned: true,
  },
  {
    label: "Agreements Archive",
    href: "#",
    icon: FileCheck2,
    badge: "Phase 3",
    isPlanned: true,
  },
  {
    label: "Operations & Reports",
    href: "#",
    icon: Settings2,
    badge: "Phase 3",
    isPlanned: true,
  },
];

export function AdminSidebar({
  isCollapsed = false,
  onToggleCollapse,
  onCloseMobile,
}: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/admin");
    } catch (err: any) {
      toast.error(err.message || "Failed to sign out");
    } finally {
      setLoggingOut(false);
    }
  };

  const isCurrent = (href: string) => {
    if (href === "/admin/dashboard") {
      return location.pathname === "/admin/dashboard" || location.pathname === "/admin";
    }
    return location.pathname === href;
  };

  return (
    <aside
      className={`h-full flex flex-col justify-between bg-card text-card-foreground border-r border-border transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
      aria-label="Admin Navigation"
    >
      {/* Top Header / Brand */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-border/80">
          <Link
            to="/admin/dashboard"
            onClick={onCloseMobile}
            className="flex items-center gap-3 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-lg py-1 px-1.5 transition-opacity hover:opacity-90"
            title="Sienvi Operations Command Center"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <span className="font-extrabold text-sm tracking-wider">S</span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm tracking-tight text-foreground truncate">
                  Sienvi Agency
                </span>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Command Center
                </span>
              </div>
            )}
          </Link>

          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden lg:flex h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="px-3 py-4 space-y-6 overflow-y-auto max-h-[calc(100vh-10rem)]">
          {/* Active Functional Modules */}
          <div>
            {!isCollapsed && (
              <p className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Operations
              </p>
            )}
            <nav className="space-y-1" aria-label="Core operational pages">
              {PRIMARY_NAV.map((item) => {
                const active = isCurrent(item.href);
                const Icon = item.icon;

                const linkElement = (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onCloseMobile}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring ${
                      active
                        ? "bg-primary/10 text-primary border border-primary/20 font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    } ${isCollapsed ? "justify-center px-2" : ""}`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );

                if (isCollapsed) {
                  return (
                    <TooltipProvider key={item.href} delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>{linkElement}</TooltipTrigger>
                        <TooltipContent side="right" className="text-xs">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                }

                return linkElement;
              })}
            </nav>
          </div>

          {/* External Tools Group */}
          <div>
            {!isCollapsed && (
              <p className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                External Tools
              </p>
            )}
            <div className="space-y-1">
              {EXTERNAL_TOOLS.map((item) => {
                const Icon = item.icon;
                const linkElement = (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring ${
                      isCollapsed ? "justify-center px-2" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!isCollapsed && <ExternalLink className="h-3 w-3 text-muted-foreground/70 shrink-0" />}
                  </a>
                );

                if (isCollapsed) {
                  return (
                    <TooltipProvider key={item.label} delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>{linkElement}</TooltipTrigger>
                        <TooltipContent side="right" className="text-xs">
                          {item.label} (External)
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                }

                return linkElement;
              })}
            </div>
          </div>

          {/* Planned Roadmap Modules (Non-clickable to avoid dead routes) */}
          <div>
            {!isCollapsed && (
              <p className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Roadmap
              </p>
            )}
            <div className="space-y-1">
              {PLANNED_MODULES.map((item) => {
                const Icon = item.icon;
                const plannedElement = (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-normal text-muted-foreground/60 select-none cursor-not-allowed ${
                      isCollapsed ? "justify-center px-2" : ""
                    }`}
                    title={`${item.label} (Planned for ${item.badge})`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!isCollapsed && item.badge && (
                      <span className="text-[10px] font-medium bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded border border-border/50">
                        {item.badge}
                      </span>
                    )}
                  </div>
                );

                if (isCollapsed) {
                  return (
                    <TooltipProvider key={item.label} delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>{plannedElement}</TooltipTrigger>
                        <TooltipContent side="right" className="text-xs">
                          {item.label} ({item.badge})
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                }

                return plannedElement;
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Account & Theme */}
      <div className="p-3 border-t border-border/80 bg-muted/20 space-y-2">
        {!isCollapsed && (
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-card/60 border border-border/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                A
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">admin@sienvi.com</p>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span>Admin Role</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={`flex items-center gap-1.5 ${isCollapsed ? "flex-col" : "justify-between"}`}>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size={isCollapsed ? "icon" : "sm"}
                  onClick={toggleTheme}
                  aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
                  className={`border-border/80 bg-background text-foreground hover:bg-muted text-xs h-8 ${
                    !isCollapsed ? "flex-1 justify-start px-2.5 gap-2" : "w-8"
                  }`}
                >
                  {isDark ? <Sun className="h-3.5 w-3.5 text-amber-400 shrink-0" /> : <Moon className="h-3.5 w-3.5 text-slate-600 shrink-0" />}
                  {!isCollapsed && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                Toggle Theme ({isDark ? "Dark" : "Light"})
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  aria-label="Sign Out"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-3.5 w-3.5 shrink-0" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                Sign Out
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </aside>
  );
}
