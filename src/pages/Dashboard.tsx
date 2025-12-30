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
  Phone,
  Instagram,
  Link2,
  Loader2,
  Copy,
  Check,
  Shield,
  Upload
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
  const [viewCount, setViewCount] = useState<number>(0);
  const [uploading, setUploading] = useState(false);

  // --- AUTO-SAVE FIX: Initialize state from LocalStorage if available ---
  const [displayName, setDisplayName] = useState(localStorage.getItem("draft_displayName") || "");
  const [bio, setBio] = useState(localStorage.getItem("draft_bio") || "");
  const [avatarUrl, setAvatarUrl] = useState(localStorage.getItem("draft_avatarUrl") || "");
  const [phoneNumber, setPhoneNumber] = useState(localStorage.getItem("draft_phoneNumber") || "");
  const [whatsappLink, setWhatsappLink] = useState(localStorage.getItem("draft_whatsappLink") || "");
  const [instagramLink, setInstagramLink] = useState(localStorage.getItem("draft_instagramLink") || "");
  const [tiktokLink, setTiktokLink] = useState(localStorage.getItem("draft_tiktokLink") || "");

  // --- AUTO-SAVE FIX: Save to LocalStorage whenever inputs change ---
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
      if (!user) {
        navigate("/auth");
      }
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchLinkedCard();
      fetchViewCount();
    }
  }, [user]);

  const fetchViewCount = async () => {
    const { data, error } = await supabase.rpc('get_my_profile_views');
    if (!error && data !== null) {
      setViewCount(data);
    }
  };

  const fetchLinkedCard = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("nfc_cards")
      .select("card_id, is_active, claimed_at")
      .eq("linked_user_id", user.id)
      .maybeSingle();

    if (!error && data) {
      setLinkedCard(data);
    }
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

        // --- AUTO-SAVE FIX: Only load from DB if there is NO draft ---
        // This prevents the DB from overwriting what the user was just typing
        if (!localStorage.getItem("draft_displayName")) setDisplayName(data.display_name || "");
        if (!localStorage.getItem("draft_bio")) setBio(data.bio || "");
        if (!localStorage.getItem("draft_avatarUrl")) setAvatarUrl(data.avatar_url || "");
        if (!localStorage.getItem("draft_phoneNumber")) setPhoneNumber(data.phone_number || "");
        if (!localStorage.getItem("draft_whatsappLink")) setWhatsappLink(data.whatsapp_link || "");
        if (!localStorage.getItem("draft_instagramLink")) setInstagramLink(data.instagram_link || "");
        if (!localStorage.getItem("draft_tiktokLink")) setTiktokLink(data.tiktok_link || "");
      } else {
        console.log("No profile found, waiting for user to create one.");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load your profile.",
        variant: "destructive",
      });
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

        // --- AUTO-SAVE FIX: Clear drafts on successful save ---
        localStorage.removeItem("draft_displayName");
        localStorage.removeItem("draft_bio");
        localStorage.removeItem("draft_avatarUrl");
        localStorage.removeItem("draft_phoneNumber");
        localStorage.removeItem("draft_whatsappLink");
        localStorage.removeItem("draft_instagramLink");
        localStorage.removeItem("draft_tiktokLink");

        toast({
          title: "Saved!",
          description: "Your profile has been updated.",
        });
      }
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save your profile.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload an image.", variant: "destructive" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image smaller than 2MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      await supabase.storage.from('avatars').remove([filePath]);
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const newAvatarUrl = urlData.publicUrl + '?t=' + Date.now();
      setAvatarUrl(newAvatarUrl);

      toast({
        title: "Image Uploaded",
        description: "Click 'Save Changes' to apply your new avatar.",
      });

    } catch (error) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const copyProfileLink = () => {
    if (profile?.username) {
      navigator.clipboard.writeText(`${window.location.origin}/profile/${profile.username}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied!", description: "Link copied to clipboard." });
    } else {
      toast({ title: "No Profile", description: "Please save your profile first.", variant: "destructive" });
    }
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
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/15 rounded-full blur-3xl" />
      </div>

      <header className="relative z-10 container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Link2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">LinkBio</span>
          </Link>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link to="/admin"><Button variant="secondary" size="sm"><Shield className="w-4 h-4 mr-2" />Admin</Button></Link>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </nav>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Edit Your Profile
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              {profile?.username ? (
                <p className="text-muted-foreground">
                  Your public link:{" "}
                  <Link to={`/profile/${profile.username}`} className="text-primary hover:underline">
                    linkbio.app/{profile.username}
                  </Link>
                </p>
              ) : (
                <p className="text-yellow-500 text-sm">Please save your profile to generate your link.</p>
              )}

              <Button variant="ghost" size="icon" onClick={copyProfileLink} disabled={!profile?.username} className="h-8 w-8">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-border">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <User className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                  {uploading ? <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" /> : <Upload className="w-4 h-4 text-primary-foreground" />}
                </label>
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground">Avatar URL</label>
                <Input type="url" placeholder="Or paste URL..." value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="mt-1" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Display Name</label>
              <Input type="text" placeholder="Your Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Bio</label>
              <Textarea placeholder="Tell the world about yourself..." value={bio} onChange={(e) => setBio(e.target.value)} className="min-h-[100px] resize-none" />
            </div>

            <div className="border-t border-border pt-6 space-y-4">
              <h3 className="font-semibold">Social Links</h3>
              <Input placeholder="Phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
              <Input placeholder="WhatsApp Link" value={whatsappLink} onChange={(e) => setWhatsappLink(e.target.value)} />
              <Input placeholder="Instagram Link" value={instagramLink} onChange={(e) => setInstagramLink(e.target.value)} />
              <Input placeholder="TikTok Link" value={tiktokLink} onChange={(e) => setTiktokLink(e.target.value)} />
            </div>

            {user && (
              <div className="border-t border-border pt-6">
                <CustomLinksManager userId={user.id} />
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              {profile?.username ? (
                <Link to={`/profile/${profile.username}`}>
                  <Button variant="outline"><ExternalLink className="w-4 h-4 mr-2" /> View Profile</Button>
                </Link>
              ) : (
                <Button variant="outline" disabled>Save to View Profile</Button>
              )}

              <Button onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;