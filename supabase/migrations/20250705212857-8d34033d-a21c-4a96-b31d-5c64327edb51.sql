
-- Phase 1: Add foreign key constraints and clean up orphaned entries

-- First, let's clean up existing orphaned daily plan entries
DELETE FROM public.daily_plans 
WHERE item_id IS NOT NULL 
AND item_type = 'task' 
AND NOT EXISTS (
  SELECT 1 FROM public.tasks WHERE tasks.id = daily_plans.item_id
);

DELETE FROM public.daily_plans 
WHERE item_id IS NOT NULL 
AND item_type = 'habit' 
AND NOT EXISTS (
  SELECT 1 FROM public.habits WHERE habits.id = daily_plans.item_id
);

DELETE FROM public.daily_plans 
WHERE item_id IS NOT NULL 
AND item_type = 'activity' 
AND NOT EXISTS (
  SELECT 1 FROM public.activities WHERE activities.id = daily_plans.item_id
);

DELETE FROM public.daily_plans 
WHERE item_id IS NOT NULL 
AND item_type = 'workout' 
AND NOT EXISTS (
  SELECT 1 FROM public.workouts WHERE workouts.id = daily_plans.item_id
);

-- Add foreign key constraints with CASCADE DELETE
-- Note: We can't add direct foreign keys since item_id references different tables
-- Instead, we'll create triggers to handle cascading deletes

-- Trigger function to clean up daily plans when tasks are deleted
CREATE OR REPLACE FUNCTION public.cleanup_daily_plans_on_task_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.daily_plans 
  WHERE item_type = 'task' AND item_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to clean up daily plans when habits are deleted
CREATE OR REPLACE FUNCTION public.cleanup_daily_plans_on_habit_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.daily_plans 
  WHERE item_type = 'habit' AND item_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to clean up daily plans when activities are deleted
CREATE OR REPLACE FUNCTION public.cleanup_daily_plans_on_activity_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.daily_plans 
  WHERE item_type = 'activity' AND item_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to clean up daily plans when workouts are deleted
CREATE OR REPLACE FUNCTION public.cleanup_daily_plans_on_workout_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.daily_plans 
  WHERE item_type = 'workout' AND item_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the triggers
CREATE TRIGGER trigger_cleanup_daily_plans_on_task_delete
  AFTER DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_daily_plans_on_task_delete();

CREATE TRIGGER trigger_cleanup_daily_plans_on_habit_delete
  AFTER DELETE ON public.habits
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_daily_plans_on_habit_delete();

CREATE TRIGGER trigger_cleanup_daily_plans_on_activity_delete
  AFTER DELETE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_daily_plans_on_activity_delete();

CREATE TRIGGER trigger_cleanup_daily_plans_on_workout_delete
  AFTER DELETE ON public.workouts
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_daily_plans_on_workout_delete();
