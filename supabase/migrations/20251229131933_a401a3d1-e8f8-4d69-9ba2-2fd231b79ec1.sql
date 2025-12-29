-- Drop the SECURITY DEFINER view as it's not needed
-- The RLS policies already protect secret_pin properly
DROP VIEW IF EXISTS public.nfc_cards_safe;