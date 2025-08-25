-- Fix RLS to allow self-onboarding into employees
DROP POLICY IF EXISTS "Employees can create their own record" ON public.employees;
CREATE POLICY "Employees can create their own record"
ON public.employees
FOR INSERT
WITH CHECK (user_id = auth.uid());