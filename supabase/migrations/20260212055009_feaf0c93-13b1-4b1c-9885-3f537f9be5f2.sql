
-- Add is_private column to profiles
ALTER TABLE public.profiles ADD COLUMN is_private boolean NOT NULL DEFAULT false;

-- Create follow_requests table
CREATE TABLE public.follow_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id uuid NOT NULL,
  target_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(requester_id, target_id)
);

-- Enable RLS
ALTER TABLE public.follow_requests ENABLE ROW LEVEL SECURITY;

-- Requesters can create requests
CREATE POLICY "Users can send follow requests"
ON public.follow_requests FOR INSERT
WITH CHECK (auth.uid() = requester_id);

-- Users can see requests they sent or received
CREATE POLICY "Users can view their follow requests"
ON public.follow_requests FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = target_id);

-- Target user can update (accept/reject)
CREATE POLICY "Target can update follow requests"
ON public.follow_requests FOR UPDATE
USING (auth.uid() = target_id);

-- Either party can delete
CREATE POLICY "Users can delete follow requests"
ON public.follow_requests FOR DELETE
USING (auth.uid() = requester_id OR auth.uid() = target_id);

-- Trigger for updated_at
CREATE TRIGGER update_follow_requests_updated_at
BEFORE UPDATE ON public.follow_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
