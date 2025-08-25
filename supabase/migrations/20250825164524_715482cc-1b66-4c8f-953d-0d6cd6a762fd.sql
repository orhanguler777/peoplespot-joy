-- Create function to update notification schedule and settings (Fixed version)
CREATE OR REPLACE FUNCTION public.set_notification_time(p_time time, p_timezone text DEFAULT 'Europe/Istanbul')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ts_local timestamptz;
  ts_utc timestamp;
  minute_text text;
  hour_text text;
  cron_expr text;
BEGIN
  -- Ensure only admins can call
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can update notification time';
  END IF;

  -- Upsert settings (single row)
  IF EXISTS (SELECT 1 FROM public.notification_settings) THEN
    UPDATE public.notification_settings 
    SET notification_time = p_time, timezone = COALESCE(p_timezone, timezone), updated_at = now();
  ELSE
    INSERT INTO public.notification_settings (notification_time, timezone)
    VALUES (p_time, COALESCE(p_timezone, 'Europe/Istanbul'));
  END IF;

  -- Unschedule any existing jobs
  PERFORM cron.unschedule('send-notifications-daily');
  PERFORM cron.unschedule('send-notifications-1935-europe-istanbul');

  -- Build a timestamp today at the specified local time and timezone
  ts_local := make_timestamptz(
    EXTRACT(YEAR FROM now())::int,
    EXTRACT(MONTH FROM now())::int,
    EXTRACT(DAY FROM now())::int,
    EXTRACT(HOUR FROM p_time)::int,
    EXTRACT(MINUTE FROM p_time)::int,
    0,
    p_timezone
  );

  -- Convert to UTC and extract hour & minute
  ts_utc := (ts_local AT TIME ZONE 'UTC');
  minute_text := to_char(ts_utc, 'MI');
  hour_text := to_char(ts_utc, 'HH24');
  cron_expr := minute_text || ' ' || hour_text || ' * * *';

  -- Schedule the daily job
  PERFORM cron.schedule(
    'send-notifications-daily',
    cron_expr,
    'SELECT net.http_post(url:=''https://outngvycajxdgyellntw.supabase.co/functions/v1/send-notifications'', headers:=''{\"Content-Type\": \"application/json\"}''::jsonb);'
  );
END;
$$;

-- Allow authenticated users to call the function (internal check enforces admin)
REVOKE ALL ON FUNCTION public.set_notification_time(time, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_notification_time(time, text) TO authenticated;