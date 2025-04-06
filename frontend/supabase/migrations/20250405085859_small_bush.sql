/*
  # Initial Schema Setup

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, matches auth.users)
      - `email` (text)
      - `full_name` (text)
      - `role` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `interviews`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `interviewer_id` (uuid, references profiles)
      - `candidate_id` (uuid, references profiles)
      - `scheduled_at` (timestamp)
      - `duration` (integer, minutes)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  full_name text,
  role text NOT NULL CHECK (role IN ('interviewer', 'candidate')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  interviewer_id uuid REFERENCES profiles(id),
  candidate_id uuid REFERENCES profiles(id),
  scheduled_at timestamptz NOT NULL,
  duration integer NOT NULL,
  status text NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed')) DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Interviews policies
CREATE POLICY "Users can read interviews they're part of"
  ON interviews
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = interviewer_id OR 
    auth.uid() = candidate_id
  );

CREATE POLICY "Interviewers can create interviews"
  ON interviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'interviewer'
    )
  );

CREATE POLICY "Interviewers can update their own interviews"
  ON interviews
  FOR UPDATE
  TO authenticated
  USING (
    interviewer_id = auth.uid()
  );

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'candidate');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();