/*
  # Enhanced Analytics and Insights System

  This migration creates a comprehensive analytics system that tracks user behavior,
  generates insights, and provides predictive analytics based on real data.

  ## New Tables

  1. `analytics_cache` - Stores pre-computed analytics for performance
     - `user_id` (uuid, foreign key)
     - `metric_type` (text) - Type of metric (completion_rate, productivity_score, etc.)
     - `metric_value` (numeric) - Calculated value
     - `time_period` (text) - daily, weekly, monthly
     - `calculated_at` (timestamptz) - When the metric was calculated
     - `metadata` (jsonb) - Additional metric data

  2. `behavioral_patterns` - Detected user behavior patterns
     - `user_id` (uuid, foreign key)
     - `pattern_type` (text) - Type of pattern detected
     - `pattern_data` (jsonb) - Pattern details
     - `confidence_score` (numeric) - How confident we are in this pattern
     - `occurrences` (integer) - How many times observed
     - `first_detected` (timestamptz) - When first detected
     - `last_seen` (timestamptz) - Most recent occurrence

  3. `prediction_models` - Store prediction results
     - `user_id` (uuid, foreign key)
     - `prediction_type` (text) - What we're predicting
     - `prediction_value` (numeric) - Predicted value
     - `probability` (numeric) - Confidence in prediction
     - `factors` (jsonb) - Contributing factors
     - `target_date` (date) - When this prediction applies
     - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all new tables
  - Create policies for user-specific data access
  - Add indexes for query performance

  ## Functions
  - `calculate_productivity_patterns()` - Analyzes when user is most productive
  - `generate_predictive_insights()` - Creates predictions based on historical data
  - `calculate_correlation_scores()` - Finds correlations between behaviors
  - `update_analytics_cache()` - Refreshes cached analytics
  - Enhanced `generate_behavior_insights()` - More comprehensive insight generation
*/

-- Analytics Cache Table
CREATE TABLE IF NOT EXISTS public.analytics_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  time_period TEXT NOT NULL DEFAULT 'daily',
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, metric_type, time_period, DATE(calculated_at))
);

-- Behavioral Patterns Table
CREATE TABLE IF NOT EXISTS public.behavioral_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pattern_type TEXT NOT NULL,
  pattern_data JSONB NOT NULL DEFAULT '{}',
  confidence_score NUMERIC NOT NULL DEFAULT 0.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  occurrences INTEGER NOT NULL DEFAULT 1,
  first_detected TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Prediction Models Table
CREATE TABLE IF NOT EXISTS public.prediction_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prediction_type TEXT NOT NULL,
  prediction_value NUMERIC NOT NULL,
  probability NUMERIC NOT NULL CHECK (probability >= 0 AND probability <= 1),
  factors JSONB DEFAULT '{}',
  target_date DATE NOT NULL,
  is_realized BOOLEAN,
  actual_value NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_models ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics_cache
