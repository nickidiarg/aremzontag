-- Drop the existing SELECT policy for custom_links
DROP POLICY IF EXISTS "Anyone can view active links for public profiles" ON public.custom_links;

-- Create improved SELECT policy that checks profile is not banned
CREATE POLICY "Public can view active links for non-banned profiles"
ON public.custom_links
FOR SELECT
USING (
  is_active = true 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = custom_links.user_id 
    AND profiles.is_banned = false
  )
);