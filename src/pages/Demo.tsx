import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  User, 
  Phone, 
  Instagram, 
  Link2,
  ExternalLink,
  Globe,
  Twitter,
  Youtube,
  Music
} from "lucide-react";

// Hardcoded demo profile data - never fetched from DB
const DEMO_PROFILE = {
  username: "sarahjohnson",
  display_name: "Sarah Johnson",
  bio: "Digital creator & entrepreneur 🚀 Helping brands grow through creative content. NYC based.",
  avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
  views: 12847,
};

const DEMO_LINKS = [
  { title: "Call Me", icon: <Phone className="w-5 h-5" />, url: "tel:+1234567890" },
  { title: "WhatsApp", icon: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ), url: "https://wa.me/1234567890" },
  { title: "Instagram", icon: <Instagram className="w-5 h-5" />, url: "https://instagram.com/sarahjohnson" },
  { title: "TikTok", icon: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
    </svg>
  ), url: "https://tiktok.com/@sarahjohnson" },
  { title: "My Website", icon: <Globe className="w-5 h-5" />, url: "https://sarahjohnson.com" },
  { title: "Twitter / X", icon: <Twitter className="w-5 h-5" />, url: "https://twitter.com/sarahjohnson" },
  { title: "YouTube Channel", icon: <Youtube className="w-5 h-5" />, url: "https://youtube.com/@sarahjohnson" },
  { title: "Spotify Playlist", icon: <Music className="w-5 h-5" />, url: "https://spotify.com/user/sarahjohnson" },
];

const Demo = () => {
  return (
    <div className="min-h-screen animated-gradient-bg">
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground py-2 px-4 text-center text-sm font-medium">
        👋 This is a demo profile! <Link to="/auth" className="underline hover:no-underline ml-1">Create your own free →</Link>
      </div>

      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-accent/15 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <main className="relative z-10 container mx-auto px-4 py-12 max-w-md">
        {/* Profile Card */}
        <div className="text-center mb-8 fade-in">
          {/* Avatar */}
          <div className="w-28 h-28 rounded-full mx-auto mb-4 overflow-hidden border-4 border-primary/30 shadow-lg pulse-glow">
            <img 
              src={DEMO_PROFILE.avatar_url} 
              alt={DEMO_PROFILE.display_name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Name */}
          <h1 className="text-2xl font-display font-bold text-foreground mb-1">
            {DEMO_PROFILE.display_name}
          </h1>
          
          {/* Username */}
          <p className="text-muted-foreground text-sm mb-2">
            @{DEMO_PROFILE.username}
          </p>

          {/* Views Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {DEMO_PROFILE.views.toLocaleString()} views
          </div>

          {/* Bio */}
          <p className="text-foreground/80 text-sm max-w-xs mx-auto leading-relaxed">
            {DEMO_PROFILE.bio}
          </p>
        </div>

        {/* Links */}
        <div className="space-y-3">
          {DEMO_LINKS.map((link, index) => (
            <div
              key={link.title}
              className="block slide-up cursor-pointer"
              style={{ animationDelay: `${0.1 + index * 0.1}s` }}
            >
              <Button variant="social" className="justify-between">
                <span className="flex items-center gap-3">
                  {link.icon}
                  {link.title}
                </span>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link to="/auth">
            <Button variant="hero" size="lg" className="w-full">
              Create Your Free Profile
            </Button>
          </Link>
        </div>

        {/* Footer */}
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

export default Demo;
