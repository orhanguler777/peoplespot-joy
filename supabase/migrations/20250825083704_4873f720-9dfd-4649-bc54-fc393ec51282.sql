-- Create profiles table for user authentication
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Add email column to employees table for invitations
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update employees RLS policies to be role-based
DROP POLICY IF EXISTS "Allow all operations on employees" ON public.employees;

CREATE POLICY "Admins can manage all employees" 
ON public.employees 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Employees can view their own record" 
ON public.employees 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Employees can update their own record" 
ON public.employees 
FOR UPDATE 
USING (user_id = auth.uid());

-- Update time_off_requests RLS policies
DROP POLICY IF EXISTS "Allow all operations on time_off_requests" ON public.time_off_requests;

CREATE POLICY "Admins can manage all time off requests" 
ON public.time_off_requests 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Employees can view their own requests" 
ON public.time_off_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.employees 
    WHERE id = employee_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Employees can create their own requests" 
ON public.time_off_requests 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees 
    WHERE id = employee_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Employees can update their pending requests" 
ON public.time_off_requests 
FOR UPDATE 
USING (
  status = 'pending' AND 
  EXISTS (
    SELECT 1 FROM public.employees 
    WHERE id = employee_id AND user_id = auth.uid()
  )
);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'employee');
  RETURN NEW;
END;
$$;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();