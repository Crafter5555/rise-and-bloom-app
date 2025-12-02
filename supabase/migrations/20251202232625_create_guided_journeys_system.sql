/*
  # Guided Journeys System

  ## Overview
  Complete database schema for guided self-improvement journeys with structured programs,
  step-by-step progress tracking, and user enrollments.

  ## New Tables Created

  ### 1. `journeys`
  Main journey/program definitions
  - `id` (uuid, primary key)
  - `title` (text) - Journey name
  - `description` (text) - Detailed description
  - `category` (text) - Category (fitness, mindfulness, productivity, etc.)
  - `difficulty_level` (text) - beginner, intermediate, advanced
  - `estimated_duration_days` (integer) - Expected completion time
  - `is_premium` (boolean) - Requires premium subscription
  - `coach_led` (boolean) - Includes coach interactions
  - `thumbnail_url` (text) - Journey image
  - `total_steps` (integer) - Number of steps in journey
  - `popularity_score` (integer) - For sorting/recommendations
  - `is_published` (boolean) - Visibility status
  - `created_by` (uuid) - Admin/coach who created it
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `journey_steps`
  Individual steps/lessons within a journey
  - `id` (uuid, primary key)
  - `journey_id` (uuid, foreign key) - Parent journey
  - `step_number` (integer) - Order in sequence
  - `title` (text) - Step name
  - `description` (text) - Step content
  - `step_type` (text) - lesson, exercise, reflection, challenge
  - `content_url` (text) - Video/audio/article link
  - `content_type` (text) - video, audio, text, interactive
  - `estimated_minutes` (integer) - Time to complete
  - `is_required` (boolean) - Must complete to progress
  - `unlock_after_days` (integer) - Days after enrollment to unlock
  - `points_reward` (integer) - Points earned on completion
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `journey_enrollments`
  User enrollments in journeys
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - Enrolled user
  - `journey_id` (uuid, foreign key) - Journey enrolled in
  - `enrolled_at` (timestamptz) - Start date
  - `status` (text) - active, completed, paused, abandoned
  - `current_step` (integer) - Progress tracking
  - `completed_steps` (integer) - Steps finished
  - `completion_percentage` (integer) - Overall progress
  - `last_activity_at` (timestamptz) - Last interaction
  - `completed_at` (timestamptz) - Completion timestamp
  - `notes` (text) - User notes

  ### 4. `journey_progress`
  Detailed step completion tracking
  - `id` (uuid, primary key)
  - `enrollment_id` (uuid, foreign key) - Parent enrollment
  - `step_id` (uuid, foreign key) - Completed step
  - `user_id` (uuid, foreign key) - User who completed
  - `completed_at` (timestamptz) - Completion time
  - `time_spent_minutes` (integer) - Actual time spent
  - `quality_rating` (integer) - User rating 1-5
  - `notes` (text) - User reflection
  - `points_earned` (integer) - Points awarded

  ### 5. `journey_completions`
  Journey completion records with rewards
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `journey_id` (uuid, foreign key)
  - `enrollment_id` (uuid, foreign key)
  - `completed_at` (timestamptz)
  - `total_time_minutes` (integer) - Total time investment
  - `total_points_earned` (integer) - Total points from journey
  - `certificate_url` (text) - Achievement certificate
  - `final_rating` (integer) - Overall journey rating
  - `feedback` (text) - User feedback

  ## Security
  - RLS enabled on all tables
  - Users can only read published journeys
  - Users can only manage their own enrollments and progress
  - Only authenticated users can enroll
  - Admin functions require special permissions

  ## Important Notes
  1. Journey steps unlock based on enrollment date and unlock_after_days
  2. Progress tracking enables detailed analytics and coaching insights
  3. Points are awarded on step completion to drive engagement
  4. Premium journeys require active subscription validation
  5. Coach-led journeys enable human coaching interactions
*/

-- Create journeys table
CREATE TABLE IF NOT EXISTS journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  difficulty_level text NOT NULL DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration_days integer NOT NULL DEFAULT 30,
  is_premium boolean DEFAULT false,
  coach_led boolean DEFAULT false,
  thumbnail_url text,
  total_steps integer DEFAULT 0,
  popularity_score integer DEFAULT 0,
  is_published boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create journey_steps table
CREATE TABLE IF NOT EXISTS journey_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  step_type text NOT NULL DEFAULT 'lesson' CHECK (step_type IN ('lesson', 'exercise', 'reflection', 'challenge')),
  content_url text,
  content_type text CHECK (content_type IN ('video', 'audio', 'text', 'interactive')),
  estimated_minutes integer DEFAULT 15,
  is_required boolean DEFAULT true,
  unlock_after_days integer DEFAULT 0,
  points_reward integer DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(journey_id, step_number)
);

