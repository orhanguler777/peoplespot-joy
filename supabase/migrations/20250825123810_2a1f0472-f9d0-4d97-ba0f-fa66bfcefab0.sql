-- Create storage bucket for employee avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('employee-avatars', 'employee-avatars', true);

-- Create RLS policies for employee avatars
CREATE POLICY "Anyone can view employee avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'employee-avatars');

CREATE POLICY "Employees can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'employee-avatars' AND 
  (auth.uid()::text = (storage.foldername(name))[1] OR 
   EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
);

CREATE POLICY "Employees can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'employee-avatars' AND 
  (auth.uid()::text = (storage.foldername(name))[1] OR 
   EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
);

CREATE POLICY "Employees can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'employee-avatars' AND 
  (auth.uid()::text = (storage.foldername(name))[1] OR 
   EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
);

-- Add avatar_url column to employees table
ALTER TABLE public.employees ADD COLUMN avatar_url TEXT;