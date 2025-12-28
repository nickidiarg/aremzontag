import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Lock, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ClaimCardProps {
  cardId: string;
}

const ClaimCard = ({ cardId }: ClaimCardProps) => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  
  const [step, setStep] = useState<"verify" | "auth" | "claiming">("verify");
  const [pin, setPin] = useState("");
  const [pinVerified, setPinVerified] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Fetch the card to verify PIN
    const { data: card, error } = await supabase
      .from("nfc_cards")
      .select("secret_pin, linked_user_id")
      .eq("card_id", cardId)
      .maybeSingle();

    if (error || !card) {
      toast.error("Card not found");
      setIsSubmitting(false);
      return;
    }

    if (card.linked_user_id) {
      toast.error("This card has already been claimed");
      setIsSubmitting(false);
      return;
    }

    if (card.secret_pin !== pin) {
      toast.error("Incorrect PIN");
      setIsSubmitting(false);
      return;
    }

    setPinVerified(true);
    setStep(user ? "claiming" : "auth");
    setIsSubmitting(false);

    if (user) {
      await claimCard();
    }
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
      claimCard();
    }, 1000);
  };

  const claimCard = async () => {
    setIsSubmitting(true);

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      toast.error("Please sign in first");
      setStep("auth");
      setIsSubmitting(false);
      return;
    }

    // Check if user already has a card
    const { data: existingCard } = await supabase
      .from("nfc_cards")
      .select("card_id")
      .eq("linked_user_id", currentUser.id)
      .maybeSingle();

    if (existingCard) {
      toast.error(`You already have a card linked (${existingCard.card_id})`);
      navigate("/dashboard");
      return;
    }

    const { error } = await supabase
      .from("nfc_cards")
      .update({
        linked_user_id: currentUser.id,
        claimed_at: new Date().toISOString(),
      })
      .eq("card_id", cardId)
      .is("linked_user_id", null);

    if (error) {
      toast.error("Failed to claim card. It may have been claimed by someone else.");
      setIsSubmitting(false);
      return;
    }

    toast.success("Card claimed successfully!");
    navigate("/dashboard");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            <form onSubmit={handleVerifyPin} className="space-y-4">
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
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Verify PIN
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
