-- Create a truly public RPC function for checking card status
-- This is a simpler version specifically for public/anonymous access
CREATE OR REPLACE FUNCTION public.get_card_status_public(lookup_id text)
RETURNS TABLE(
  card_exists boolean,
  is_claimed boolean,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE as card_exists,
    (nfc_cards.linked_user_id IS NOT NULL) as is_claimed,
    nfc_cards.is_active
  FROM public.nfc_cards
  WHERE nfc_cards.card_id = lookup_id;
  
  -- If no rows returned, return card doesn't exist
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE::boolean, FALSE::boolean, FALSE::boolean;
  END IF;
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_card_status_public(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_card_status_public(text) TO authenticated;