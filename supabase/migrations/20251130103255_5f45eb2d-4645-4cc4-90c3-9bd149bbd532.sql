-- Allow all authenticated users to view all time off requests for team coordination
CREATE POLICY "All authenticated users can view time off requests"
ON public.time_off_requests
FOR SELECT
TO authenticated
USING (true);