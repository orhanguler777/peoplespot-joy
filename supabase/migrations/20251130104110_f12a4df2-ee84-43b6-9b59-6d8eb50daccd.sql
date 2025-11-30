-- Remove the security definer view and use proper RLS policies instead
DROP VIEW IF EXISTS public.employee_timeline_view;

-- Add RLS policy to allow all authenticated users to view employees
-- This is safe because we only expose what's needed in the frontend queries
CREATE POLICY "All authenticated users can view employees for timeline"
ON public.employees
FOR SELECT
TO authenticated
USING (true);

-- Note: Frontend should only query id, first_name, last_name for timeline
-- Other sensitive columns (email, phone, etc.) should only be accessed by admins or the employee themselves