-- Create digital wellbeing tables for real data tracking

-- Table to categorize apps
CREATE TABLE public.app_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default app categories
INSERT INTO public.app_categories (name, color) VALUES 
  ('Social', '#3b82f6'),
  ('Entertainment', '#8b5cf6'),
  ('Professional', '#10b981'),
  ('Gaming', '#f59e0b'),
  ('Health', '#ef4444'),
  ('Education', '#06b6d4'),
  ('Productivity', '#84cc16'),
  ('News', '#6b7280'),
  ('Shopping', '#ec4899'),
  ('Other', '#64748b');

-- Table for individual app usage sessions
CREATE TABLE public.app_usage_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  app_name TEXT NOT NULL,
  category_id UUID REFERENCES public.app_categories(id),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for daily device statistics
CREATE TABLE public.daily_device_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stat_date DATE NOT NULL,
  total_screen_time_minutes INTEGER DEFAULT 0,
  total_pickups INTEGER DEFAULT 0,
  first_pickup_time TIME,
  last_activity_time TIME,
  longest_session_minutes INTEGER DEFAULT 0,
  focus_score DECIMAL(3,1) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, stat_date)
);

-- Table for focus/deep work sessions
CREATE TABLE public.focus_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  session_type TEXT DEFAULT 'focus', -- focus, deep_work, meditation
  interruptions INTEGER DEFAULT 0,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for digital wellbeing settings and preferences
CREATE TABLE public.digital_wellbeing_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  tracking_enabled BOOLEAN DEFAULT true,
  intentionality_prompts_enabled BOOLEAN DEFAULT true,
  break_reminders_enabled BOOLEAN DEFAULT true,
  break_interval_minutes INTEGER DEFAULT 30,
  daily_screen_time_goal_minutes INTEGER DEFAULT 480, -- 8 hours default
  focus_session_goal_minutes INTEGER DEFAULT 120, -- 2 hours default
  notification_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.app_usage_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_device_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_wellbeing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for app_usage_sessions
CREATE POLICY "Users can view their own app usage sessions" 
ON public.app_usage_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own app usage sessions" 
ON public.app_usage_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own app usage sessions" 
ON public.app_usage_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own app usage sessions" 
ON public.app_usage_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for daily_device_stats
CREATE POLICY "Users can view their own daily device stats" 
ON public.daily_device_stats 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily device stats" 
ON public.daily_device_stats 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily device stats" 
ON public.daily_device_stats 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for focus_sessions
CREATE POLICY "Users can view their own focus sessions" 
ON public.focus_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own focus sessions" 
ON public.focus_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own focus sessions" 
ON public.focus_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own focus sessions" 
ON public.focus_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for digital_wellbeing_settings
CREATE POLICY "Users can view their own digital wellbeing settings" 
ON public.digital_wellbeing_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own digital wellbeing settings" 
ON public.digital_wellbeing_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own digital wellbeing settings" 
ON public.digital_wellbeing_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- App categories are viewable by everyone
CREATE POLICY "App categories are viewable by everyone" 
ON public.app_categories 
FOR SELECT 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_app_usage_sessions_user_date ON public.app_usage_sessions(user_id, session_date);
CREATE INDEX idx_app_usage_sessions_app_name ON public.app_usage_sessions(app_name);
CREATE INDEX idx_daily_device_stats_user_date ON public.daily_device_stats(user_id, stat_date);
CREATE INDEX idx_focus_sessions_user_date ON public.focus_sessions(user_id, DATE(start_time));

-- Create function to update timestamps
CREATE TRIGGER update_app_usage_sessions_updated_at
BEFORE UPDATE ON public.app_usage_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_device_stats_updated_at
BEFORE UPDATE ON public.daily_device_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_focus_sessions_updated_at
BEFORE UPDATE ON public.focus_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_digital_wellbeing_settings_updated_at
BEFORE UPDATE ON public.digital_wellbeing_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();