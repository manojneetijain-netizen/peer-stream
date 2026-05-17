
-- 1. Hide sensitive profile columns from public view (column-level revocation)
REVOKE SELECT (full_name, phone, date_of_birth, gender) ON public.profiles FROM anon, authenticated;

-- 2. Provide an owner-only path to read those private fields
CREATE OR REPLACE FUNCTION public.get_my_private_profile()
RETURNS TABLE (
  full_name text,
  phone text,
  date_of_birth date,
  gender text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.full_name, p.phone, p.date_of_birth, p.gender
  FROM public.profiles p
  WHERE p.user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_private_profile() TO authenticated;

-- 3. Tighten notifications INSERT policy: from_user_id must match caller
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "Users can create notifications as themselves"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (from_user_id IS NULL OR from_user_id = auth.uid())
);

-- 4. Allow users to update their own comments
CREATE POLICY "Users can update their own comments"
ON public.comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
