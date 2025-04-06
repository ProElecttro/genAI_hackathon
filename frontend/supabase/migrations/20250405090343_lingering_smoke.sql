/*
  # Fix RLS policies for interviews table

  1. Changes
    - Drop existing INSERT policy
    - Create new INSERT policy that properly checks interviewer role and sets interviewer_id
    
  2. Security
    - Ensures only interviewers can create interviews
    - Automatically sets interviewer_id to the authenticated user's ID
    - Maintains existing SELECT and UPDATE policies
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Interviewers can create interviews" ON interviews;

-- Create new INSERT policy with proper role check and interviewer_id enforcement
CREATE POLICY "Interviewers can create interviews" ON interviews 
FOR INSERT TO authenticated
WITH CHECK (
  (
    -- Check if the user is an interviewer
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'interviewer'
    )
    -- Ensure interviewer_id is set to the authenticated user
    AND interviewer_id = auth.uid()
  )
);