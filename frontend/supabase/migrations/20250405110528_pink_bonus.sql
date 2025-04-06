/*
  # Add storage for interview recordings

  1. New Storage Bucket
    - Create a new storage bucket for interview recordings
    - Set up appropriate security policies
*/

-- Enable storage
CREATE EXTENSION IF NOT EXISTS "storage" SCHEMA extensions;

-- Create a new bucket for interview recordings
INSERT INTO storage.buckets (id, name)
VALUES ('interview-recordings', 'interview-recordings')
ON CONFLICT DO NOTHING;

-- Set up storage policies
CREATE POLICY "Interviewers can access recordings"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'interview-recordings'
  AND (
    -- Check if user is the interviewer for this interview
    EXISTS (
      SELECT 1 FROM interviews
      WHERE interviews.interviewer_id = auth.uid()
      AND storage.objects.name LIKE 'interviews/' || interviews.id || '/%'
    )
  )
);