-- Allow authenticated users to insert NFC cards (for admin generation)
CREATE POLICY "Authenticated users can insert cards"
ON public.nfc_cards
FOR INSERT
TO authenticated
WITH CHECK (true);