-- =====================================================
-- FIX 1: Create profile_views table for privacy
-- =====================================================

-- Create a separate table for profile view tracking
CREATE TABLE IF NOT EXISTS public.profile_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL,
  viewed_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Anyone can INSERT a view (record views anonymously)
CREATE POLICY "Anyone can insert views"
ON public.profile_views
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only the profile owner can SELECT their view count
CREATE POLICY "Profile owners can view their stats"
ON public.profile_views
FOR SELECT
TO authenticated
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Create index for performance
CREATE INDEX idx_profile_views_profile_id ON public.profile_views(profile_id);

-- Create a function to get view count for dashboard (owner only)
CREATE OR REPLACE FUNCTION public.get_my_profile_views()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.profile_views pv
  INNER JOIN public.profiles p ON p.id = pv.profile_id
  WHERE p.user_id = auth.uid()
$$;

-- Update increment_profile_views to use the new table
CREATE OR REPLACE FUNCTION public.increment_profile_views(profile_username text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record RECORD;
BEGIN
  -- Get the profile id
  SELECT id INTO profile_record FROM public.profiles WHERE username = profile_username;
  
  IF profile_record.id IS NOT NULL THEN
    -- Insert a view record instead of incrementing counter
    INSERT INTO public.profile_views (profile_id) VALUES (profile_record.id);
  END IF;
END;
$$;