-- Allow users to delete messages they sent
CREATE POLICY "Users can delete their sent messages"
ON public.messages
FOR DELETE
USING (auth.uid() = sender_id);