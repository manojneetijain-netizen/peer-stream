
-- Post images table for multi-image carousel posts
CREATE TABLE public.post_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post images are viewable by everyone" ON public.post_images FOR SELECT USING (true);
CREATE POLICY "Users can add images to own posts" ON public.post_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete images from own posts" ON public.post_images FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
);

-- Hashtags table
CREATE TABLE public.hashtags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hashtags are viewable by everyone" ON public.hashtags FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create hashtags" ON public.hashtags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Post-hashtag junction
CREATE TABLE public.post_hashtags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  hashtag_id UUID NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
  UNIQUE(post_id, hashtag_id)
);

ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Post hashtags are viewable by everyone" ON public.post_hashtags FOR SELECT USING (true);
CREATE POLICY "Users can tag own posts" ON public.post_hashtags FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
);
CREATE POLICY "Users can untag own posts" ON public.post_hashtags FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
);

-- Blocks table
CREATE TABLE public.blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own blocks" ON public.blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users can block others" ON public.blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can unblock others" ON public.blocks FOR DELETE USING (auth.uid() = blocker_id);

-- Mutes table
CREATE TABLE public.mutes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  muter_id UUID NOT NULL,
  muted_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(muter_id, muted_id)
);

ALTER TABLE public.mutes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own mutes" ON public.mutes FOR SELECT USING (auth.uid() = muter_id);
CREATE POLICY "Users can mute others" ON public.mutes FOR INSERT WITH CHECK (auth.uid() = muter_id);
CREATE POLICY "Users can unmute others" ON public.mutes FOR DELETE USING (auth.uid() = muter_id);

-- Add parent_id to comments for threading
ALTER TABLE public.comments ADD COLUMN parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_post_images_post_id ON public.post_images(post_id);
CREATE INDEX idx_post_hashtags_post_id ON public.post_hashtags(post_id);
CREATE INDEX idx_post_hashtags_hashtag_id ON public.post_hashtags(hashtag_id);
CREATE INDEX idx_hashtags_name ON public.hashtags(name);
CREATE INDEX idx_blocks_blocker ON public.blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON public.blocks(blocked_id);
CREATE INDEX idx_mutes_muter ON public.mutes(muter_id);
CREATE INDEX idx_comments_parent ON public.comments(parent_id);
