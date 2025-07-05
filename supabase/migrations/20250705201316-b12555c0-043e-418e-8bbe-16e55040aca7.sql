-- Create workout routines table
CREATE TABLE public.workout_routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create routine schedules table (defines which workouts happen on which days)
CREATE TABLE public.routine_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id UUID NOT NULL,
  workout_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  time_of_day TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.workout_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_schedules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workout_routines
CREATE POLICY "Users can view their own workout routines" 
ON public.workout_routines 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout routines" 
ON public.workout_routines 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout routines" 
ON public.workout_routines 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout routines" 
ON public.workout_routines 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for routine_schedules
CREATE POLICY "Users can view routine schedules for their routines" 
ON public.routine_schedules 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.workout_routines 
  WHERE workout_routines.id = routine_schedules.routine_id 
  AND workout_routines.user_id = auth.uid()
));

CREATE POLICY "Users can create routine schedules for their routines" 
ON public.routine_schedules 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.workout_routines 
  WHERE workout_routines.id = routine_schedules.routine_id 
  AND workout_routines.user_id = auth.uid()
));

CREATE POLICY "Users can update routine schedules for their routines" 
ON public.routine_schedules 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.workout_routines 
  WHERE workout_routines.id = routine_schedules.routine_id 
  AND workout_routines.user_id = auth.uid()
));

CREATE POLICY "Users can delete routine schedules for their routines" 
ON public.routine_schedules 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.workout_routines 
  WHERE workout_routines.id = routine_schedules.routine_id 
  AND workout_routines.user_id = auth.uid()
));

-- Add foreign key constraints
ALTER TABLE public.routine_schedules 
ADD CONSTRAINT fk_routine_schedules_routine_id 
FOREIGN KEY (routine_id) REFERENCES public.workout_routines(id) ON DELETE CASCADE;

ALTER TABLE public.routine_schedules 
ADD CONSTRAINT fk_routine_schedules_workout_id 
FOREIGN KEY (workout_id) REFERENCES public.workouts(id) ON DELETE CASCADE;

-- Add routine_id to workout_plans to track auto-generated plans
ALTER TABLE public.workout_plans 
ADD COLUMN routine_id UUID,
ADD CONSTRAINT fk_workout_plans_routine_id 
FOREIGN KEY (routine_id) REFERENCES public.workout_routines(id) ON DELETE SET NULL;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_workout_routines_updated_at
BEFORE UPDATE ON public.workout_routines
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_workout_routines_user_id_active ON public.workout_routines(user_id, is_active);
CREATE INDEX idx_routine_schedules_routine_id ON public.routine_schedules(routine_id);
CREATE INDEX idx_routine_schedules_day_of_week ON public.routine_schedules(day_of_week);
CREATE INDEX idx_workout_plans_routine_id ON public.workout_plans(routine_id);

-- Create function to generate workout plans from active routines
CREATE OR REPLACE FUNCTION public.generate_routine_workout_plans(
  target_user_id UUID,
  start_date DATE DEFAULT CURRENT_DATE,
  days_ahead INTEGER DEFAULT 7
)
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;