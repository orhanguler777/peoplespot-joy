-- Enable required extensions for scheduling and HTTP requests
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema extensions;

-- Unschedule existing job if present to make this idempotent
select cron.unschedule('send-notifications-1935-europe-istanbul');

-- Schedule daily invocation at 19:35 Europe/Istanbul (UTC+3) -> 16:35 UTC
select
  cron.schedule(
    'send-notifications-1935-europe-istanbul',
    '35 16 * * *',
    $$
    select
      net.http_post(
        url:='https://outngvycajxdgyellntw.supabase.co/functions/v1/send-notifications',
        headers:='{"Content-Type": "application/json"}'::jsonb
      ) as request_id;
    $$
  );