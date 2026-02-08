
-- Add type column to posts to distinguish reels from regular posts
ALTER TABLE public.posts ADD COLUMN type text NOT NULL DEFAULT 'post';

-- Create index for efficient filtering
CREATE INDEX idx_posts_type ON public.posts (type);

-- Create storage bucket for reel videos
INSERT INTO storage.buckets (id, name, public) VALUES ('reel-videos', 'reel-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for reel videos
CREATE POLICY "Reel videos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'reel-videos');

CREATE POLICY "Users can upload reel videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'reel-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their reel videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'reel-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
