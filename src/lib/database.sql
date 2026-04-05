-- ⚠️  INSTRUCTIONS D'INSTALLATION
-- 1. Connectez-vous à votre Supabase Dashboard
-- 2. Allez dans "SQL Editor"  
-- 3. Copiez-collez ce fichier et exécutez-le
-- 4. Configurez vos variables d'environnement dans .env.local :
--    VITE_SUPABASE_URL=https://votre-projet.supabase.co
--    VITE_SUPABASE_ANON_KEY=votre_clé_anon
-- 5. Relancez l'application

-- ============================================
-- TABLE: settings (logo, mentions légales, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: faq (FAQ éditable par admin)
-- ============================================
CREATE TABLE IF NOT EXISTS public.faq (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: email_templates (modèles d'emails)
-- ============================================
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: dossier_messages (messages admin → client)
-- ============================================
CREATE TABLE IF NOT EXISTS public.dossier_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_id UUID REFERENCES public.dossiers(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  sender_role TEXT CHECK (sender_role IN ('admin', 'client')),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: dossier_status_history (historique statuts)
-- ============================================
CREATE TABLE IF NOT EXISTS public.dossier_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_id UUID REFERENCES public.dossiers(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Settings : lecture publique, écriture admin
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_read" ON public.settings FOR SELECT USING (true);
CREATE POLICY "settings_write" ON public.settings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- FAQ : lecture publique, écriture admin
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faq_read" ON public.faq FOR SELECT USING (is_published = true OR EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
));
CREATE POLICY "faq_write" ON public.faq FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Email templates : admin seulement
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_templates_admin" ON public.email_templates FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Dossier messages
ALTER TABLE public.dossier_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_access" ON public.dossier_messages FOR ALL
  USING (
    auth.uid() = sender_id OR
    EXISTS (SELECT 1 FROM public.dossiers WHERE id = dossier_id AND client_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Dossier status history
ALTER TABLE public.dossier_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "history_access" ON public.dossier_status_history FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.dossiers WHERE id = dossier_id AND client_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Bucket pour les documents des dossiers
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dossier-documents',
  'dossier-documents', 
  false,
  10485760, -- 10 Mo
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Bucket pour les assets (logo, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'assets',
  'assets',
  true,
  5242880 -- 5 Mo
) ON CONFLICT (id) DO NOTHING;

-- Politique : les clients peuvent uploader dans leur dossier
CREATE POLICY "clients_upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'dossier-documents' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Politique : les clients peuvent voir leurs propres fichiers
CREATE POLICY "clients_read_own" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'dossier-documents' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Politique : les admins peuvent tout voir
CREATE POLICY "admins_read_all" ON storage.objects FOR ALL
  USING (
    bucket_id = 'dossier-documents' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Politique : tout le monde peut lire les assets publics
CREATE POLICY "assets_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'assets');

-- Politique : les admins peuvent gérer les assets
CREATE POLICY "admins_manage_assets" ON storage.objects FOR ALL
  USING (
    bucket_id = 'assets' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- DONNÉES INITIALES
-- ============================================

-- Templates d'emails par défaut
INSERT INTO public.email_templates (name, slug, subject, body_html, variables) VALUES
(
  'Confirmation de dossier',
  'dossier_created',
  'Votre dossier {{reference}} a été créé',
  '<h1>Bonjour {{first_name}},</h1><p>Votre dossier <strong>{{reference}}</strong> pour la formalité <strong>{{formalite_name}}</strong> a bien été créé.</p><p>Vous pouvez suivre son avancement depuis votre <a href="{{dashboard_url}}">espace client</a>.</p>',
  '["first_name", "reference", "formalite_name", "dashboard_url"]'
),
(
  'Documents manquants',
  'documents_required',
  'Action requise — Documents manquants pour le dossier {{reference}}',
  '<h1>Bonjour {{first_name}},</h1><p>Des documents sont manquants pour votre dossier <strong>{{reference}}</strong>.</p><p><strong>Documents requis :</strong></p>{{documents_list}}<p><a href="{{dossier_url}}">Téléchargez vos documents ici</a></p>',
  '["first_name", "reference", "documents_list", "dossier_url"]'
),
(
  'Dossier en cours de traitement',
  'dossier_processing',
  'Votre dossier {{reference}} est en cours de traitement',
  '<h1>Bonjour {{first_name}},</h1><p>Bonne nouvelle ! Votre dossier <strong>{{reference}}</strong> est maintenant pris en charge par notre équipe.</p><p>Délai estimé : <strong>{{delay_days}} jours ouvrés</strong>.</p>',
  '["first_name", "reference", "delay_days"]'
),
(
  'Dossier terminé',
  'dossier_completed',
  'Votre dossier {{reference}} est finalisé 🎉',
  '<h1>Félicitations {{first_name}} !</h1><p>Votre dossier <strong>{{reference}}</strong> a été traité avec succès.</p><p>Vos documents officiels sont disponibles dans votre <a href="{{dashboard_url}}">espace client</a>.</p>',
  '["first_name", "reference", "dashboard_url"]'
);

-- FAQ par défaut
INSERT INTO public.faq (question, answer, category, order_index) VALUES
('Quels sont les délais de traitement ?', 'Nos délais varient selon la formalité : 48h pour une création de société, 3 à 5 jours pour une modification de statuts.', 'general', 1),
('Quels documents faut-il fournir ?', 'Les documents requis dépendent de la formalité choisie. Notre système vous guide pas à pas lors de la constitution de votre dossier.', 'documents', 2),
('Comment suivre l''avancement de mon dossier ?', 'Connectez-vous à votre espace client pour suivre en temps réel l''avancement de vos dossiers.', 'general', 3),
('Puis-je modifier mon dossier après paiement ?', 'Vous pouvez modifier votre dossier tant qu''il n''a pas été transmis au greffe. Contactez notre équipe si nécessaire.', 'general', 4),
('Quels moyens de paiement acceptez-vous ?', 'Nous acceptons les cartes bancaires (Visa, Mastercard, American Express) via notre partenaire sécurisé Stripe.', 'paiement', 5);

-- Settings par défaut
INSERT INTO public.settings (key, value) VALUES
('company_name', 'Formalia SAS'),
('siren', '123 456 789'),
('address', '123 rue de la République, 75001 Paris'),
('capital', '10 000'),
('email_contact', 'contact@formalia.fr'),
('phone_contact', '01 23 45 67 89'),
('director_name', 'Jean Dupont'),
('brand_color', '#6366F1')
ON CONFLICT (key) DO NOTHING;
