-- Create secure RPC function to verify PIN and claim card
CREATE OR REPLACE FUNCTION public.verify_and_claim_card(input_card_id text, input_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  card_record RECORD;
  current_user_id uuid;
  existing_card_count integer;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Check if user already has a card
  SELECT COUNT(*) INTO existing_card_count
  FROM public.nfc_cards
  WHERE linked_user_id = current_user_id;
  
  IF existing_card_count > 0 THEN
    RAISE EXCEPTION 'User already has a linked card';
  END IF;
  
  -- Fetch the card
  SELECT * INTO card_record
  FROM public.nfc_cards
  WHERE card_id = input_card_id;
  
  -- Check if card exists
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if already claimed
  IF card_record.linked_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'Card already claimed';
  END IF;
  
  -- Verify PIN (server-side comparison - PIN never sent to frontend)
  IF card_record.secret_pin != input_pin THEN
    RETURN FALSE;
  END IF;
  
  -- Claim the card
  UPDATE public.nfc_cards
  SET 
    linked_user_id = current_user_id,
    claimed_at = now(),
    is_active = true
  WHERE card_id = input_card_id
    AND linked_user_id IS NULL;
  
  RETURN TRUE;
END;
$$;

-- Create a function to check card status without exposing secret_pin
CREATE OR REPLACE FUNCTION public.check_card_status(input_card_id text)
RETURNS TABLE(card_exists boolean, is_claimed boolean, is_active boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE as card_exists,
    (linked_user_id IS NOT NULL) as is_claimed,
    nfc_cards.is_active
  FROM public.nfc_cards
  WHERE card_id = input_card_id;
  
  -- If no rows returned, return card doesn't exist
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, FALSE, FALSE;
  END IF;
END;
$$;

-- Drop the insecure public SELECT policy
DROP POLICY IF EXISTS "Anyone can view card status" ON public.nfc_cards;

-- Create restricted SELECT policy - users can only see their own linked cards
CREATE POLICY "Users can view their own linked cards"
ON public.nfc_cards
FOR SELECT
USING (
  auth.uid() = linked_user_id
  OR has_role(auth.uid(), 'admin')
);