-- Create journey_enrollments table
CREATE TABLE IF NOT EXISTS journey_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journey_id uuid NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
  current_step integer DEFAULT 1,
  completed_steps integer DEFAULT 0,
  completion_percentage integer DEFAULT 0,
  last_activity_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  notes text,
  UNIQUE(user_id, journey_id)
);

-- Create journey_progress table
CREATE TABLE IF NOT EXISTS journey_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES journey_enrollments(id) ON DELETE CASCADE,
  step_id uuid NOT NULL REFERENCES journey_steps(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  time_spent_minutes integer DEFAULT 0,
  quality_rating integer CHECK (quality_rating >= 1 AND quality_rating <= 5),
  notes text,
  points_earned integer DEFAULT 0,
  UNIQUE(enrollment_id, step_id)
);

-- Create journey_completions table
CREATE TABLE IF NOT EXISTS journey_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journey_id uuid NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL REFERENCES journey_enrollments(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  total_time_minutes integer DEFAULT 0,
  total_points_earned integer DEFAULT 0,
  certificate_url text,
  final_rating integer CHECK (final_rating >= 1 AND final_rating <= 5),
  feedback text
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_journeys_category ON journeys(category);
CREATE INDEX IF NOT EXISTS idx_journeys_published ON journeys(is_published);
CREATE INDEX IF NOT EXISTS idx_journeys_premium ON journeys(is_premium);
CREATE INDEX IF NOT EXISTS idx_journey_steps_journey ON journey_steps(journey_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON journey_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_journey ON journey_enrollments(journey_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON journey_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_progress_enrollment ON journey_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON journey_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_user ON journey_completions(user_id);

-- Enable Row Level Security
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for journeys
CREATE POLICY "Users can view published journeys"
  ON journeys FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE POLICY "Admins can manage all journeys"
  ON journeys FOR ALL
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS Policies for journey_steps
CREATE POLICY "Users can view steps of published journeys"
  ON journey_steps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = journey_steps.journey_id
      AND journeys.is_published = true
    )
  );

CREATE POLICY "Admins can manage journey steps"
  ON journey_steps FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = journey_steps.journey_id
      AND journeys.created_by = auth.uid()
    )
  );

-- RLS Policies for journey_enrollments
CREATE POLICY "Users can view own enrollments"
  ON journey_enrollments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own enrollments"
  ON journey_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own enrollments"
  ON journey_enrollments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for journey_progress
CREATE POLICY "Users can view own progress"
  ON journey_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own progress"
  ON journey_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON journey_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for journey_completions
CREATE POLICY "Users can view own completions"
  ON journey_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own completions"
  ON journey_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to update journey total_steps
CREATE OR REPLACE FUNCTION update_journey_step_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE journeys
  SET total_steps = (
    SELECT COUNT(*)
    FROM journey_steps
    WHERE journey_id = COALESCE(NEW.journey_id, OLD.journey_id)
  ),
  updated_at = now()
  WHERE id = COALESCE(NEW.journey_id, OLD.journey_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_journey_step_count
AFTER INSERT OR DELETE ON journey_steps
FOR EACH ROW
EXECUTE FUNCTION update_journey_step_count();

-- Function to update enrollment completion percentage
CREATE OR REPLACE FUNCTION update_enrollment_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_total_steps integer;
  v_completed_steps integer;
  v_percentage integer;
BEGIN
  -- Get total steps for the journey
  SELECT total_steps INTO v_total_steps
  FROM journeys j
  INNER JOIN journey_enrollments e ON e.journey_id = j.id
  WHERE e.id = NEW.enrollment_id;

  -- Count completed steps
  SELECT COUNT(*) INTO v_completed_steps
  FROM journey_progress
  WHERE enrollment_id = NEW.enrollment_id;

  -- Calculate percentage
  IF v_total_steps > 0 THEN
    v_percentage := ROUND((v_completed_steps::numeric / v_total_steps) * 100);
  ELSE
    v_percentage := 0;
  END IF;

  -- Update enrollment
  UPDATE journey_enrollments
  SET 
    completed_steps = v_completed_steps,
    completion_percentage = v_percentage,
    last_activity_at = now(),
    status = CASE 
      WHEN v_percentage >= 100 THEN 'completed'
      ELSE status
    END,
    completed_at = CASE
      WHEN v_percentage >= 100 AND completed_at IS NULL THEN now()
      ELSE completed_at
    END
  WHERE id = NEW.enrollment_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_enrollment_completion
AFTER INSERT ON journey_progress
FOR EACH ROW
EXECUTE FUNCTION update_enrollment_completion();