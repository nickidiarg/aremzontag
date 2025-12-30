import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Link2, Sparkles, Share2, Smartphone, Zap } from "lucide-react";
const Index = () => {
  const {
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();

  // Redirect logged in users to dashboard
  if (!loading && user) {
    navigate("/dashboard");
    return null;
  }
  return <div className="min-h-screen animated-gradient-bg">
    {/* Background glow effects */}
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent/15 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-0 w-72 h-72 bg-primary/15 rounded-full blur-3xl" />
    </div>

    {/* Header */}
    <header className="relative z-10 container mx-auto px-4 py-6">
      <nav className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Link2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-display font-bold text-foreground">Aremzon LinkBio</span>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link to="/auth">
            <Button variant="hero" size="sm">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>
    </header>

    {/* Hero Section */}
    <main className="relative z-10">
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/60 border border-border mb-8 fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">The smartest way to share</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold mb-6 slide-up" style={{
            animationDelay: '0.1s'
          }}>
            <span className="text-foreground">One Link.</span>{" "}
            <span className="text-gradient-hero">Infinite Possibilities.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto slide-up" style={{
            animationDelay: '0.2s'
          }}>
            Create your personal hub for all your links. Share your social profiles, portfolio,
            and contact info with just one beautiful link.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 slide-up" style={{
            animationDelay: '0.3s'
          }}>
            <Link to="/auth">
              <Button variant="hero" size="xl" className="group">
                Create Your LinkBio
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/profile/demo">
              <Button variant="glass" size="xl">
                See Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Feature 1 */}
          <div className="glass-card rounded-2xl p-6 text-center hover:scale-[1.02] transition-transform fade-in" style={{
            animationDelay: '0.4s'
          }}>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-lg mb-2 text-foreground">Mobile First</h3>
            <p className="text-muted-foreground text-sm">
              Designed for perfect viewing on any device, especially mobile.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-card rounded-2xl p-6 text-center hover:scale-[1.02] transition-transform fade-in" style={{
            animationDelay: '0.5s'
          }}>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-lg mb-2 text-foreground">Instant Setup</h3>
            <p className="text-muted-foreground text-sm">
              Create your page in minutes. No coding required.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-card rounded-2xl p-6 text-center hover:scale-[1.02] transition-transform fade-in" style={{
            animationDelay: '0.6s'
          }}>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-lg mb-2 text-foreground">Easy Sharing</h3>
            <p className="text-muted-foreground text-sm">
              Share anywhere: Instagram bio, email signatures, business cards.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-border">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2024 LinkBio. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </main>
  </div>;
};
export default Index;