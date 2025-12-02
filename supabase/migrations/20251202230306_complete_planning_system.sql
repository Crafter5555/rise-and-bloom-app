/*
  # Complete Planning System Schema
  
  1. New Tables
    - `routines` - Morning/evening routines and recurring activities
    - `routine_steps` - Individual steps within routines
    - `journal_entries` - Morning planning and evening reflection entries
    - `mood_tracking` - Daily mood, energy, and wellness data
    - `daily_plans` - Scheduled items for specific days
    - `activity_completions` - Track when activities are completed
    
  2. Changes
    - Add category field to tasks table
    - Add scheduled_time to daily_plans
    - Add streak tracking columns to habits
    
  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create routines table
CREATE TABLE IF NOT EXISTS routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  routine_type text NOT NULL DEFAULT 'morning', -- morning, evening, custom
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create routine_steps table
CREATE TABLE IF NOT EXISTS routine_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  step_name text NOT NULL,
  duration_minutes integer DEFAULT 5,
  order_index integer DEFAULT 0,
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create journal_entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  entry_type text NOT NULL, -- 'morning' or 'evening'
  
  -- Morning planning fields
  sleep_quality integer,
  sleep_hours numeric,
  morning_energy integer,
  morning_mood integer,
  main_focus text,
  top_priorities jsonb,
  
  -- Evening reflection fields
  overall_mood integer,
  evening_energy integer,
  day_success_rating integer,
  completed_goals jsonb,
  gratitude_items jsonb,
  tomorrow_focus text,
  reflection_notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, entry_date, entry_type)
);

-- Create mood_tracking table
CREATE TABLE IF NOT EXISTS mood_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tracked_at timestamptz NOT NULL DEFAULT now(),
  mood_score integer NOT NULL CHECK (mood_score >= 1 AND mood_score <= 10),
  energy_level integer CHECK (energy_level >= 1 AND energy_level <= 10),
  stress_level integer CHECK (stress_level >= 1 AND stress_level <= 10),
  notes text,
  tags jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create daily_plans table
CREATE TABLE IF NOT EXISTS daily_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_date date NOT NULL,
  item_type text NOT NULL, -- 'habit', 'task', 'activity', 'workout', 'routine'
  item_id uuid NOT NULL,
  scheduled_time time,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create activity_completions table
CREATE TABLE IF NOT EXISTS activity_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completion_date date NOT NULL,
  duration_minutes integer,
  notes text,
  completed_at timestamptz DEFAULT now()
);

-- Add category to tasks if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'category'
  ) THEN
    ALTER TABLE tasks ADD COLUMN category text DEFAULT 'general';
  END IF;
END $$;

-- Add streak tracking to habits if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'habits' AND column_name = 'current_streak'
  ) THEN
    ALTER TABLE habits ADD COLUMN current_streak integer DEFAULT 0;
    ALTER TABLE habits ADD COLUMN longest_streak integer DEFAULT 0;
    ALTER TABLE habits ADD COLUMN last_completed_date date;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for routines
CREATE POLICY "Users can view own routines"
  ON routines FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own routines"
  ON routines FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routines"
  ON routines FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own routines"
  ON routines FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for routine_steps
CREATE POLICY "Users can view own routine steps"
  ON routine_steps FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM routines 
    WHERE routines.id = routine_steps.routine_id 
    AND routines.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own routine steps"
  ON routine_steps FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM routines 
    WHERE routines.id = routine_steps.routine_id 
    AND routines.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own routine steps"
  ON routine_steps FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM routines 
    WHERE routines.id = routine_steps.routine_id 
    AND routines.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own routine steps"
  ON routine_steps FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM routines 
    WHERE routines.id = routine_steps.routine_id 
    AND routines.user_id = auth.uid()
  ));

-- RLS Policies for journal_entries
CREATE POLICY "Users can view own journal entries"
  ON journal_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON journal_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON journal_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON journal_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for mood_tracking
CREATE POLICY "Users can view own mood data"
  ON mood_tracking FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood data"
  ON mood_tracking FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood data"
  ON mood_tracking FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mood data"
  ON mood_tracking FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for daily_plans
CREATE POLICY "Users can view own daily plans"
  ON daily_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily plans"
  ON daily_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily plans"
  ON daily_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily plans"
  ON daily_plans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for activity_completions
CREATE POLICY "Users can view own activity completions"
  ON activity_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity completions"
  ON activity_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity completions"
  ON activity_completions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own activity completions"
  ON activity_completions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_routines_user_id ON routines(user_id);
CREATE INDEX IF NOT EXISTS idx_routine_steps_routine_id ON routine_steps(routine_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date ON journal_entries(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_mood_tracking_user_time ON mood_tracking(user_id, tracked_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_plans_user_date ON daily_plans(user_id, plan_date DESC);
CREATE INDEX IF NOT EXISTS idx_activity_completions_user_date ON activity_completions(user_id, completion_date DESC);

-- Create function to update streak when habit is completed
CREATE OR REPLACE FUNCTION update_habit_streak()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE habits
  SET 
    current_streak = CASE
      WHEN last_completed_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1
      WHEN last_completed_date = CURRENT_DATE THEN current_streak
      ELSE 1
    END,
    longest_streak = GREATEST(
      longest_streak,
      CASE
        WHEN last_completed_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1
        WHEN last_completed_date = CURRENT_DATE THEN current_streak
        ELSE 1
      END
    ),
    last_completed_date = NEW.completion_date,
    updated_at = now()
  WHERE id = NEW.habit_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for habit streak updates
DROP TRIGGER IF EXISTS trigger_update_habit_streak ON habit_completions;
CREATE TRIGGER trigger_update_habit_streak
  AFTER INSERT ON habit_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_habit_streak();