import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Mail, Lock, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isReset, setIsReset] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // FIX: Clear inputs when switching modes (Fixes Bug #1)
  useEffect(() => {
    setEmail("");
    setPassword("");
    setUsername("");
  }, [isLogin, isReset]);

  // NEW: Google Login Function
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + "/dashboard",
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Google Login Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // FIX: Redirect to the new UpdatePassword page (Fixes Bug #9)
        redirectTo: window.location.origin + "/update-password",
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We sent you a password reset link.",
      });
      setIsReset(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Login failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You've been logged in successfully.",
          });
          navigate("/dashboard");
        }
      } else {
        if (!username.trim()) {
          toast({
            title: "Username required",
            description: "Please enter a username.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // FIX: Check if username exists first (Fixes Bug #7)
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username.toLowerCase().trim())
          .maybeSingle();

        if (existingUser) {
          toast({
            title: "Username taken",
            description: "Please choose a different username.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        const { error } = await signUp(email, password, username);
        if (error) {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Account created!",
            description: "Welcome! Let's set up your profile.",
          });
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-gradient-bg flex flex-col">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <header className="relative z-10 p-4">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="glass-card rounded-2xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-display font-bold text-gradient-hero mb-2">
                LinkBio
              </h1>
              <p className="text-muted-foreground">
                {isReset
                  ? "Reset your password"
                  : isLogin
                    ? "Welcome back"
                    : "Create your account"
                }
              </p>
            </div>

            {isReset ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Enter your email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Sending Link...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setIsReset(false)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Username
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="yourname"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="pl-11"
                          required={!isLogin}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This will be your profile URL: linkbio.app/{username.toLowerCase().replace(/\s+/g, '_') || 'yourname'}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">
                        Password
                      </label>
                      {isLogin && (
                        <button
                          type="button"
                          onClick={() => setIsReset(true)}
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
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

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        {isLogin ? "Signing in..." : "Creating account..."}
                      </>
                    ) : (
                      isLogin ? "Sign In" : "Create Account"
                    )}
                  </Button>
                </form>

                {/* --- GOOGLE LOGIN BUTTON --- */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div>
                </div>

                <Button variant="outline" type="button" className="w-full" onClick={handleGoogleLogin}>
                  <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                  Google
                </Button>

                <div className="mt-6 text-center">
                  <p className="text-muted-foreground text-sm">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                    <button
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      {isLogin ? "Sign up" : "Sign in"}
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Auth;