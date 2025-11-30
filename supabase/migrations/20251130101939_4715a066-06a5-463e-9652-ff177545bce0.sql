-- Remove the overly permissive policy
DROP POLICY "All authenticated users can view employees for timeline" ON public.employees;

-- Create a view that only exposes non-sensitive employee data needed for the timeline
CREATE OR REPLACE VIEW public.employee_timeline_view AS
SELECT 
  id,
  first_name,
  last_name
FROM public.employees;

-- Grant SELECT access on the view to authenticated users
GRANT SELECT ON public.employee_timeline_view TO authenticated;

-- Add RLS to the view (views inherit RLS from base tables, but we make it explicit)
ALTER VIEW public.employee_timeline_view SET (security_invoker = true);