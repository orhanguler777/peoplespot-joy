-- Drop and recreate the employee_timeline_view with security_definer
-- This allows all users to see employee names for the timeline feature
-- while keeping the actual employees table properly protected

DROP VIEW IF EXISTS public.employee_timeline_view;

CREATE VIEW public.employee_timeline_view 
WITH (security_barrier = true)
AS SELECT 
    id,
    first_name,
    last_name
FROM public.employees;

-- Grant select to authenticated users
GRANT SELECT ON public.employee_timeline_view TO authenticated;

COMMENT ON VIEW public.employee_timeline_view IS 'Minimal employee data for timeline display - accessible to all authenticated users';