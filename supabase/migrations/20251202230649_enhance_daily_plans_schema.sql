/*
  # Enhance Daily Plans Schema
  
  1. Changes
    - Add title, description, order_index, priority, estimated_duration_minutes to daily_plans table
    - These fields allow for richer daily plan items with custom content
    
  2. Notes
    - title and description can be used for custom plan items or to cache item details
    - order_index allows manual reordering of plan items
    - priority helps prioritize tasks
    - estimated_duration_minutes helps with time management
*/

-- Add new columns to daily_plans table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'daily_plans' AND column_name = 'title'
  ) THEN
    ALTER TABLE daily_plans ADD COLUMN title text;
    ALTER TABLE daily_plans ADD COLUMN description text;
    ALTER TABLE daily_plans ADD COLUMN order_index integer DEFAULT 0;
    ALTER TABLE daily_plans ADD COLUMN priority text CHECK (priority IN ('low', 'medium', 'high'));
    ALTER TABLE daily_plans ADD COLUMN estimated_duration_minutes integer;
    ALTER TABLE daily_plans ADD COLUMN actual_duration_minutes integer;
  END IF;
END $$;

-- Create function to auto-populate title from source items
CREATE OR REPLACE FUNCTION populate_daily_plan_title()
RETURNS TRIGGER AS $$
DECLARE
  source_title text;
  source_description text;
BEGIN
  -- If title is already provided, don't override it
  IF NEW.title IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Fetch title and description from the source item
  CASE NEW.item_type
    WHEN 'habit' THEN
      SELECT name, description INTO source_title, source_description
      FROM habits WHERE id = NEW.item_id;
      
    WHEN 'task' THEN
      SELECT title, description INTO source_title, source_description
      FROM tasks WHERE id = NEW.item_id;
      
    WHEN 'activity' THEN
      SELECT name, description INTO source_title, source_description
      FROM activities WHERE id = NEW.item_id;
      
    WHEN 'workout' THEN
      SELECT name, description INTO source_title, source_description
      FROM workouts WHERE id = NEW.item_id;
      
    WHEN 'routine' THEN
      SELECT name, description INTO source_title, source_description
      FROM routines WHERE id = NEW.item_id;
      
    WHEN 'goal' THEN
      SELECT title, description INTO source_title, source_description
      FROM goals WHERE id = NEW.item_id;
  END CASE;

  -- Set the title and description
  NEW.title = COALESCE(source_title, 'Untitled');
  NEW.description = source_description;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-populate title
DROP TRIGGER IF EXISTS trigger_populate_daily_plan_title ON daily_plans;
CREATE TRIGGER trigger_populate_daily_plan_title
  BEFORE INSERT ON daily_plans
  FOR EACH ROW
  EXECUTE FUNCTION populate_daily_plan_title();

-- Create index for better sorting performance
CREATE INDEX IF NOT EXISTS idx_daily_plans_order ON daily_plans(user_id, plan_date, order_index);