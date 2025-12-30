import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Ban,
  UserCheck,
  LogIn,
  Eye,
  Shield,
  ShieldOff,
} from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  views: number;
  is_banned: boolean;
  created_at: string;
  isAdmin?: boolean;
}

interface ManageUsersTabProps {
  onImpersonate: (userId: string, email: string) => void;
}

const ManageUsersTab = ({ onImpersonate }: ManageUsersTabProps) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminRoles, setAdminRoles] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    // 1. Fetch profiles
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    // 2. Fetch admin roles
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .eq("role", "admin");

    if (!error && profiles) {
      const adminUserIds = new Set(rolesData?.map(r => r.user_id) || []);
      setAdminRoles(adminUserIds);

      setUsers(profiles.map(u => ({
        ...u,
        isAdmin: adminUserIds.has(u.id)
      })) as UserProfile[]);
    }
    setLoading(false);
  };

  const toggleBan = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_banned: !currentStatus })
      .eq("id", userId);

    if (error) {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    } else {
      setUsers(users.map(u => u.id === userId ? { ...u, is_banned: !currentStatus } : u));
      toast({
        title: currentStatus ? "User Unbanned" : "User Banned",
        description: currentStatus ? "User reactivated." : "User suspended.",
      });
    }
  };

  const toggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    if (isCurrentlyAdmin) {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");

      if (error) {
        toast({ title: "Error", description: "Failed to remove role.", variant: "destructive" });
      } else {
        const newAdminRoles = new Set(adminRoles);
        newAdminRoles.delete(userId);
        setAdminRoles(newAdminRoles);
        setUsers(users.map(u => u.id === userId ? { ...u, isAdmin: false } : u));
        toast({ title: "Admin Removed", description: "User is no longer an admin." });
      }
    } else {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });

      if (error) {
        toast({ title: "Error", description: "Failed to add role.", variant: "destructive" });
      } else {
        const newAdminRoles = new Set(adminRoles);
        newAdminRoles.add(userId);
        setAdminRoles(newAdminRoles);
        setUsers(users.map(u => u.id === userId ? { ...u, isAdmin: true } : u));
        toast({ title: "Admin Added", description: "User is now an admin." });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate stats for the top cards
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => !u.is_banned).length;
  const suspendedUsers = users.filter((u) => u.is_banned).length;
  const adminCount = users.filter((u) => u.isAdmin).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-semibold text-foreground mb-2">
          Manage Users
        </h2>
        <p className="text-muted-foreground text-sm">
          View, suspend, or impersonate user accounts.
        </p>
      </div>

      {/* Stats Cards Section (Added Back!) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <p className="text-muted-foreground text-sm">Total Users</p>
          <p className="text-2xl font-display font-bold text-foreground">
            {totalUsers}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-muted-foreground text-sm">Active</p>
          <p className="text-2xl font-display font-bold text-green-400">
            {activeUsers}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-muted-foreground text-sm">Suspended</p>
          <p className="text-2xl font-display font-bold text-red-400">
            {suspendedUsers}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-muted-foreground text-sm">Admins</p>
          <p className="text-2xl font-display font-bold text-amber-400">
            {adminCount}
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead>User</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="font-medium text-foreground">
                    {/* Fallback to username if display_name is missing */}
                    {user.display_name || user.username || "User"}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-primary">
                  @{user.username}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    {user.views?.toLocaleString() || 0}
                  </div>
                </TableCell>
                <TableCell>
                  {user.isAdmin ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
                      <Shield className="w-3 h-3" /> Admin
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground">
                      User
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.is_banned ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                    {user.is_banned ? "Suspended" : "Active"}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAdmin(user.id, user.isAdmin || false)}
                      className={user.isAdmin ? "text-amber-400" : "text-muted-foreground"}
                    >
                      {user.isAdmin ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                      <span className="sr-only">Toggle Admin</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleBan(user.id, user.is_banned)}
                      className={user.is_banned ? "text-green-400" : "text-red-400"}
                    >
                      {user.is_banned ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      <span className="sr-only">Toggle Ban</span>
                    </Button>
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => onImpersonate(user.id, user.username)}
                    >
                      <LogIn className="w-4 h-4 mr-1" />
                      Impersonate
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ManageUsersTab;