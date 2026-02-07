
-- Create reposts table
CREATE TABLE public.reposts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reposts are viewable by everyone" ON public.reposts FOR SELECT USING (true);
CREATE POLICY "Users can repost" ON public.reposts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unrepost" ON public.reposts FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE reposts;
