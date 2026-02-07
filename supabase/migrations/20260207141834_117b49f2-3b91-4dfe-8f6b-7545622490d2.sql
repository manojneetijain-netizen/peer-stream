
-- Post views/impressions tracking
CREATE TABLE public.post_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  viewer_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_post_views_post_id ON public.post_views(post_id);
CREATE INDEX idx_post_views_created ON public.post_views(created_at);
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Post views are insertable by authenticated" ON public.post_views FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Post views are viewable by everyone" ON public.post_views FOR SELECT USING (true);

-- Polls
CREATE TABLE public.polls (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL UNIQUE REFERENCES public.posts(id) ON DELETE CASCADE,
  question text NOT NULL,
  ends_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Polls are viewable by everyone" ON public.polls FOR SELECT USING (true);
CREATE POLICY "Users can create polls" ON public.polls FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM posts WHERE posts.id = polls.post_id AND posts.user_id = auth.uid()));

CREATE TABLE public.poll_options (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  text text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Poll options are viewable by everyone" ON public.poll_options FOR SELECT USING (true);
CREATE POLICY "Users can create poll options" ON public.poll_options FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM polls JOIN posts ON posts.id = polls.post_id WHERE polls.id = poll_options.poll_id AND posts.user_id = auth.uid()));

CREATE TABLE public.poll_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Poll votes are viewable by everyone" ON public.poll_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON public.poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can change vote" ON public.poll_votes FOR DELETE USING (auth.uid() = user_id);

-- Quote reposts: add quoted_post_id to posts
ALTER TABLE public.posts ADD COLUMN quoted_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL;

-- Follower count history for analytics
CREATE TABLE public.follower_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  follower_count integer NOT NULL DEFAULT 0,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, snapshot_date)
);
ALTER TABLE public.follower_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own snapshots" ON public.follower_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated can insert snapshots" ON public.follower_snapshots FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Enable realtime for polls
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
