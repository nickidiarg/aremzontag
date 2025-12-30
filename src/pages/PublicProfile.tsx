import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  User,
  Phone,
  Instagram,
  ArrowLeft,
  Loader2,
  Link2,
  ExternalLink
} from "lucide-react";

interface Profile {
  id: string;
  // user_id: string;  <-- REMOVED: Your DB calls this 'id'
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  whatsapp_link: string | null;
  instagram_link: string | null;
  tiktok_link: string | null;
}

interface CustomLink {
  id: string;
  title: string;
  url: string;
  position: number;
  is_active: boolean;
}

interface PublicProfileProps {
  username?: string;
}

// Demo profile data (Kept for safety)
const DEMO_PROFILE: Profile = {
  id: "demo-id",
  username: "demo",
  display_name: "Alex Johnson",
  bio: "Digital creator & entrepreneur. Building amazing things one link at a time. 🚀",
  avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face",
  phone_number: "+1 (555) 123-4567",
  whatsapp_link: "https://wa.me/15551234567",
  instagram_link: "https://instagram.com/alexjohnson",
  tiktok_link: "https://tiktok.com/@alexjohnson",
};

const DEMO_LINKS: CustomLink[] = [
  { id: "1", title: "My Portfolio", url: "https://alexjohnson.design", position: 0, is_active: true },
  { id: "2", title: "Book a Consultation", url: "https://calendly.com/alexjohnson", position: 1, is_active: true },
];

const PublicProfile = ({ username: propUsername }: PublicProfileProps) => {
  const { username: paramUsername } = useParams<{ username: string }>();
  const username = propUsername || paramUsername;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user?.id || null);
    });
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    if (!username) return;

    if (username.toLowerCase() === "demo") {
      setProfile(DEMO_PROFILE);
      setCustomLinks(DEMO_LINKS);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);

        // Increment view count (ignoring errors for smooth UX)
        supabase.rpc("increment_profile_views", { profile_username: username });

        // FIX: Use 'data.id' instead of 'data.user_id'
        // This connects the Profile ID to the Links User ID
        const { data: linksData } = await supabase
          .from("custom_links")
          .select("*")
          .eq("user_id", data.id)
          .eq("is_active", true)
          .order("position", { ascending: true });

        if (linksData) {
          setCustomLinks(linksData);
        }
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen animated-gradient-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen animated-gradient-bg flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Profile Not Found
          </h1>
          <p className="text-muted-foreground mb-6">
            The profile @{username} doesn't exist yet.
          </p>
          <Link to="/">
            <Button variant="default">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const builtInLinks = [
    {
      label: "Call Me",
      href: profile?.phone_number ? `tel:${profile.phone_number}` : null,
      icon: <Phone className="w-5 h-5" />,
      show: !!profile?.phone_number,
    },
    {
      label: "WhatsApp",
      href: profile?.whatsapp_link,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
      show: !!profile?.whatsapp_link,
    },
    {
      label: "Instagram",
      href: profile?.instagram_link,
      icon: <Instagram className="w-5 h-5" />,
      show: !!profile?.instagram_link,
    },
    {
      label: "TikTok",
      href: profile?.tiktok_link,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
        </svg>
      ),
      show: !!profile?.tiktok_link,
    },
  ];

  const visibleBuiltInLinks = builtInLinks.filter((link) => link.show);

  return (
    <div className="min-h-screen animated-gradient-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-accent/15 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 container mx-auto px-4 py-12 max-w-md">
        <div className="text-center mb-8 fade-in">
          <div className="w-28 h-28 rounded-full mx-auto mb-4 overflow-hidden border-4 border-primary/30 shadow-lg pulse-glow">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name || profile.username}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full bg-secondary flex items-center justify-center"><svg class="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>';
                }}
              />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center">
                <User className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
          </div>

          <h1 className="text-2xl font-display font-bold text-foreground mb-1">
            {profile?.display_name || profile?.username}
          </h1>

          <p className="text-muted-foreground text-sm mb-2">
            @{profile?.username}
          </p>

          {profile?.bio && (
            <p className="text-foreground/80 text-sm max-w-xs mx-auto leading-relaxed">
              {profile.bio}
            </p>
          )}
        </div>

        <div className="space-y-3">
          {visibleBuiltInLinks.map((link, index) => (
            <a
              key={link.label}
              href={link.href || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="block slide-up"
              style={{ animationDelay: `${0.1 + index * 0.1}s` }}
            >
              <Button variant="outline" className="w-full justify-between h-14 bg-background/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 hover:bg-background/80 transition-all duration-300">
                <span className="flex items-center gap-3">
                  {link.icon}
                  {link.label}
                </span>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </Button>
            </a>
          ))}

          {customLinks.map((link, index) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block slide-up"
              style={{ animationDelay: `${0.1 + (visibleBuiltInLinks.length + index) * 0.1}s` }}
            >
              <Button variant="outline" className="w-full justify-between h-14 bg-background/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 hover:bg-background/80 transition-all duration-300">
                <span className="flex items-center gap-3">
                  <Link2 className="w-5 h-5" />
                  {link.title}
                </span>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </Button>
            </a>
          ))}

          {visibleBuiltInLinks.length === 0 && customLinks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No links added yet.</p>
            </div>
          )}
        </div>

        <footer className="mt-12 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Link2 className="w-4 h-4" />
            Powered by LinkBio
          </Link>
        </footer>
      </main>
    </div>
  );
};

export default PublicProfile;