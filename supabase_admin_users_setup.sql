-- SQL Commands to set up Admin User Management features
-- Run these commands in the Supabase SQL Editor

-- 1. Create user_audit_log table
CREATE TABLE IF NOT EXISTS public.user_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  action text NOT NULL,
  target_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on user_audit_log
ALTER TABLE public.user_audit_log ENABLE ROW LEVEL SECURITY;

-- Allow admins to read audit logs
CREATE POLICY "Admins can view audit logs"
ON public.user_audit_log FOR SELECT
USING (public.is_admin());

-- 2. Add updated_at to profiles for optimistic locking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create a trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_modtime ON public.profiles;
CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- 3. Create admin_users_view
-- This view combines auth.users and public.profiles data for the admin dashboard
CREATE OR REPLACE VIEW public.admin_users_view AS
SELECT 
  p.id,
  au.email,
  p.first_name,
  p.last_name,
  p.role,
  p.phone,
  p.company_name,
  p.siret,
  p.address,
  p.is_active,
  p.notes,
  p.created_at,
  p.updated_at,
  au.last_sign_in_at,
  au.email_confirmed_at,
  (SELECT COUNT(*) FROM public.dossiers d WHERE d.client_id = p.id AND d.status NOT IN ('completed', 'rejected')) as active_dossiers_count,
  (SELECT COUNT(*) FROM public.dossiers d WHERE d.client_id = p.id) as dossiers_count,
  (SELECT COALESCE(SUM(price), 0) FROM public.dossiers d WHERE d.client_id = p.id) as total_spent
FROM 
  public.profiles p
JOIN 
  auth.users au ON p.id = au.id;

-- Grant access to the view
GRANT SELECT ON public.admin_users_view TO authenticated;
GRANT SELECT ON public.admin_users_view TO service_role;
