/*
  # Initial Schema Setup for Trawork

  1. New Tables
    - `members`
      - `id` (uuid, primary key)
      - `name` (text)
      - `role` (text)
      - `created_at` (timestamp)
    
    - `tasks`
      - `id` (uuid, primary key)
      - `title` (text)
      - `assignee` (uuid, foreign key to members)
      - `status` (text)
      - `deadline` (date)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to:
      - Read all members and tasks
      - Create new members and tasks
      - Update task status
*/

-- Create members table
CREATE TABLE members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  assignee uuid REFERENCES members(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed')),
  deadline date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for members table
CREATE POLICY "Allow read access to members"
  ON members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert access to members"
  ON members
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for tasks table
CREATE POLICY "Allow read access to tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert access to tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update access to tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);