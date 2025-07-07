-- Create function to automatically generate daily plans for habits
CREATE OR REPLACE FUNCTION public.generate_daily_habit_plans(
  target_user_id UUID,
  start_date DATE DEFAULT CURRENT_DATE,
  days_ahead INTEGER DEFAULT 7
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Create function to automatically generate daily plans for activities
CREATE OR REPLACE FUNCTION public.generate_daily_activity_plans(
  target_user_id UUID,
  start_date DATE DEFAULT CURRENT_DATE,
  days_ahead INTEGER DEFAULT 7
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Create function to automatically generate daily plans for goals
CREATE OR REPLACE FUNCTION public.generate_daily_goal_plans(
  target_user_id UUID,
  start_date DATE DEFAULT CURRENT_DATE,
  days_ahead INTEGER DEFAULT 7
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Create master function to generate all automatic daily plans
CREATE OR REPLACE FUNCTION public.generate_all_daily_plans(
  target_user_id UUID,
  start_date DATE DEFAULT CURRENT_DATE,
  days_ahead INTEGER DEFAULT 7
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  habits_created INTEGER;
  activities_created INTEGER;
  goals_created INTEGER;
  workouts_created INTEGER;
  total_created INTEGER;
BEGIN
  -- Generate plans for each type
  SELECT generate_daily_habit_plans(target_user_id, start_date, days_ahead) INTO habits_created;
  SELECT generate_daily_activity_plans(target_user_id, start_date, days_ahead) INTO activities_created;
  SELECT generate_daily_goal_plans(target_user_id, start_date, days_ahead) INTO goals_created;
  SELECT generate_routine_workout_plans(target_user_id, start_date, days_ahead) INTO workouts_created;
  
  total_created := habits_created + activities_created + goals_created + workouts_created;
  
  RETURN jsonb_build_object(
    'total_created', total_created,
    'habits_created', habits_created,
    'activities_created', activities_created,
    'goals_created', goals_created,
    'workouts_created', workouts_created
  );
END;
$$;