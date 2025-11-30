-- Enable RLS on the employee_timeline_view
ALTER VIEW public.employee_timeline_view SET (security_barrier = true);

-- Since we can't directly enable RLS on views, we'll rely on the security_invoker setting
-- which makes the view use the caller's permissions (already set in previous migration)

-- Add explicit SELECT policy for notification_settings to restrict to admins only
CREATE POLICY "Only admins can view notification settings"
ON public.notification_settings
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));