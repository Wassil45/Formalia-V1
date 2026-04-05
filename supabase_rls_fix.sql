-- Enable RLS (if not already)
ALTER TABLE dossiers ENABLE ROW LEVEL SECURITY;

-- Drop conflicting policies
DROP POLICY IF EXISTS "Clients can insert own dossiers" ON dossiers;
DROP POLICY IF EXISTS "Clients can read own dossiers" ON dossiers;
DROP POLICY IF EXISTS "Clients can update own dossiers" ON dossiers;

-- Allow authenticated clients to CREATE their own dossiers
CREATE POLICY "Clients can insert own dossiers"
ON dossiers FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = client_id);

-- Allow clients to READ their own dossiers
CREATE POLICY "Clients can read own dossiers"
ON dossiers FOR SELECT
TO authenticated
USING (auth.uid() = client_id);

-- Allow clients to UPDATE their own draft dossiers
CREATE POLICY "Clients can update own dossiers"
ON dossiers FOR UPDATE
TO authenticated
USING (
  auth.uid() = client_id 
  AND status = 'draft'
);

-- Allow admins to access all dossiers
DROP POLICY IF EXISTS "Admins full access dossiers" ON dossiers;
CREATE POLICY "Admins full access dossiers"
ON dossiers FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Step 4: Verify dossiers table columns
ALTER TABLE dossiers 
  ADD COLUMN IF NOT EXISTS reference TEXT,
  ADD COLUMN IF NOT EXISTS client_id UUID 
    REFERENCES profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS formalite_id UUID 
    REFERENCES formalites_catalogue(id),
  ADD COLUMN IF NOT EXISTS status TEXT 
    DEFAULT 'draft'
    CHECK (status IN (
      'draft','received','processing',
      'pending_documents','completed','rejected'
    )),
  ADD COLUMN IF NOT EXISTS form_data JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_status TEXT,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS admin_message_to_client TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Unique constraint on reference (skip if exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'dossiers_reference_key'
  ) THEN
    ALTER TABLE dossiers ADD CONSTRAINT dossiers_reference_key 
    UNIQUE (reference);
  END IF;
END $$;
