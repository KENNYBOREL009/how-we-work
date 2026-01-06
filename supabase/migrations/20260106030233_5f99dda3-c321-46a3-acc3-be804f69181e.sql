-- Table pour les budgets transport mensuels
CREATE TABLE public.transport_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Budget Transport',
  daily_cost INTEGER NOT NULL,
  working_days INTEGER NOT NULL DEFAULT 22,
  total_amount INTEGER NOT NULL,
  locked_amount INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transport_budgets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own budgets" 
ON public.transport_budgets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budgets" 
ON public.transport_budgets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets" 
ON public.transport_budgets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets" 
ON public.transport_budgets 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE TRIGGER update_transport_budgets_updated_at
BEFORE UPDATE ON public.transport_budgets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();