-- Allow employees to self-onboard by inserting their own employee record
CREATE POLICY IF NOT EXISTS "Employees can create their own record"
ON public.employees
FOR INSERT
WITH CHECK (user_id = auth.uid());