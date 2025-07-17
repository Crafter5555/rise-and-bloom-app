-- Fix security warnings by setting search_path for all functions
-- This prevents search_path injection attacks

-- Update generate_daily_habit_plans function
CREATE OR REPLACE FUNCTION public.generate_daily_habit_plans(target_user_id uuid, start_date date DEFAULT CURRENT_DATE, days_ahead integer DEFAULT 7)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  habit_record RECORD;
  target_date DATE;
  plans_created INTEGER := 0;
  habit_frequency TEXT;
  should_schedule BOOLEAN;
BEGIN
  -- Loop through active habits for the user
  FOR habit_record IN 
    SELECT * FROM public.habits 
    WHERE user_id = target_user_id AND is_active = true
  LOOP
    -- For each day in the range
    FOR i IN 0..days_ahead-1 LOOP
      target_date := start_date + i;
      should_schedule := false;
      
      -- Determine if habit should be scheduled based on frequency
      CASE habit_record.frequency
        WHEN 'daily' THEN
          should_schedule := true;
        WHEN 'weekly' THEN
          -- Schedule on same day of week as habit was created
          should_schedule := EXTRACT(DOW FROM target_date) = EXTRACT(DOW FROM habit_record.created_at);
        WHEN 'monthly' THEN
          -- Schedule on same day of month as habit was created
          should_schedule := EXTRACT(DAY FROM target_date) = EXTRACT(DAY FROM habit_record.created_at);
        ELSE
          -- Default to daily for unknown frequencies
          should_schedule := true;
      END CASE;
      
      -- Create daily plan if needed and doesn't already exist
      IF should_schedule AND NOT EXISTS (
        SELECT 1 FROM public.daily_plans
        WHERE user_id = target_user_id
        AND item_type = 'habit'
        AND item_id = habit_record.id
        AND plan_date = target_date
      ) THEN
        INSERT INTO public.daily_plans (
          user_id,
          plan_date,
          item_type,
          item_id,
          title,
          description,
          estimated_duration_minutes
        ) VALUES (
          target_user_id,
          target_date,
          'habit',
          habit_record.id,
          habit_record.name,
          habit_record.description,
          30 -- Default 30 minutes for habits
        );
        
        plans_created := plans_created + 1;
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN plans_created;
END;
$function$;

-- Update generate_daily_activity_plans function
CREATE OR REPLACE FUNCTION public.generate_daily_activity_plans(target_user_id uuid, start_date date DEFAULT CURRENT_DATE, days_ahead integer DEFAULT 7)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  activity_record RECORD;
  target_date DATE;
  plans_created INTEGER := 0;
BEGIN
  -- Loop through favorite activities for the user (auto-schedule favorites)
  FOR activity_record IN 
    SELECT * FROM public.activities 
    WHERE user_id = target_user_id AND is_favorite = true
  LOOP
    -- For each day in the range (schedule favorites daily)
    FOR i IN 0..days_ahead-1 LOOP
      target_date := start_date + i;
      
      -- Create daily plan if doesn't already exist
      IF NOT EXISTS (
        SELECT 1 FROM public.daily_plans
        WHERE user_id = target_user_id
        AND item_type = 'activity'
        AND item_id = activity_record.id
        AND plan_date = target_date
      ) THEN
        INSERT INTO public.daily_plans (
          user_id,
          plan_date,
          item_type,
          item_id,
          title,
          description,
          estimated_duration_minutes
        ) VALUES (
          target_user_id,
          target_date,
          'activity',
          activity_record.id,
          activity_record.name,
          activity_record.description,
          activity_record.duration_minutes
        );
        
        plans_created := plans_created + 1;
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN plans_created;
END;
$function$;

-- Update generate_daily_goal_plans function
CREATE OR REPLACE FUNCTION public.generate_daily_goal_plans(target_user_id uuid, start_date date DEFAULT CURRENT_DATE, days_ahead integer DEFAULT 7)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  goal_record RECORD;
  target_date DATE;
  plans_created INTEGER := 0;
