
-- Fix 1: Add validation to handle_new_user() SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username TEXT;
  v_display_name TEXT;
BEGIN
  v_username := NULLIF(trim(NEW.raw_user_meta_data->>'username'), '');
  v_display_name := NULLIF(trim(NEW.raw_user_meta_data->>'display_name'), '');

  -- Enforce length limits
  v_username := LEFT(v_username, 30);
  v_display_name := LEFT(v_display_name, 50);

  -- Enforce username format (alphanumeric + underscore only)
  IF v_username IS NOT NULL AND v_username !~ '^[a-zA-Z0-9_]+$' THEN
    v_username := NULL;
  END IF;

  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (NEW.id, v_username, v_display_name);
  RETURN NEW;
END;
$$;

-- Fix 2: Add database-level input length constraints
ALTER TABLE public.profiles ADD CONSTRAINT username_length CHECK (length(username) <= 30);
ALTER TABLE public.profiles ADD CONSTRAINT display_name_length CHECK (length(display_name) <= 50);
ALTER TABLE public.profiles ADD CONSTRAINT bio_length CHECK (length(bio) <= 500);
ALTER TABLE public.posts ADD CONSTRAINT content_length CHECK (length(content) <= 5000);
ALTER TABLE public.comments ADD CONSTRAINT comment_content_length CHECK (length(content) <= 1000);
ALTER TABLE public.messages ADD CONSTRAINT message_content_length CHECK (length(content) <= 2000);
ALTER TABLE public.reports ADD CONSTRAINT report_reason_length CHECK (length(reason) <= 500);

-- Fix 3: Add missing FK constraints with CASCADE for post deletion integrity
ALTER TABLE public.reposts ADD CONSTRAINT reposts_post_id_fkey
  FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE public.reactions ADD CONSTRAINT reactions_post_id_fkey
  FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE public.bookmarks ADD CONSTRAINT bookmarks_post_id_fkey
  FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
