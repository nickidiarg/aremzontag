import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const UpdatePassword = () => {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        // Check if user is actually logged in (via the email link)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                navigate("/auth"); // If not allowed, kick them back to login
            }
        });
    }, [navigate]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            toast({ title: "Too short", description: "Password must be at least 6 characters", variant: "destructive" });
            return;
        }

        setLoading(true);

        // 1. Update the password
        const { error } = await supabase.auth.updateUser({ password: password });

        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
            setLoading(false);
        } else {
            // 2. Success! Sign them out so they can log in with the new password
            await supabase.auth.signOut();

            toast({ title: "Success", description: "Password updated! Please log in now." });
            navigate("/auth"); // Redirect to Login Page
        }
    };

    return (
        <div className="min-h-screen animated-gradient-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md glass-card rounded-2xl p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2">Set New Password</h1>
                    <p className="text-muted-foreground">Please enter your new password below.</p>
                </div>

                <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-11"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin mr-2" /> : "Update Password"}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default UpdatePassword;