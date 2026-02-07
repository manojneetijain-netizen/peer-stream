
-- 1. User lists/groups
CREATE TABLE public.user_lists (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.user_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own lists" ON public.user_lists FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.user_list_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id uuid NOT NULL REFERENCES public.user_lists(id) ON DELETE CASCADE,
  member_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(list_id, member_id)
);
ALTER TABLE public.user_list_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "List members viewable by list owner" ON public.user_list_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_lists WHERE user_lists.id = user_list_members.list_id AND user_lists.user_id = auth.uid()));
CREATE POLICY "List owner can manage members" ON public.user_list_members FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_lists WHERE user_lists.id = user_list_members.list_id AND user_lists.user_id = auth.uid()));
CREATE POLICY "List owner can remove members" ON public.user_list_members FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.user_lists WHERE user_lists.id = user_list_members.list_id AND user_lists.user_id = auth.uid()));

-- 2. Add video_url to posts
ALTER TABLE public.posts ADD COLUMN video_url text DEFAULT NULL;

-- 3. Create post-videos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('post-videos', 'post-videos', true);

CREATE POLICY "Anyone can view post videos" ON storage.objects FOR SELECT USING (bucket_id = 'post-videos');
CREATE POLICY "Authenticated users can upload post videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-videos' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete their own post videos" ON storage.objects FOR DELETE USING (bucket_id = 'post-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
