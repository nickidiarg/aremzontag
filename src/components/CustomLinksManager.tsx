import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  GripVertical,
  ExternalLink,
  Loader2,
  Save,
} from "lucide-react";

interface CustomLink {
  id: string;
  title: string;
  url: string;
  position: number;
  is_active: boolean;
}

interface CustomLinksManagerProps {
  userId: string;
}

const CustomLinksManager = ({ userId }: CustomLinksManagerProps) => {
  const { toast } = useToast();
  const [links, setLinks] = useState<CustomLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");

  useEffect(() => {
    fetchLinks();
  }, [userId]);

  const fetchLinks = async () => {
    const { data, error } = await supabase
      .from("custom_links")
      .select("*")
      .eq("user_id", userId)
      .order("position", { ascending: true });

    if (!error && data) {
      setLinks(data);
    }
    setLoading(false);
  };

  const addLink = async () => {
    if (!newTitle.trim() || !newUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter both title and URL.",
        variant: "destructive",
      });
      return;
    }

    // Basic URL validation
    let formattedUrl = newUrl.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl;
    }

    setSaving(true);
    const { data, error } = await supabase
      .from("custom_links")
      .insert({
        user_id: userId,
        title: newTitle.trim(),
        url: formattedUrl,
        position: links.length,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add link.",
        variant: "destructive",
      });
    } else if (data) {
      setLinks([...links, data]);
      setNewTitle("");
      setNewUrl("");
      toast({
        title: "Link added!",
        description: "Your new link has been saved.",
      });
    }
    setSaving(false);
  };

  const updateLink = async (id: string, updates: Partial<CustomLink>) => {
    const { error } = await supabase
      .from("custom_links")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update link.",
        variant: "destructive",
      });
    } else {
      setLinks(links.map((link) => (link.id === id ? { ...link, ...updates } : link)));
    }
  };

  const deleteLink = async (id: string) => {
    const { error } = await supabase
      .from("custom_links")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete link.",
        variant: "destructive",
      });
    } else {
      setLinks(links.filter((link) => link.id !== id));
      toast({
        title: "Deleted",
        description: "Link has been removed.",
      });
    }
  };

  const moveLink = async (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === links.length - 1)
    ) {
      return;
    }

    const newLinks = [...links];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    // Swap positions
    [newLinks[index], newLinks[targetIndex]] = [newLinks[targetIndex], newLinks[index]];
    
    // Update positions
    const updatedLinks = newLinks.map((link, i) => ({ ...link, position: i }));
    setLinks(updatedLinks);

    // Save to database
    for (const link of updatedLinks) {
      await supabase
        .from("custom_links")
        .update({ position: link.position })
        .eq("id", link.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-display font-semibold text-foreground">
        Custom Links
      </h3>
      <p className="text-sm text-muted-foreground">
        Add unlimited custom links to your profile.
      </p>

      {/* Existing Links */}
      <div className="space-y-2">
        {links.map((link, index) => (
          <div
            key={link.id}
            className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border"
          >
            <div className="flex flex-col gap-1">
              <button
                onClick={() => moveLink(index, "up")}
                disabled={index === 0}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={() => moveLink(index, "down")}
                disabled={index === links.length - 1}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 grid grid-cols-2 gap-2">
              <Input
                value={link.title}
                onChange={(e) => updateLink(link.id, { title: e.target.value })}
                placeholder="Link Title"
                className="h-9"
              />
              <Input
                value={link.url}
                onChange={(e) => updateLink(link.id, { url: e.target.value })}
                placeholder="URL"
                className="h-9"
              />
            </div>

            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={() => deleteLink(link.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add New Link */}
      <div className="flex items-end gap-2 pt-2">
        <div className="flex-1 space-y-1">
          <label className="text-xs text-muted-foreground">Title</label>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g., My Website"
            className="h-9"
          />
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-xs text-muted-foreground">URL</label>
          <Input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="e.g., https://example.com"
            className="h-9"
          />
        </div>
        <Button
          variant="hero"
          size="sm"
          onClick={addLink}
          disabled={saving}
          className="h-9"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Add
        </Button>
      </div>
    </div>
  );
};

export default CustomLinksManager;
