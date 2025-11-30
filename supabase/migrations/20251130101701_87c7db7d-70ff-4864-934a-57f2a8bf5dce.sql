-- Allow all authenticated users to view employees for the timeline
CREATE POLICY "All authenticated users can view employees for timeline"
ON public.employees
FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to view approved time-off requests
CREATE POLICY "All authenticated users can view approved time off requests"
ON public.time_off_requests
FOR SELECT
TO authenticated
USING (status = 'approved');