CREATE POLICY "Users can view their own analytics cache"
ON public.analytics_cache FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics cache"
ON public.analytics_cache FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics cache"
ON public.analytics_cache FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for behavioral_patterns
CREATE POLICY "Users can view their own behavioral patterns"
ON public.behavioral_patterns FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own behavioral patterns"
ON public.behavioral_patterns FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own behavioral patterns"
ON public.behavioral_patterns FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for prediction_models
CREATE POLICY "Users can view their own predictions"
ON public.prediction_models FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own predictions"
ON public.prediction_models FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions"
ON public.prediction_models FOR UPDATE
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_analytics_cache_user_type ON public.analytics_cache(user_id, metric_type, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_behavioral_patterns_user_type ON public.behavioral_patterns(user_id, pattern_type, last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_prediction_models_user_date ON public.prediction_models(user_id, target_date DESC);

-- Function to calculate productivity patterns
CREATE OR REPLACE FUNCTION public.calculate_productivity_patterns(target_user_id UUID)
RETURNS TABLE(
  hour_of_day INTEGER,
  day_of_week INTEGER,
  completion_rate NUMERIC,
  avg_tasks_completed NUMERIC,
  pattern_strength NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  WITH hourly_completions AS (
    SELECT
      EXTRACT(HOUR FROM completed_at)::INTEGER as hour,
      EXTRACT(DOW FROM completed_at)::INTEGER as dow,
      COUNT(*) FILTER (WHERE completed = true) as completed_count,
      COUNT(*) as total_count
    FROM public.daily_plans
    WHERE user_id = target_user_id
      AND completed_at IS NOT NULL
      AND completed_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY hour, dow
  )
  SELECT
    hour,
    dow,
    ROUND((completed_count::NUMERIC / NULLIF(total_count, 0)) * 100, 1) as completion_rate,
    ROUND(completed_count::NUMERIC / 4.0, 1) as avg_completed, -- Average over ~4 weeks
    CASE
      WHEN total_count >= 8 THEN ROUND((completed_count::NUMERIC / NULLIF(total_count, 0)), 2)
      ELSE 0.0
    END as pattern_strength
  FROM hourly_completions
  WHERE total_count >= 3 -- Minimum occurrences for meaningful pattern
  ORDER BY completion_rate DESC;
END;
$$;

-- Function to generate predictive insights
CREATE OR REPLACE FUNCTION public.generate_predictive_insights(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  insight_count INTEGER := 0;
  avg_completion_rate NUMERIC;
  recent_trend TEXT;
  habit_consistency NUMERIC;
  mood_trend NUMERIC;
BEGIN
  -- Clear old predictions
  DELETE FROM public.prediction_models
  WHERE user_id = target_user_id
    AND target_date < CURRENT_DATE;

  -- Calculate recent completion rate trend
  WITH weekly_rates AS (
    SELECT
      DATE_TRUNC('week', plan_date) as week,
      ROUND((COUNT(*) FILTER (WHERE completed = true)::NUMERIC / COUNT(*)) * 100, 1) as rate
    FROM public.daily_plans
    WHERE user_id = target_user_id
      AND plan_date >= CURRENT_DATE - INTERVAL '4 weeks'
    GROUP BY week
    ORDER BY week DESC
    LIMIT 2
  )
  SELECT
    CASE
      WHEN COUNT(*) = 2 THEN
        CASE
          WHEN MAX(rate) - MIN(rate) > 10 THEN 'improving'
          WHEN MIN(rate) - MAX(rate) > 10 THEN 'declining'
          ELSE 'stable'
        END
      ELSE 'insufficient_data'
    END
  INTO recent_trend
  FROM weekly_rates;

  -- Calculate average completion rate
  SELECT
    ROUND((COUNT(*) FILTER (WHERE completed = true)::NUMERIC / COUNT(*)) * 100, 1)
  INTO avg_completion_rate
  FROM public.daily_plans
  WHERE user_id = target_user_id
    AND plan_date >= CURRENT_DATE - INTERVAL '7 days';

  -- Predict tomorrow's completion rate
  INSERT INTO public.prediction_models (
    user_id, prediction_type, prediction_value, probability, factors, target_date
  )
  VALUES (
    target_user_id,
    'daily_completion_rate',
    COALESCE(avg_completion_rate, 50),
    CASE
      WHEN recent_trend = 'improving' THEN 0.75
      WHEN recent_trend = 'stable' THEN 0.85
      WHEN recent_trend = 'declining' THEN 0.65
      ELSE 0.50
    END,
    jsonb_build_object(
      'recent_trend', recent_trend,
      'historical_avg', avg_completion_rate,
      'data_points', (SELECT COUNT(*) FROM public.daily_plans WHERE user_id = target_user_id AND plan_date >= CURRENT_DATE - INTERVAL '7 days')
    ),
    CURRENT_DATE + INTERVAL '1 day'
  )
  ON CONFLICT DO NOTHING;

  insight_count := insight_count + 1;

  -- Calculate habit consistency
  WITH habit_streak AS (
    SELECT COUNT(DISTINCT completion_date) as consistent_days
    FROM public.habit_completions
    WHERE user_id = target_user_id
      AND completion_date >= CURRENT_DATE - INTERVAL '7 days'
  )
  SELECT consistent_days INTO habit_consistency FROM habit_streak;

  -- Predict habit completion for tomorrow
  IF habit_consistency IS NOT NULL AND habit_consistency > 0 THEN
    INSERT INTO public.prediction_models (
      user_id, prediction_type, prediction_value, probability, factors, target_date
    )
    VALUES (
      target_user_id,
      'habit_completion',
      LEAST(habit_consistency + 1, 7),
      ROUND(habit_consistency / 7.0, 2),
      jsonb_build_object(
        'current_streak', habit_consistency,
        'consistency_score', ROUND(habit_consistency / 7.0, 2)
      ),
      CURRENT_DATE + INTERVAL '1 day'
    )
    ON CONFLICT DO NOTHING;

    insight_count := insight_count + 1;
  END IF;

  -- Analyze mood trend
  WITH recent_moods AS (
    SELECT AVG(mood_score) as avg_mood
    FROM public.mood_entries
    WHERE user_id = target_user_id
      AND entry_date >= CURRENT_DATE - INTERVAL '3 days'
  )
  SELECT avg_mood INTO mood_trend FROM recent_moods;

  -- Predict energy dip if mood is declining
  IF mood_trend IS NOT NULL AND mood_trend < 6 THEN
    INSERT INTO public.prediction_models (
      user_id, prediction_type, prediction_value, probability, factors, target_date
    )
    VALUES (
      target_user_id,
      'energy_dip_risk',
      mood_trend,
      ROUND((10 - mood_trend) / 10.0, 2),
      jsonb_build_object(
        'recent_mood_avg', mood_trend,
        'risk_level', CASE
          WHEN mood_trend < 5 THEN 'high'
          WHEN mood_trend < 7 THEN 'medium'
          ELSE 'low'
        END
      ),
      CURRENT_DATE + INTERVAL '1 day'
    )
    ON CONFLICT DO NOTHING;

    insight_count := insight_count + 1;
  END IF;

  RETURN insight_count;
END;
$$;

-- Enhanced function to calculate correlation scores
CREATE OR REPLACE FUNCTION public.calculate_correlation_scores(target_user_id UUID)
RETURNS TABLE(
  factor_a TEXT,
  factor_b TEXT,
  correlation_coefficient NUMERIC,
  significance TEXT,
  sample_size INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  -- Sleep vs Productivity Correlation
  WITH daily_metrics AS (
    SELECT
      m.entry_date,
      m.mood_score,
      m.sleep_hours,
      m.energy_level,
      COALESCE(
        (SELECT COUNT(*) FILTER (WHERE dp.completed = true)::NUMERIC / NULLIF(COUNT(*), 0)
         FROM public.daily_plans dp
         WHERE dp.user_id = target_user_id
           AND dp.plan_date = m.entry_date),
        0
      ) * 100 as productivity_rate
    FROM public.mood_entries m
    WHERE m.user_id = target_user_id
      AND m.entry_date >= CURRENT_DATE - INTERVAL '30 days'
      AND m.sleep_hours IS NOT NULL
  ),
  correlations AS (
    SELECT
      'Sleep Hours' as factor_a,
      'Productivity Rate' as factor_b,
      ROUND(
        CORR(sleep_hours, productivity_rate)::NUMERIC,
        2
      ) as corr_value,
      COUNT(*) as n
    FROM daily_metrics
    WHERE sleep_hours IS NOT NULL AND productivity_rate > 0

    UNION ALL

    SELECT
      'Mood Score' as factor_a,
      'Productivity Rate' as factor_b,
      ROUND(
        CORR(mood_score, productivity_rate)::NUMERIC,
        2
      ) as corr_value,
      COUNT(*) as n
    FROM daily_metrics
    WHERE mood_score IS NOT NULL AND productivity_rate > 0

    UNION ALL

    SELECT
      'Energy Level' as factor_a,
      'Productivity Rate' as factor_b,
      ROUND(
        CORR(energy_level, productivity_rate)::NUMERIC,
        2
      ) as corr_value,
      COUNT(*) as n
    FROM daily_metrics
    WHERE energy_level IS NOT NULL AND productivity_rate > 0
  )
  SELECT
    factor_a,
    factor_b,
    COALESCE(corr_value, 0) as correlation_coefficient,
    CASE
      WHEN ABS(COALESCE(corr_value, 0)) >= 0.7 THEN 'strong'
      WHEN ABS(COALESCE(corr_value, 0)) >= 0.4 THEN 'moderate'
      WHEN ABS(COALESCE(corr_value, 0)) >= 0.2 THEN 'weak'
      ELSE 'negligible'
    END as significance,
    n as sample_size
  FROM correlations
  WHERE n >= 5; -- Minimum sample size for meaningful correlation
END;
$$;

-- Function to update analytics cache
CREATE OR REPLACE FUNCTION public.update_analytics_cache(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  metrics_updated INTEGER := 0;
BEGIN
  -- Daily completion rate
  INSERT INTO public.analytics_cache (user_id, metric_type, metric_value, time_period, metadata)
  SELECT
    target_user_id,
    'completion_rate',
    ROUND((COUNT(*) FILTER (WHERE completed = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 1),
    'daily',
    jsonb_build_object(
      'total_tasks', COUNT(*),
      'completed_tasks', COUNT(*) FILTER (WHERE completed = true)
    )
  FROM public.daily_plans
  WHERE user_id = target_user_id
    AND plan_date = CURRENT_DATE
  HAVING COUNT(*) > 0
  ON CONFLICT (user_id, metric_type, time_period, DATE(calculated_at))
  DO UPDATE SET
    metric_value = EXCLUDED.metric_value,
    metadata = EXCLUDED.metadata,
    calculated_at = now();

  metrics_updated := metrics_updated + 1;

  -- Weekly completion rate
  INSERT INTO public.analytics_cache (user_id, metric_type, metric_value, time_period, metadata)
  SELECT
    target_user_id,
    'completion_rate',
    ROUND((COUNT(*) FILTER (WHERE completed = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 1),
    'weekly',
    jsonb_build_object(
      'total_tasks', COUNT(*),
      'completed_tasks', COUNT(*) FILTER (WHERE completed = true)
    )
  FROM public.daily_plans
  WHERE user_id = target_user_id
    AND plan_date >= DATE_TRUNC('week', CURRENT_DATE)
  HAVING COUNT(*) > 0
  ON CONFLICT (user_id, metric_type, time_period, DATE(calculated_at))
  DO UPDATE SET
    metric_value = EXCLUDED.metric_value,
    metadata = EXCLUDED.metadata,
    calculated_at = now();

  metrics_updated := metrics_updated + 1;

  -- Focus score (based on completion patterns)
  INSERT INTO public.analytics_cache (user_id, metric_type, metric_value, time_period, metadata)
  SELECT
    target_user_id,
    'focus_score',
    ROUND(
      LEAST(10,
        (COUNT(*) FILTER (WHERE completed = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 10 +
        (COUNT(DISTINCT plan_date)::NUMERIC / 7.0) * 2
      ),
      1
    ),
    'weekly',
    jsonb_build_object(
      'consistency_bonus', ROUND(COUNT(DISTINCT plan_date)::NUMERIC / 7.0, 2),
      'completion_factor', ROUND((COUNT(*) FILTER (WHERE completed = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 10, 1)
    )
  FROM public.daily_plans
  WHERE user_id = target_user_id
    AND plan_date >= CURRENT_DATE - INTERVAL '7 days'
  HAVING COUNT(*) > 0
  ON CONFLICT (user_id, metric_type, time_period, DATE(calculated_at))
  DO UPDATE SET
    metric_value = EXCLUDED.metric_value,
    metadata = EXCLUDED.metadata,
    calculated_at = now();

  metrics_updated := metrics_updated + 1;

  RETURN metrics_updated;
END;
$$;

-- Enhanced generate_behavior_insights function
CREATE OR REPLACE FUNCTION public.generate_behavior_insights(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  insight_count INTEGER := 0;
  completion_rate NUMERIC;
  habit_streak INTEGER;
  productivity_pattern RECORD;
  mood_correlation NUMERIC;
  screen_time_avg NUMERIC;
BEGIN
  -- Clear old insights (older than 7 days)
  DELETE FROM public.behavior_insights
  WHERE user_id = target_user_id
    AND created_at < now() - INTERVAL '7 days';

  -- Update analytics cache first
  PERFORM public.update_analytics_cache(target_user_id);

  -- Calculate completion rate for last 7 days
  SELECT
    CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND((COUNT(*) FILTER (WHERE completed = true)::NUMERIC / COUNT(*)) * 100, 1)
    END
  INTO completion_rate
  FROM public.daily_plans
  WHERE user_id = target_user_id
    AND plan_date >= CURRENT_DATE - INTERVAL '7 days';

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
        WHEN completion_rate >= 80 THEN 'Outstanding Week!'
        WHEN completion_rate >= 60 THEN 'Solid Progress'
        ELSE 'Room for Growth'
      END,
      'Your task completion rate is ' || completion_rate || '% this week. ' ||
      CASE
        WHEN completion_rate >= 80 THEN 'Keep up the excellent work!'
        WHEN completion_rate >= 60 THEN 'You''re maintaining good consistency.'
        ELSE 'Consider breaking tasks into smaller steps to boost completion.'
      END,
      GREATEST(0.7, completion_rate / 100),
      CASE WHEN completion_rate < 60 THEN 'high' ELSE 'medium' END,
      completion_rate < 80,
      'productivity'
    );
    insight_count := insight_count + 1;
  END IF;

  -- Find productivity patterns
  SELECT * INTO productivity_pattern
  FROM public.calculate_productivity_patterns(target_user_id)
  ORDER BY completion_rate DESC
  LIMIT 1;

  IF productivity_pattern IS NOT NULL AND productivity_pattern.completion_rate > 70 THEN
    INSERT INTO public.behavior_insights (
      user_id, insight_type, title, description, confidence, priority, actionable, category, data_points
    ) VALUES (
      target_user_id,
      'pattern',
      'Peak Performance Window Identified',
      'You complete ' || productivity_pattern.completion_rate || '% of tasks on ' ||
      CASE productivity_pattern.day_of_week
        WHEN 0 THEN 'Sundays'
        WHEN 1 THEN 'Mondays'
        WHEN 2 THEN 'Tuesdays'
        WHEN 3 THEN 'Wednesdays'
        WHEN 4 THEN 'Thursdays'
        WHEN 5 THEN 'Fridays'
        WHEN 6 THEN 'Saturdays'
      END || ' around ' || productivity_pattern.hour_of_day || ':00. Schedule important tasks during this time.',
      productivity_pattern.pattern_strength,
      'medium',
      true,
      'productivity',
      jsonb_build_object(
        'peak_hour', productivity_pattern.hour_of_day,
        'peak_day', productivity_pattern.day_of_week,
        'completion_rate', productivity_pattern.completion_rate
      )
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
    AND hc.completion_date >= CURRENT_DATE - INTERVAL '7 days';

  -- Generate habit insight
  IF habit_streak > 0 THEN
    INSERT INTO public.behavior_insights (
      user_id, insight_type, title, description, confidence, priority, actionable, category
    ) VALUES (
      target_user_id,
      CASE WHEN habit_streak >= 7 THEN 'celebration' ELSE 'pattern' END,
      CASE WHEN habit_streak >= 7 THEN 'Perfect Week!' ELSE 'Building Consistency' END,
      'You completed habits on ' || habit_streak || ' of the last 7 days.' ||
      CASE
        WHEN habit_streak = 7 THEN ' Outstanding consistency!'
        WHEN habit_streak >= 5 THEN ' Great job maintaining momentum.'
        ELSE ' Keep building the habit to reach your goals.'
      END,
      0.9,
      'medium',
      habit_streak < 7,
      'habits'
    );
    insight_count := insight_count + 1;
  END IF;

  -- Analyze mood-productivity correlation
  WITH correlations AS (
    SELECT * FROM public.calculate_correlation_scores(target_user_id)
    WHERE factor_a = 'Mood Score' AND factor_b = 'Productivity Rate'
    LIMIT 1
  )
  SELECT correlation_coefficient INTO mood_correlation FROM correlations;

  IF mood_correlation IS NOT NULL AND ABS(mood_correlation) > 0.5 THEN
    INSERT INTO public.behavior_insights (
      user_id, insight_type, title, description, confidence, priority, actionable, category
    ) VALUES (
      target_user_id,
      'pattern',
      'Mood-Productivity Connection',
      CASE
        WHEN mood_correlation > 0 THEN 'Better mood strongly correlates with higher productivity (r=' || mood_correlation || '). Focus on mood-boosting activities in the morning.'
        ELSE 'Lower mood appears linked to reduced productivity. Consider stress management techniques.'
      END,
      ABS(mood_correlation),
      'high',
      true,
      'wellbeing'
    );
    insight_count := insight_count + 1;
  END IF;

  -- Screen time analysis
  SELECT AVG(total_screen_time_minutes)
  INTO screen_time_avg
  FROM public.daily_device_stats
  WHERE user_id = target_user_id
    AND stat_date >= CURRENT_DATE - INTERVAL '7 days';

  IF screen_time_avg IS NOT NULL AND screen_time_avg > 300 THEN -- More than 5 hours
    INSERT INTO public.behavior_insights (
      user_id, insight_type, title, description, confidence, priority, actionable, category
    ) VALUES (
      target_user_id,
      'warning',
      'High Screen Time Detected',
      'Your average daily screen time is ' || ROUND(screen_time_avg / 60.0, 1) || ' hours this week. Consider setting app time limits or using focus mode during work hours.',
      0.8,
      'medium',
      true,
      'digital_wellbeing'
    );
    insight_count := insight_count + 1;
  END IF;

  -- Generate predictive insights
  PERFORM public.generate_predictive_insights(target_user_id);

  RETURN insight_count;
END;
$$;

-- Trigger to update analytics cache when plans are completed
CREATE OR REPLACE FUNCTION public.trigger_analytics_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Update analytics cache for the user
  PERFORM public.update_analytics_cache(NEW.user_id);
  RETURN NEW;
END;
$$;

-- Create trigger on daily_plans
DROP TRIGGER IF EXISTS analytics_update_on_plan_complete ON public.daily_plans;
CREATE TRIGGER analytics_update_on_plan_complete
AFTER INSERT OR UPDATE OF completed ON public.daily_plans
FOR EACH ROW
WHEN (NEW.completed = true)
EXECUTE FUNCTION public.trigger_analytics_update();

-- Create trigger on habit_completions
DROP TRIGGER IF EXISTS analytics_update_on_habit_complete ON public.habit_completions;
CREATE TRIGGER analytics_update_on_habit_complete
AFTER INSERT ON public.habit_completions
FOR EACH ROW
EXECUTE FUNCTION public.trigger_analytics_update();
