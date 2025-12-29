-- =============================================================
-- FIX 1: Make check_card_status accessible to public (no auth required)
-- This is already a SECURITY DEFINER function, we just need to grant execute
-- =============================================================

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.check_card_status(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_card_status(text) TO authenticated;

-- =============================================================
-- FIX 2: Admin-only card generation - Update RLS INSERT policy
-- =============================================================

-- Drop the old INSERT policy that allows all authenticated users
DROP POLICY IF EXISTS "Authenticated users can insert cards" ON public.nfc_cards;

-- Create new INSERT policy: Only admins can generate cards
CREATE POLICY "Only admins can insert cards"
ON public.nfc_cards
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================================
-- FIX 2B: Admin Unclaim Function
-- =============================================================

-- Create function for admins to unclaim/reset a card
CREATE OR REPLACE FUNCTION public.admin_unclaim_card(target_card_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if the caller is an admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can unclaim cards';
  END IF;

  -- Update the card to unclaim it
  UPDATE public.nfc_cards
  SET 
    linked_user_id = NULL,
    claimed_at = NULL,
    is_active = true
  WHERE card_id = target_card_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

-- Grant execute to authenticated users (function itself checks admin role)
GRANT EXECUTE ON FUNCTION public.admin_unclaim_card(text) TO authenticated;

-- =============================================================
-- FIX 3: Avatar Storage Bucket and Policies
-- =============================================================

-- Create the avatars bucket (public so images can be viewed)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public to view/download avatars (since bucket is public)
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- =============================================================
-- FIX 4: Ensure secret_pin is NEVER exposed
-- The existing RLS policies on nfc_cards only allow:
-- - Users to view their OWN linked cards
-- - Admins to view all cards
-- The check_card_status RPC never returns secret_pin
-- The verify_and_claim_card RPC only compares PIN server-side
-- This is already secure by design, but let's add an extra safeguard
-- =============================================================

-- Create a view that explicitly excludes secret_pin for extra safety
-- (This is defense in depth - the RLS already protects it)
CREATE OR REPLACE VIEW public.nfc_cards_safe AS
SELECT 
  id,
  card_id,
  is_active,
  linked_user_id,
  claimed_at,
  created_at,
  updated_at
FROM public.nfc_cards;