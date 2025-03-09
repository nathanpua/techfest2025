/*
  # Create scans table for storing article content

  1. New Tables
    - `scans`
      - `id` (uuid, primary key)
      - `content` (text) - The article content
      - `source` (text) - Where the scan came from (website/extension)
      - `created_at` (timestamp)
      - `image_alt_text` (text, nullable) - For storing image alt text
      
  2. Security
    - Enable RLS on `scans` table
    - Add policies for inserting and viewing scans
*/

CREATE TABLE IF NOT EXISTS scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  source text NOT NULL,
  created_at timestamptz DEFAULT now(),
  image_alt_text text
);

ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert scans"
  ON scans
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can view scans"
  ON scans
  FOR SELECT
  TO public
  USING (true);