import { useState, useEffect } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminShellProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export function AdminShell({
  children,
  title,
  description,
  breadcrumbs,
  actions,
}: AdminShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sienvi_admin_sidebar_collapsed") === "true";
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sienvi_admin_sidebar_collapsed", String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-primary/20 selection:text-primary">
      {/* Skip to Content for Accessibility / Screen Readers */}
      <a
        href="#main-admin-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-hidden"
      >
        Skip to main content
      </a>

      <div className="flex-1 flex w-full">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block shrink-0 sticky top-0 h-screen z-40">
          <AdminSidebar
            isCollapsed={isCollapsed}
            onToggleCollapse={toggleCollapse}
          />
        </div>

        {/* Mobile / Tablet Drawer Sheet */}
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="p-0 w-64 bg-card border-r border-border">
            <AdminSidebar
              isCollapsed={false}
              onCloseMobile={() => setMobileNavOpen(false)}
            />
          </SheetContent>
        </Sheet>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader
            title={title}
            description={description}
            breadcrumbs={breadcrumbs}
            actions={actions}
            onOpenMobileNav={() => setMobileNavOpen(true)}
          />

          <main
            id="main-admin-content"
            tabIndex={-1}
            className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto outline-hidden"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
