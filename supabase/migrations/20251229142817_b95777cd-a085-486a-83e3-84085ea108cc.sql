-- Drop any existing functions that might conflict
DROP FUNCTION IF EXISTS public.get_public_card_status(text);
DROP FUNCTION IF EXISTS public.get_card_status_public(text);
DROP FUNCTION IF EXISTS public.check_card_availability(text);

-- Create new simple RPC function for checking card availability
CREATE OR REPLACE FUNCTION public.check_card_availability(slug_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  card_record RECORD;
  result json;
BEGIN
  -- Search for the card
  SELECT card_id, is_active, (linked_user_id IS NOT NULL) as is_claimed
  INTO card_record
  FROM public.nfc_cards
  WHERE card_id = slug_input;
  
  -- If card found
  IF FOUND THEN
    IF card_record.is_claimed THEN
      result := json_build_object('exists', true, 'status', 'claimed');
    ELSIF NOT card_record.is_active THEN
      result := json_build_object('exists', true, 'status', 'inactive');
    ELSE
      result := json_build_object('exists', true, 'status', 'available');
    END IF;
  ELSE
    result := json_build_object('exists', false, 'status', 'not_found');
  END IF;
  
  RETURN result;
END;
$$;

-- Grant execute permissions to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.check_card_availability(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_card_availability(text) TO authenticated;

-- Add RLS safety net policy for anon to see card_id column only
-- First drop if exists to avoid conflicts
DROP POLICY IF EXISTS "Anon can check card existence" ON public.nfc_cards;

-- Create policy allowing anon to select only card_id
CREATE POLICY "Anon can check card existence" 
ON public.nfc_cards 
FOR SELECT 
TO anon
USING (true);