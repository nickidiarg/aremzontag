import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import PublicProfile from "./PublicProfile";
import ClaimCard from "./ClaimCard";

const CardRoute = () => {
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [card, setCard] = useState<any>(null);
  const [linkedProfile, setLinkedProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCard = async () => {
      if (!cardId) {
        setError("Invalid card ID");
        setLoading(false);
        return;
      }

      // 1. Get the Card Data
      const { data: cardData, error: cardError } = await supabase
        .from("nfc_cards")
        .select("*")
        .eq("card_id", cardId)
        .maybeSingle();

      if (cardError) {
        console.error("Error fetching card:", cardError);
        setError("Error fetching card");
        setLoading(false);
        return;
      }

      if (!cardData) {
        setError("Card not found");
        setLoading(false);
        return;
      }

      if (!cardData.is_active) {
        setError("This card is inactive");
        setLoading(false);
        return;
      }

      setCard(cardData);

      // 2. If card is claimed, fetch the linked profile
      if (cardData.linked_user_id) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          // FIX: Changed 'user_id' to 'id' to match your database
          .eq("id", cardData.linked_user_id)
          .maybeSingle();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
        }

        if (profileData) {
          setLinkedProfile(profileData);
        }
      }

      setLoading(false);
    };

    fetchCard();
  }, [cardId]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-4">Oops!</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // 3. REDIRECT LOGIC
  // If we found the profile, Show it!
  if (card?.linked_user_id && linkedProfile) {
    return <PublicProfile username={linkedProfile.username} />;
  }

  // If card is claimed but profile is missing (rare bug), show error
  if (card?.linked_user_id && !linkedProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground">This card is claimed, but the user profile is missing.</p>
        </div>
      </div>
    );
  }

  // 4. If unclaimed, show Claim Page
  return <ClaimCard cardId={cardId!} />;
};

export default CardRoute;