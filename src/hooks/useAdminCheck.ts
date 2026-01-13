import { useState, useEffect } from "react";

/**
 * Hook to check if the current user has admin privileges.
 * Uses URL parameter or localStorage for admin mode.
 * In production, this should be replaced with proper auth checks.
 */
export const useAdminCheck = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check URL parameter for admin mode
    const urlParams = new URLSearchParams(window.location.search);
    const adminParam = urlParams.get("admin");
    
    if (adminParam === "true") {
      localStorage.setItem("sienvi_admin_mode", "true");
      setIsAdmin(true);
      return;
    }
    
    if (adminParam === "false") {
      localStorage.removeItem("sienvi_admin_mode");
      setIsAdmin(false);
      return;
    }

    // Check localStorage for persisted admin mode
    const storedAdmin = localStorage.getItem("sienvi_admin_mode");
    setIsAdmin(storedAdmin === "true");
  }, []);

  return { isAdmin };
};
