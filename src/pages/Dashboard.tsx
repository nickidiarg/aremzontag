import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import CustomLinksManager from "@/components/CustomLinksManager";
import {
  User,
  LogOut,
  Save,
  ExternalLink,
  Link2,
  Loader2,
  Copy,
  Check,
  Shield,
  Upload,
  CreditCard
} from "lucide-react";

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  whatsapp_link: string | null;
  instagram_link: string | null;
  tiktok_link: string | null;
}

interface NfcCard {
  card_id: string;
  is_active: boolean;
  claimed_at: string | null;
}

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [linkedCard, setLinkedCard] = useState<NfcCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);

  // --- AUTO-SAVE: Initialize state from LocalStorage ---
  const [displayName, setDisplayName] = useState(localStorage.getItem("draft_displayName") || "");
  const [bio, setBio] = useState(localStorage.getItem("draft_bio") || "");
  const [avatarUrl, setAvatarUrl] = useState(localStorage.getItem("draft_avatarUrl") || "");
  const [phoneNumber, setPhoneNumber] = useState(localStorage.getItem("draft_phoneNumber") || "");
  const [whatsappLink, setWhatsappLink] = useState(localStorage.getItem("draft_whatsappLink") || "");
  const [instagramLink, setInstagramLink] = useState(localStorage.getItem("draft_instagramLink") || "");
  const [tiktokLink, setTiktokLink] = useState(localStorage.getItem("draft_tiktokLink") || "");

  // --- AUTO-SAVE: Save to LocalStorage on change ---
  useEffect(() => {
    localStorage.setItem("draft_displayName", displayName);
    localStorage.setItem("draft_bio", bio);
    localStorage.setItem("draft_avatarUrl", avatarUrl);
    localStorage.setItem("draft_phoneNumber", phoneNumber);
    localStorage.setItem("draft_whatsappLink", whatsappLink);
    localStorage.setItem("draft_instagramLink", instagramLink);
    localStorage.setItem("draft_tiktokLink", tiktokLink);
  }, [displayName, bio, avatarUrl, phoneNumber, whatsappLink, instagramLink, tiktokLink]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchLinkedCard();
    }
  }, [user]);

  const fetchLinkedCard = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("nfc_cards")
      .select("card_id, is_active, claimed_at")
      .eq("linked_user_id", user.id)
      .maybeSingle();

    if (!error && data) setLinkedCard(data);
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        // Only load from DB if draft is empty to prevent overwriting user work
        if (!localStorage.getItem("draft_displayName")) setDisplayName(data.display_name || "");
        if (!localStorage.getItem("draft_bio")) setBio(data.bio || "");
        if (!localStorage.getItem("draft_avatarUrl")) setAvatarUrl(data.avatar_url || "");
        if (!localStorage.getItem("draft_phoneNumber")) setPhoneNumber(data.phone_number || "");
        if (!localStorage.getItem("draft_whatsappLink")) setWhatsappLink(data.whatsapp_link || "");
        if (!localStorage.getItem("draft_instagramLink")) setInstagramLink(data.instagram_link || "");
        if (!localStorage.getItem("draft_tiktokLink")) setTiktokLink(data.tiktok_link || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const usernameToUse = profile?.username || `user_${user.id.slice(0, 6)}`;
      const { data, error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          username: usernameToUse,
          display_name: displayName,
          bio,
          avatar_url: avatarUrl,
          phone_number: phoneNumber,
          whatsapp_link: whatsappLink,
          instagram_link: instagramLink,
          tiktok_link: tiktokLink,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data as Profile);
        // Clear drafts on success
        localStorage.removeItem("draft_displayName");
        localStorage.removeItem("draft_bio");
        localStorage.removeItem("draft_avatarUrl");
        localStorage.removeItem("draft_phoneNumber");
        localStorage.removeItem("draft_whatsappLink");
        localStorage.removeItem("draft_instagramLink");
        localStorage.removeItem("draft_tiktokLink");

        toast({ title: "Saved!", description: "Profile updated successfully." });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 2MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
      await supabase.storage.from('avatars').remove([filePath]);
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(urlData.publicUrl + '?t=' + Date.now());
      toast({ title: "Uploaded", description: "Don't forget to click Save!" });
    } catch (error) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const copyProfileLink = () => {
    if (profile?.username) {
      navigator.clipboard.writeText(`${window.location.origin}/profile/${profile.username}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied!" });
    }
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen animated-gradient-bg">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl"><Link2 className="w-6 h-6" /> AremzonTag</Link>
        <div className="flex gap-2">
          {isAdmin && <Link to="/admin"><Button variant="secondary" size="sm"><Shield className="w-4 h-4 mr-2" />Admin</Button></Link>}
          <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }}><LogOut className="w-4 h-4 mr-2" /> Sign Out</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">

        {/* --- NEW: BUY CARD BANNER (Only shows if they don't have a card) --- */}
        {!linkedCard && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center justify-center md:justify-start gap-2">
                <CreditCard className="w-5 h-5" /> Get Your Physical Card
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Tap to share your profile instantly. No apps needed for the other person!
              </p>
            </div>
            <a
              href="https://wa.me/+2348065545851?text=I am logged in and want to buy an NFC card." // CHANGE NUMBER HERE
              target="_blank"
              rel="noreferrer"
            >
              <Button className="bg-primary hover:bg-primary/90">Order Now</Button>
            </a>
          </div>
        )}

        <div className="flex justify-between items-end mb-6">
          <h1 className="text-3xl font-bold">Edit Profile</h1>
          <div className="flex gap-2">
            {profile?.username && (
              <Button variant="outline" size="icon" onClick={copyProfileLink}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            )}
            {profile?.username && (
              <Link to={`/profile/${profile.username}`}>
                <Button variant="outline">View Public</Button>
              </Link>
            )}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-full bg-secondary overflow-hidden border-2 border-border">
              {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <User className="w-8 h-8 m-auto mt-6 text-muted-foreground" />}
              <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
                {uploading ? <Loader2 className="animate-spin text-white" /> : <Upload className="text-white" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Profile Picture</label>
              <p className="text-xs text-muted-foreground">Click the image to upload</p>
            </div>
          </div>

          <div className="space-y-4">
            <div><label className="text-sm font-medium">Display Name</label><Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="John Doe" /></div>
            <div><label className="text-sm font-medium">Bio</label><Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Short bio..." /></div>

            <div className="border-t pt-4 space-y-4">
              <h3 className="font-semibold text-muted-foreground">Contact & Socials</h3>
              <Input placeholder="Phone Number" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
              <Input placeholder="WhatsApp Link (wa.me/...)" value={whatsappLink} onChange={e => setWhatsappLink(e.target.value)} />
              <Input placeholder="Instagram URL" value={instagramLink} onChange={e => setInstagramLink(e.target.value)} />
              <Input placeholder="TikTok URL" value={tiktokLink} onChange={e => setTiktokLink(e.target.value)} />
            </div>

            {user && <div className="border-t pt-4"><CustomLinksManager userId={user.id} /></div>}

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <><Loader2 className="animate-spin mr-2" /> Saving...</> : <><Save className="mr-2" /> Save Changes</>}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;