-- Create daily_plans table to store daily plan entries
CREATE TABLE public.daily_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_date DATE NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('habit', 'goal', 'task', 'activity', 'workout', 'custom')),
  item_id UUID, -- nullable for custom items
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.daily_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own daily plans" 
ON public.daily_plans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily plans" 
ON public.daily_plans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily plans" 
ON public.daily_plans 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily plans" 
ON public.daily_plans 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_daily_plans_updated_at
BEFORE UPDATE ON public.daily_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_daily_plans_user_date ON public.daily_plans(user_id, plan_date);
CREATE INDEX idx_daily_plans_item ON public.daily_plans(item_type, item_id);