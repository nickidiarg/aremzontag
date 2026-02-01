import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Mail, Lock } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); // Captures the unique name
  const [activeTab, setActiveTab] = useState("login");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });
  }, [navigate]);

  const onTabChange = (value: string) => {
    setActiveTab(value);
    setEmail("");
    setPassword("");
    setUsername("");
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Force lowercase and remove spaces (clean username)
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(val);
  };

  const handleAuth = async (type: "login" | "signup") => {
    if (!email || !password) {
      toast({ title: "Missing Fields", description: "Please enter email and password", variant: "destructive" });
      return;
    }

    // Only check username length if we are signing up
    if (type === "signup" && username.length < 3) {
      toast({ title: "Invalid Username", description: "Username must be at least 3 characters", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      if (type === "signup") {
        // 1. Check if username is taken BEFORE signing up
        const { data: existing } = await supabase.from("profiles").select("username").eq("username", username).single();

        // If 'existing' is true, it means someone has that name
        if (existing) {
          throw new Error("This username is already taken. Please choose another.");
        }

        // 2. Sign up and pass the username so the database knows it
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username, // Important: Sends the username to the database trigger
            }
          }
        });
        if (error) throw error;
        toast({ title: "Success!", description: "Check your email to confirm your account." });

      } else {
        // Login Logic
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animated-gradient-bg">
      <Card className="w-full max-w-md glass-card border-none">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to AremzonTag</CardTitle>
          <CardDescription>Sign in to manage your NFC profile</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <div className="space-y-4">
              {/* Show Username field ONLY for Signup */}
              {activeTab === "signup" && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Username (unique)"
                    value={username}
                    onChange={handleUsernameChange}
                    className="pl-9"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Button className="w-full" onClick={() => handleAuth(activeTab as any)} disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" /> : (activeTab === "login" ? "Sign In" : "Sign Up")}
              </Button>
            </div>

            {activeTab === "login" && (
              <div className="mt-2 text-center">
                {/* Corrected "className" here */}
                <a href="/forgot-password" className="text-xs text-muted-foreground hover:underline">Forgot password?</a>
              </div>
            )}

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>Google</Button>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;