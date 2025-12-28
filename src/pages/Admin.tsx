import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Link2,
  LogOut,
  Loader2,
  Plus,
  Copy,
  Check,
  CreditCard,
  Shield,
} from "lucide-react";

const ADMIN_EMAIL = "admin@example.com";

interface GeneratedCard {
  card_id: string;
  secret_pin: string;
}

interface NfcCard {
  id: string;
  card_id: string;
  secret_pin: string;
  is_active: boolean;
  linked_user_id: string | null;
  claimed_at: string | null;
  created_at: string;
}

const generateCardId = (): string => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "card-";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generatePin = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const Admin = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [cardCount, setCardCount] = useState<string>("");
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [allCards, setAllCards] = useState<NfcCard[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      } else if (user.email !== ADMIN_EMAIL) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        });
        navigate("/dashboard");
      } else {
        setLoading(false);
        fetchAllCards();
      }
    }
  }, [user, authLoading, navigate]);

  const fetchAllCards = async () => {
    const { data, error } = await supabase
      .from("nfc_cards")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAllCards(data);
    }
  };

  const handleBulkGenerate = async () => {
    const count = parseInt(cardCount);
    if (isNaN(count) || count < 1 || count > 100) {
      toast({
        title: "Invalid Count",
        description: "Please enter a number between 1 and 100.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    const newCards: GeneratedCard[] = [];

    // Generate unique cards
    for (let i = 0; i < count; i++) {
      newCards.push({
        card_id: generateCardId(),
        secret_pin: generatePin(),
      });
    }

    // Insert into database
    const { error } = await supabase.from("nfc_cards").insert(
      newCards.map((card) => ({
        card_id: card.card_id,
        secret_pin: card.secret_pin,
        is_active: true,
      }))
    );

    if (error) {
      toast({
        title: "Error",
        description: "Failed to generate cards. Some IDs might already exist.",
        variant: "destructive",
      });
    } else {
      setGeneratedCards(newCards);
      toast({
        title: "Success!",
        description: `Generated ${count} new NFC cards.`,
      });
      fetchAllCards();
    }

    setGenerating(false);
    setCardCount("");
    setShowGenerator(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAllGenerated = () => {
    const text = generatedCards
      .map((card) => `${card.card_id}\t${card.secret_pin}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "All card data copied to clipboard.",
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || loading) {
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
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              NFC Card Inventory
            </h1>
            <p className="text-muted-foreground">
              Manage and generate NFC cards for your users.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="glass-card rounded-xl p-4">
              <p className="text-muted-foreground text-sm">Total Cards</p>
              <p className="text-2xl font-display font-bold text-foreground">
                {allCards.length}
              </p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <p className="text-muted-foreground text-sm">Claimed</p>
              <p className="text-2xl font-display font-bold text-green-400">
                {allCards.filter((c) => c.linked_user_id).length}
              </p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <p className="text-muted-foreground text-sm">Available</p>
              <p className="text-2xl font-display font-bold text-primary">
                {allCards.filter((c) => !c.linked_user_id).length}
              </p>
            </div>
          </div>

          {/* Generate Section */}
          <div className="glass-card rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-semibold text-foreground flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Generate Cards
              </h2>
              {!showGenerator && (
                <Button variant="hero" onClick={() => setShowGenerator(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Bulk Generate
                </Button>
              )}
            </div>

            {showGenerator && (
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  placeholder="How many cards? (1-100)"
                  value={cardCount}
                  onChange={(e) => setCardCount(e.target.value)}
                  min="1"
                  max="100"
                  className="max-w-xs"
                />
                <Button
                  variant="hero"
                  onClick={handleBulkGenerate}
                  disabled={generating}
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Generate
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowGenerator(false);
                    setCardCount("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}

            {/* Newly Generated Cards */}
            {generatedCards.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    Newly Generated Cards
                  </h3>
                  <Button variant="glass" size="sm" onClick={copyAllGenerated}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy All
                  </Button>
                </div>
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50">
                        <TableHead>Card ID</TableHead>
                        <TableHead>Secret PIN</TableHead>
                        <TableHead className="w-20">Copy</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {generatedCards.map((card) => (
                        <TableRow key={card.card_id}>
                          <TableCell className="font-mono text-primary">
                            {card.card_id}
                          </TableCell>
                          <TableCell className="font-mono">
                            {card.secret_pin}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                copyToClipboard(
                                  `${card.card_id}\t${card.secret_pin}`,
                                  card.card_id
                                )
                              }
                            >
                              {copiedId === card.card_id ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          {/* All Cards Table */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-display font-semibold text-foreground mb-4">
              All Cards
            </h2>
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead>Card ID</TableHead>
                    <TableHead>PIN</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allCards.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell className="font-mono text-primary">
                        {card.card_id}
                      </TableCell>
                      <TableCell className="font-mono">
                        {card.secret_pin}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            card.linked_user_id
                              ? "bg-green-500/20 text-green-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {card.linked_user_id ? "Claimed" : "Available"}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(card.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
