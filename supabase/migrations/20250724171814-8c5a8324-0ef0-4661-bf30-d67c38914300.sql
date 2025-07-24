-- Create tables for achievements and user progress tracking
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  progress INTEGER DEFAULT 0,
  max_progress INTEGER DEFAULT 100,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own achievements" 
ON public.user_achievements 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own achievements" 
ON public.user_achievements 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements" 
ON public.user_achievements 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create user progress table
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  level INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  focus_score NUMERIC DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own progress" 
ON public.user_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress" 
ON public.user_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.user_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create behavior insights table
CREATE TABLE public.behavior_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence NUMERIC DEFAULT 0.0,
  priority TEXT DEFAULT 'medium',
  actionable BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'pattern',
  data_points JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days')
);

-- Enable RLS
ALTER TABLE public.behavior_insights ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own insights" 
ON public.behavior_insights 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own insights" 
ON public.behavior_insights 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create mood entries table
CREATE TABLE public.mood_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 10),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  sleep_hours NUMERIC,
  notes TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own mood entries" 
ON public.mood_entries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mood entries" 
ON public.mood_entries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mood entries" 
ON public.mood_entries 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_progress_updated_at
BEFORE UPDATE ON public.user_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate real insights
CREATE OR REPLACE FUNCTION public.generate_behavior_insights(target_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  insight_count INTEGER := 0;
  completion_rate NUMERIC;
  habit_streak INTEGER;
  productivity_pattern TEXT;
BEGIN
  -- Clear old insights
  DELETE FROM public.behavior_insights 
  WHERE user_id = target_user_id 
  AND created_at < now() - interval '7 days';
  
  -- Calculate completion rate for last 7 days
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND((COUNT(*) FILTER (WHERE completed = true)::NUMERIC / COUNT(*)) * 100, 1)
    END
  INTO completion_rate
  FROM public.daily_plans
  WHERE user_id = target_user_id 
  AND plan_date >= CURRENT_DATE - interval '7 days';
  
  -- Generate completion rate insight
  IF completion_rate IS NOT NULL THEN
    INSERT INTO public.behavior_insights (
      user_id, insight_type, title, description, confidence, priority, actionable, category
    ) VALUES (
      target_user_id,
      CASE 
        WHEN completion_rate >= 80 THEN 'celebration'
        WHEN completion_rate >= 60 THEN 'pattern'
        ELSE 'recommendation'
      END,
      CASE 
        WHEN completion_rate >= 80 THEN 'Excellent Progress!'
        WHEN completion_rate >= 60 THEN 'Good Consistency'
        ELSE 'Room for Improvement'
      END,
      'Your task completion rate is ' || completion_rate || '% this week.',
      GREATEST(0.7, completion_rate / 100),
      CASE WHEN completion_rate < 60 THEN 'high' ELSE 'medium' END,
      completion_rate < 80,
      CASE 
        WHEN completion_rate >= 80 THEN 'achievement'
        ELSE 'productivity'
      END
    );
    insight_count := insight_count + 1;
  END IF;
  
  -- Calculate current habit streak
  SELECT COUNT(DISTINCT completion_date)
  INTO habit_streak
  FROM public.habit_completions hc
  JOIN public.habits h ON h.id = hc.habit_id
  WHERE hc.user_id = target_user_id 
  AND h.is_active = true
  AND hc.completion_date >= CURRENT_DATE - interval '30 days';
  
  -- Generate habit insight
  IF habit_streak > 0 THEN
    INSERT INTO public.behavior_insights (
      user_id, insight_type, title, description, confidence, priority, actionable, category
    ) VALUES (
      target_user_id,
      CASE WHEN habit_streak >= 7 THEN 'celebration' ELSE 'pattern' END,
      CASE WHEN habit_streak >= 7 THEN 'Habit Mastery!' ELSE 'Building Momentum' END,
      'You have completed habits for ' || habit_streak || ' days this month.',
      0.9,
      'medium',
      habit_streak < 7,
      'habits'
    );
    insight_count := insight_count + 1;
  END IF;
  
  RETURN insight_count;
END;
$function$;

-- Create function to update user progress
CREATE OR REPLACE FUNCTION public.update_user_progress(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  total_completed INTEGER;
  current_streak_val INTEGER;
  total_xp_val INTEGER;
  user_level INTEGER;
BEGIN
  -- Calculate total completed tasks
  SELECT COUNT(*) INTO total_completed
  FROM public.daily_plans
  WHERE user_id = target_user_id AND completed = true;
  
  -- Calculate current streak
  WITH daily_completions AS (
    SELECT plan_date, COUNT(*) as completed_count
    FROM public.daily_plans
    WHERE user_id = target_user_id AND completed = true
    GROUP BY plan_date
    ORDER BY plan_date DESC
  ),
  streak_calc AS (
    SELECT plan_date,
           ROW_NUMBER() OVER (ORDER BY plan_date DESC) as rn,
           plan_date + (ROW_NUMBER() OVER (ORDER BY plan_date DESC) - 1) as expected_date
    FROM daily_completions
  )
  SELECT COUNT(*) INTO current_streak_val
  FROM streak_calc
  WHERE plan_date = expected_date;
  
  -- Calculate XP (10 XP per completed task)
  total_xp_val := total_completed * 10;
  
  -- Calculate level (100 XP per level)
  user_level := GREATEST(1, total_xp_val / 100);
  
  -- Upsert user progress
  INSERT INTO public.user_progress (user_id, level, total_xp, current_streak)
  VALUES (target_user_id, user_level, total_xp_val, current_streak_val)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    level = EXCLUDED.level,
    total_xp = EXCLUDED.total_xp,
    current_streak = EXCLUDED.current_streak,
    longest_streak = GREATEST(user_progress.longest_streak, EXCLUDED.current_streak),
    updated_at = now();
END;
$function$;