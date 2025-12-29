import { useState, useEffect } from "react";
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
  Loader2,
  Plus,
  Copy,
  Check,
  CreditCard,
  Download,
  RotateCcw,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

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

const InventoryTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [cardCount, setCardCount] = useState<string>("");
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [allCards, setAllCards] = useState<NfcCard[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [unclaimingId, setUnclaimingId] = useState<string | null>(null);

  const baseUrl = window.location.origin;

  useEffect(() => {
    fetchAllCards();
  }, []);

  const fetchAllCards = async () => {
    const { data, error } = await supabase
      .from("nfc_cards")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAllCards(data);
    }
    setLoading(false);
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

    for (let i = 0; i < count; i++) {
      newCards.push({
        card_id: generateCardId(),
        secret_pin: generatePin(),
      });
    }

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

  const handleUnclaimCard = async (cardId: string) => {
    setUnclaimingId(cardId);
    
    const { data: success, error } = await supabase.rpc('admin_unclaim_card', {
      target_card_id: cardId
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to unclaim card.",
        variant: "destructive",
      });
    } else if (success) {
      toast({
        title: "Success!",
        description: "Card has been unclaimed and is now available.",
      });
      fetchAllCards();
    } else {
      toast({
        title: "Error",
        description: "Card not found.",
        variant: "destructive",
      });
    }

    setUnclaimingId(null);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAllGenerated = () => {
    const text = generatedCards
      .map(
        (card) =>
          `${card.card_id}\t${card.secret_pin}\t${baseUrl}/c/${card.card_id}`
      )
      .join("\n");
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "All card data with URLs copied to clipboard.",
    });
  };

  const downloadQRCode = (cardId: string) => {
    const svg = document.getElementById(`qr-${cardId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `qr-${cardId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      <div className="glass-card rounded-2xl p-6">
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
            <div className="rounded-xl border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead>Card ID</TableHead>
                    <TableHead>PIN</TableHead>
                    <TableHead>Claim URL</TableHead>
                    <TableHead>QR Code</TableHead>
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
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {baseUrl}/c/{card.card_id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="bg-white p-1 rounded">
                            <QRCodeSVG
                              id={`qr-${card.card_id}`}
                              value={`${baseUrl}/c/${card.card_id}`}
                              size={48}
                              level="M"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => downloadQRCode(card.card_id)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            copyToClipboard(
                              `${card.card_id}\t${card.secret_pin}\t${baseUrl}/c/${card.card_id}`,
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
        <div className="rounded-xl border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead>Card ID</TableHead>
                <TableHead>PIN</TableHead>
                <TableHead>Claim URL</TableHead>
                <TableHead className="w-12">Copy</TableHead>
                <TableHead>QR</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allCards.map((card) => (
                <TableRow key={card.id}>
                  <TableCell className="font-mono text-primary">
                    {card.card_id}
                  </TableCell>
                  <TableCell className="font-mono">{card.secret_pin}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {baseUrl}/c/{card.card_id}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(`${baseUrl}/c/${card.card_id}`);
                        setCopiedId(card.card_id);
                        setTimeout(() => setCopiedId(null), 2000);
                        toast({
                          title: "Copied!",
                          description: "Claim URL copied to clipboard.",
                        });
                      }}
                      className="h-8 w-8"
                    >
                      {copiedId === card.card_id ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="bg-white p-1 rounded inline-block">
                        <QRCodeSVG
                          id={`qr-all-${card.card_id}`}
                          value={`${baseUrl}/c/${card.card_id}`}
                          size={32}
                          level="M"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const svg = document.getElementById(`qr-all-${card.card_id}`);
                          if (!svg) return;
                          const svgData = new XMLSerializer().serializeToString(svg);
                          const canvas = document.createElement("canvas");
                          const ctx = canvas.getContext("2d");
                          const img = new Image();
                          img.onload = () => {
                            canvas.width = img.width;
                            canvas.height = img.height;
                            ctx?.drawImage(img, 0, 0);
                            const pngFile = canvas.toDataURL("image/png");
                            const downloadLink = document.createElement("a");
                            downloadLink.download = `qr-${card.card_id}.png`;
                            downloadLink.href = pngFile;
                            downloadLink.click();
                          };
                          img.src = "data:image/svg+xml;base64," + btoa(svgData);
                        }}
                        className="h-8 w-8"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
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
                  <TableCell>
                    {card.linked_user_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnclaimCard(card.card_id)}
                        disabled={unclaimingId === card.card_id}
                        className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                      >
                        {unclaimingId === card.card_id ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        ) : (
                          <RotateCcw className="w-4 h-4 mr-1" />
                        )}
                        Unclaim
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default InventoryTab;
