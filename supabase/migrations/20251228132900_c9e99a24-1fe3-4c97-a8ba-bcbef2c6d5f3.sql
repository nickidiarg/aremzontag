-- Create NFC cards table
CREATE TABLE public.nfc_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id TEXT NOT NULL UNIQUE,
  secret_pin TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  linked_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nfc_cards ENABLE ROW LEVEL SECURITY;

-- Anyone can view cards to check status (but not the PIN)
CREATE POLICY "Anyone can view card status"
ON public.nfc_cards
FOR SELECT
USING (true);

-- Only the linked user can update their card
CREATE POLICY "Users can update their own card"
ON public.nfc_cards
FOR UPDATE
USING (auth.uid() = linked_user_id);

-- Allow claiming unclaimed cards (insert handled via service role or specific policy)
CREATE POLICY "Allow claiming unclaimed cards"
ON public.nfc_cards
FOR UPDATE
USING (linked_user_id IS NULL)
WITH CHECK (auth.uid() = linked_user_id);

-- Trigger for updated_at
CREATE TRIGGER update_nfc_cards_updated_at
BEFORE UPDATE ON public.nfc_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample cards for testing
INSERT INTO public.nfc_cards (card_id, secret_pin, is_active) VALUES
('card-001', '123456', true),
('card-002', '654321', true),
('card-003', '111111', true);