BEGIN
  -- Loop through active goals for the user
  FOR goal_record IN 
    SELECT * FROM public.goals 
    WHERE user_id = target_user_id AND status = 'active'
  LOOP
    -- For each day in the range
    FOR i IN 0..days_ahead-1 LOOP
      target_date := start_date + i;
      
      -- Only schedule if goal has target_date and we're within the goal period
      IF goal_record.target_date IS NOT NULL 
         AND target_date <= goal_record.target_date::DATE 
         AND NOT EXISTS (
           SELECT 1 FROM public.daily_plans
           WHERE user_id = target_user_id
           AND item_type = 'goal'
           AND item_id = goal_record.id
           AND plan_date = target_date
         ) THEN
        
        INSERT INTO public.daily_plans (
          user_id,
          plan_date,
          item_type,
          item_id,
          title,
          description,
          estimated_duration_minutes
        ) VALUES (
          target_user_id,
          target_date,
          'goal',
          goal_record.id,
          'Work on: ' || goal_record.title,
          goal_record.description,
          45 -- Default 45 minutes for goal work
        );
        
        plans_created := plans_created + 1;
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN plans_created;
END;
$function$;

-- Update generate_all_daily_plans function
CREATE OR REPLACE FUNCTION public.generate_all_daily_plans(target_user_id uuid, start_date date DEFAULT CURRENT_DATE, days_ahead integer DEFAULT 7)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  habits_created INTEGER;
  activities_created INTEGER;
  goals_created INTEGER;
  workouts_created INTEGER;
  total_created INTEGER;
BEGIN
  -- Generate plans for each type
  SELECT public.generate_daily_habit_plans(target_user_id, start_date, days_ahead) INTO habits_created;
  SELECT public.generate_daily_activity_plans(target_user_id, start_date, days_ahead) INTO activities_created;
  SELECT public.generate_daily_goal_plans(target_user_id, start_date, days_ahead) INTO goals_created;
  SELECT public.generate_routine_workout_plans(target_user_id, start_date, days_ahead) INTO workouts_created;
  
  total_created := habits_created + activities_created + goals_created + workouts_created;
  
  RETURN jsonb_build_object(
    'total_created', total_created,
    'habits_created', habits_created,
    'activities_created', activities_created,
    'goals_created', goals_created,
    'workouts_created', workouts_created
  );
END;
$function$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'username',
    NEW.raw_user_meta_data ->> 'display_name'
  );
  RETURN NEW;
END;
$function$;

-- Update generate_routine_workout_plans function
CREATE OR REPLACE FUNCTION public.generate_routine_workout_plans(target_user_id uuid, start_date date DEFAULT CURRENT_DATE, days_ahead integer DEFAULT 7)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  routine_record RECORD;
  schedule_record RECORD;
  target_date DATE;
  plans_created INTEGER := 0;
BEGIN
  -- Loop through active routines for the user
  FOR routine_record IN 
    SELECT * FROM public.workout_routines 
    WHERE user_id = target_user_id AND is_active = true
  LOOP
    -- For each day in the range
    FOR i IN 0..days_ahead-1 LOOP
      target_date := start_date + i;
      
      -- Check if this day matches any scheduled workouts
      FOR schedule_record IN
        SELECT rs.*, w.name as workout_name
        FROM public.routine_schedules rs
        JOIN public.workouts w ON w.id = rs.workout_id
        WHERE rs.routine_id = routine_record.id
        AND EXTRACT(DOW FROM target_date) = rs.day_of_week
      LOOP
        -- Check if plan already exists for this date/workout
        IF NOT EXISTS (
          SELECT 1 FROM public.workout_plans
          WHERE user_id = target_user_id
          AND workout_id = schedule_record.workout_id
          AND scheduled_date = target_date
        ) THEN
          -- Create the workout plan
          INSERT INTO public.workout_plans (
            user_id,
            workout_id,
            routine_id,
            scheduled_date,
            notes
          ) VALUES (
            target_user_id,
            schedule_record.workout_id,
            routine_record.id,
            target_date,
            'Auto-generated from routine: ' || routine_record.name
          );
          
          plans_created := plans_created + 1;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
  
  RETURN plans_created;
END;
$function$;

-- Update cleanup functions
CREATE OR REPLACE FUNCTION public.cleanup_daily_plans_on_task_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  DELETE FROM public.daily_plans 
  WHERE item_type = 'task' AND item_id = OLD.id;
  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_daily_plans_on_habit_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  DELETE FROM public.daily_plans 
  WHERE item_type = 'habit' AND item_id = OLD.id;
  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_daily_plans_on_activity_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  DELETE FROM public.daily_plans 
  WHERE item_type = 'activity' AND item_id = OLD.id;
  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_daily_plans_on_workout_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  DELETE FROM public.daily_plans 
  WHERE item_type = 'workout' AND item_id = OLD.id;
  RETURN OLD;
END;
$function$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;