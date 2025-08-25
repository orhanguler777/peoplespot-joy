-- Update the user's role to admin (assuming this is the first user who should be admin)
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = '781ce588-8e8e-4dca-b652-eb81c723f3e0';