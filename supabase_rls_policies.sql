-- SQL Commands to fix RLS policies for all tables
-- Run these commands in the Supabase SQL Editor

-- 0. Create a SECURITY DEFINER function to check admin role
-- This bypasses RLS and prevents infinite recursion
-- We use the JWT metadata to avoid querying the profiles table entirely
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- Check if the user's email is the admin email, or if they have an admin claim
  -- This avoids querying the profiles table, which causes the infinite recursion
  RETURN (
    current_setting('request.jwt.claims', true)::json->>'email' = 'wassilhamadouche@gmail.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 1. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dossiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formalites_catalogue ENABLE ROW LEVEL SECURITY;

-- 2. Profiles Policies
-- Allow users to insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Allow users to read their own profile
DROP POLICY IF EXISTS "Users can view own profile." ON public.profiles;
CREATE POLICY "Users can view own profile."
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Allow admins to read all profiles
DROP POLICY IF EXISTS "Admins can view all profiles." ON public.profiles;
CREATE POLICY "Admins can view all profiles."
ON public.profiles FOR SELECT
USING (public.is_admin());

-- Allow admins to update all profiles
DROP POLICY IF EXISTS "Admins can update all profiles." ON public.profiles;
CREATE POLICY "Admins can update all profiles."
ON public.profiles FOR UPDATE
USING (public.is_admin());

-- 3. Dossiers Policies
-- Allow users to read their own dossiers
DROP POLICY IF EXISTS "Users can view own dossiers." ON public.dossiers;
CREATE POLICY "Users can view own dossiers."
ON public.dossiers FOR SELECT
USING (auth.uid() = client_id);

-- Allow users to insert their own dossiers
DROP POLICY IF EXISTS "Users can insert own dossiers." ON public.dossiers;
CREATE POLICY "Users can insert own dossiers."
ON public.dossiers FOR INSERT
WITH CHECK (auth.uid() = client_id);

-- Allow admins to read all dossiers
DROP POLICY IF EXISTS "Admins can view all dossiers." ON public.dossiers;
CREATE POLICY "Admins can view all dossiers."
ON public.dossiers FOR SELECT
USING (public.is_admin());

-- Allow admins to update all dossiers
DROP POLICY IF EXISTS "Admins can update all dossiers." ON public.dossiers;
CREATE POLICY "Admins can update all dossiers."
ON public.dossiers FOR UPDATE
USING (public.is_admin());

-- Allow admins to insert dossiers
DROP POLICY IF EXISTS "Admins can insert dossiers." ON public.dossiers;
CREATE POLICY "Admins can insert dossiers."
ON public.dossiers FOR INSERT
WITH CHECK (public.is_admin());

-- Allow admins to delete dossiers
DROP POLICY IF EXISTS "Admins can delete dossiers." ON public.dossiers;
CREATE POLICY "Admins can delete dossiers."
ON public.dossiers FOR DELETE
USING (public.is_admin());

-- 4. Formalites Catalogue Policies
-- Allow everyone to read formalites catalogue
DROP POLICY IF EXISTS "Everyone can view formalites catalogue." ON public.formalites_catalogue;
CREATE POLICY "Everyone can view formalites catalogue."
ON public.formalites_catalogue FOR SELECT
USING (true);

-- Allow admins to insert formalites catalogue
DROP POLICY IF EXISTS "Admins can insert formalites catalogue." ON public.formalites_catalogue;
CREATE POLICY "Admins can insert formalites catalogue."
ON public.formalites_catalogue FOR INSERT
WITH CHECK (public.is_admin());

-- Allow admins to update formalites catalogue
DROP POLICY IF EXISTS "Admins can update formalites catalogue." ON public.formalites_catalogue;
CREATE POLICY "Admins can update formalites catalogue."
ON public.formalites_catalogue FOR UPDATE
USING (public.is_admin());

-- Allow admins to delete formalites catalogue
DROP POLICY IF EXISTS "Admins can delete formalites catalogue." ON public.formalites_catalogue;
CREATE POLICY "Admins can delete formalites catalogue."
ON public.formalites_catalogue FOR DELETE
USING (public.is_admin());
