-- Create notification settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_time time NOT NULL DEFAULT '19:35:00',
  timezone text NOT NULL DEFAULT 'Europe/Istanbul',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage notification settings
CREATE POLICY "Admins can manage notification settings" 
ON public.notification_settings 
FOR ALL 
USING (is_admin(auth.uid()));

-- Insert default settings
INSERT INTO public.notification_settings (notification_time, timezone) 
VALUES ('19:35:00', 'Europe/Istanbul')
ON CONFLICT DO NOTHING;

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();