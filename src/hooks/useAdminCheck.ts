import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const ADMIN_EMAIL = "aremoayomide13@gmail.com";

export function useAdminCheck() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (authLoading) return;

      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Check if email matches admin email
      if (user.email === ADMIN_EMAIL) {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // Also check user_roles table for admin role
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!error && data) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    };

    checkAdminStatus();
  }, [user, authLoading]);

  return { isAdmin, loading: authLoading || loading, user };
}
