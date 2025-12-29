import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Link2,
  LogOut,
  Loader2,
  Shield,
  Package,
  Users,
  User,
} from "lucide-react";
import InventoryTab from "@/components/admin/InventoryTab";
import ManageUsersTab from "@/components/admin/ManageUsersTab";

const Admin = () => {
  const { isAdmin, loading, user } = useAdminCheck();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [impersonating, setImpersonating] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (!isAdmin) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        });
        navigate("/dashboard");
      }
    }
  }, [user, loading, isAdmin, navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleImpersonate = async (userId: string, username: string) => {
    // Store admin session info before impersonating
    localStorage.setItem("admin_impersonating", "true");
    localStorage.setItem("impersonated_username", username);
    
    toast({
      title: "Impersonation Mode",
      description: `Viewing as @${username}. Visit /admin to exit.`,
    });
    
    // Navigate to the user's profile edit view
    navigate(`/profile/${username}`);
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen animated-gradient-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-gradient-bg">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/15 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Link2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">LinkBio</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm">
              <Shield className="w-4 h-4" />
              Admin
            </div>
            <Link to="/dashboard">
              <Button variant="glass" size="sm">
                <User className="w-4 h-4 mr-2" />
                My Profile
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage users, inventory, and system settings.
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="inventory" className="space-y-6">
            <TabsList className="bg-secondary/50 border border-border">
              <TabsTrigger value="inventory" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Inventory
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Manage Users
              </TabsTrigger>
            </TabsList>

            <TabsContent value="inventory">
              <InventoryTab />
            </TabsContent>

            <TabsContent value="users">
              <ManageUsersTab onImpersonate={handleImpersonate} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Admin;
