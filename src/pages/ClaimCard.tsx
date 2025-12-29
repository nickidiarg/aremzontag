import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Lock, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ClaimCardProps {
  cardId: string;
}

const ClaimCard = ({ cardId }: ClaimCardProps) => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  
  const [step, setStep] = useState<"checking" | "verify" | "auth" | "claiming">("checking");
  const [pin, setPin] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardStatus, setCardStatus] = useState<{ exists: boolean; claimed: boolean } | null>(null);

  // Check card status on mount using public RPC (works for anonymous users)
  useEffect(() => {
    const checkCardStatus = async () => {
      const { data, error } = await supabase.rpc('get_card_status_public', {
        lookup_id: cardId
      });

      if (error) {
        console.error("Card status check error:", error);
        toast.error("Failed to check card status");
        setCardStatus({ exists: false, claimed: false });
        setStep("verify");
        return;
      }

      const status = data?.[0];
      if (!status?.card_exists) {
        setCardStatus({ exists: false, claimed: false });
      } else if (status.is_claimed) {
        setCardStatus({ exists: true, claimed: true });
      } else {
        setCardStatus({ exists: true, claimed: false });
      }
      setStep("verify");
    };

    checkCardStatus();
  }, [cardId]);

  const handleVerifyAndClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      // User needs to authenticate first, then we'll claim
      setStep("auth");
      return;
    }

    await claimCardWithPin();
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let error;
    if (isLogin) {
      const result = await signIn(email, password);
      error = result.error;
    } else {
      if (!username.trim()) {
        toast.error("Please enter a username");
        setIsSubmitting(false);
        return;
      }
      const result = await signUp(email, password, username);
      error = result.error;
    }

    if (error) {
      toast.error(error.message);
      setIsSubmitting(false);
      return;
    }

    // After successful auth, claim the card
    setStep("claiming");
    // Wait a moment for auth state to update
    setTimeout(() => {
      claimCardWithPin();
    }, 1000);
  };

  const claimCardWithPin = async () => {
    setIsSubmitting(true);
    setStep("claiming");

    // Use secure RPC - PIN is verified server-side, never exposed to frontend
    const { data: success, error } = await supabase.rpc('verify_and_claim_card', {
      input_card_id: cardId,
      input_pin: pin
    });

    if (error) {
      if (error.message.includes('already has a linked card')) {
        toast.error("You already have a card linked to your account");
        navigate("/dashboard");
        return;
      }
      if (error.message.includes('already claimed')) {
        toast.error("This card has already been claimed");
        setStep("verify");
        setIsSubmitting(false);
        return;
      }
      toast.error("Failed to claim card. Please try again.");
      setStep("verify");
      setIsSubmitting(false);
      return;
    }

    if (!success) {
      toast.error("Incorrect PIN or card not found");
      setStep("verify");
      setIsSubmitting(false);
      return;
    }

    toast.success("Card claimed successfully!");
    navigate("/dashboard");
  };

  if (authLoading || step === "checking") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Card doesn't exist
  if (cardStatus && !cardStatus.exists) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="glass-card p-8 space-y-6 text-center">
            <div className="w-16 h-16 mx-auto bg-destructive/20 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Card Not Found</h1>
            <p className="text-muted-foreground">This card ID does not exist in our system.</p>
            <Button onClick={() => navigate("/")} className="w-full">
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Card already claimed
  if (cardStatus && cardStatus.claimed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="glass-card p-8 space-y-6 text-center">
            <div className="w-16 h-16 mx-auto bg-amber-500/20 rounded-2xl flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Card Already Claimed</h1>
            <p className="text-muted-foreground">This card has already been linked to an account.</p>
            <Button onClick={() => navigate("/")} className="w-full">
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-card p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-2xl flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Claim Your Card</h1>
            <p className="text-muted-foreground">Card ID: {cardId}</p>
          </div>

          {step === "verify" && (
            <form onSubmit={handleVerifyAndClaim} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin" className="text-foreground">Enter Secret PIN</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pin"
                    type="password"
                    placeholder="Enter 6-digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="pl-10"
                    maxLength={6}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Your PIN is verified securely on our servers
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting || !pin}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {user ? "Verify & Claim Card" : "Continue"}
              </Button>
            </form>
          )}

          {step === "auth" && (
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={isLogin ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setIsLogin(true)}
                >
                  Login
                </Button>
                <Button
                  type="button"
                  variant={!isLogin ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setIsLogin(false)}
                >
                  Sign Up
                </Button>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-foreground">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required={!isLogin}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {isLogin ? "Login & Claim Card" : "Sign Up & Claim Card"}
              </Button>
            </form>
          )}

          {step === "claiming" && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Claiming your card...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClaimCard;
