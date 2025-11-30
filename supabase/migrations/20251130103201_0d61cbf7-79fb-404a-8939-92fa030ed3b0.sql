-- Remove the policy that allows all authenticated users to view approved time off requests
DROP POLICY IF EXISTS "All authenticated users can view approved time off requests" ON public.time_off_requests;

-- Now only these policies remain:
-- 1. "Employees can view their own requests" - Users see only their own
-- 2. "Admins can manage all time off requests" - Admins see everything
-- This ensures regular users cannot see other employees' time-off data