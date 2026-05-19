
-- 1. Fix profiles: hide phone, date_of_birth, full_name, gender from public reads via column privileges
REVOKE SELECT (phone, date_of_birth, full_name, gender) ON public.profiles FROM anon, authenticated;

-- 2. Fix follower_snapshots INSERT policy
DROP POLICY IF EXISTS "Authenticated can insert snapshots" ON public.follower_snapshots;
CREATE POLICY "Users can insert their own snapshots"
ON public.follower_snapshots
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Hide scheduled posts from non-owners
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts are viewable when published or by owner"
ON public.posts
FOR SELECT
USING (scheduled_at IS NULL OR scheduled_at <= now() OR auth.uid() = user_id);

-- 4. Storage policy: avatars DELETE
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5. Storage policy: post-images DELETE + UPDATE
CREATE POLICY "Users can delete their own post images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own post images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 6. Restrict SECURITY DEFINER function execution to intended roles
REVOKE EXECUTE ON FUNCTION public.get_my_private_profile() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_my_private_profile() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
