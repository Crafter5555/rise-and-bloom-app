-- Add time and duration fields to daily_plans table
ALTER TABLE public.daily_plans 
ADD COLUMN scheduled_time TIME,
ADD COLUMN estimated_duration_minutes INTEGER DEFAULT 30,
ADD COLUMN actual_duration_minutes INTEGER;