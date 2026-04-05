import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../middleware/auth.ts';

const router = express.Router();

// Helper to get supabase admin client
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase Admin client not configured');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Helper for audit logging
async function logAudit(supabaseAdmin: any, action: string, target_id: string, performed_by: string, old_values: any = null, new_values: any = null, req: any) {
  try {
    await supabaseAdmin.from('user_audit_log').insert({
      action,
      target_id,
      performed_by,
      old_values,
      new_values,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

// Apply middleware to all routes in this router
router.use(requireAdmin);

// GET /api/admin/users
router.get('/', async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { page = 1, limit = 25, search, role, is_active, sort_by = 'created_at', sort_order = 'desc' } = req.query;
    
    // Auto-create missing profiles from auth.users (Edge Case 2)
    try {
      const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers();
      const { data: profiles } = await supabaseAdmin.from('profiles').select('id');
      const profileIds = new Set(profiles?.map(p => p.id) || []);
      
      for (const authUser of authUsers) {
        if (!profileIds.has(authUser.id)) {
          await supabaseAdmin.from('profiles').insert({
            id: authUser.id,
            first_name: authUser.user_metadata?.first_name || '',
            last_name: authUser.user_metadata?.last_name || '',
            role: authUser.user_metadata?.role || 'client',
            email: authUser.email
          });
        }
      }
    } catch (e) {
      console.error('Failed to sync auth users', e);
    }

    let query = supabaseAdmin.from('admin_users_view').select('*', { count: 'exact' });

    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,company_name.ilike.%${search}%,siret.ilike.%${search}%`);
    }
    if (role) {
      query = query.eq('role', role);
    }
    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    // Pagination
    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;
    
    query = query.order(sort_by as string, { ascending: sort_order === 'asc' }).range(from, to);

    const { data, count, error } = await query;

    if (error) throw error;

    res.json({
      data,
      count,
      pages: Math.ceil((count || 0) / Number(limit)),
      current_page: Number(page)
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/users/export/csv
router.get('/export/csv', async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { search, role, is_active } = req.query;

    let query = supabaseAdmin.from('admin_users_view').select('*');

    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,company_name.ilike.%${search}%,siret.ilike.%${search}%`);
    }
    if (role) {
      query = query.eq('role', role);
    }
    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data, error } = await query;

    if (error) throw error;

    const headers = ['ID', 'Email', 'Prénom', 'Nom', 'Rôle', 'Société', 'Dossiers', 'Total Dépensé', 'Date de création', 'Dernier accès', 'Statut'];
    const csvContent = [
      headers.join(','),
      ...(data || []).map(u => [
        u.id,
        u.email,
        `"${u.first_name || ''}"`,
        `"${u.last_name || ''}"`,
        u.role,
        `"${u.company_name || ''}"`,
        u.dossiers_count || 0,
        u.total_spent || 0,
        u.created_at,
        u.last_sign_in_at || '',
        u.is_active ? 'Actif' : 'Inactif'
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=utilisateurs_formalia_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (error: any) {
    console.error('Error exporting users:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/users/:id
router.get('/:id', async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { id } = req.params;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('admin_users_view')
      .select('*')
      .eq('id', id)
      .single();

    if (profileError) throw profileError;

    const { data: dossiers, error: dossiersError } = await supabaseAdmin
      .from('dossiers')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: false });

    if (dossiersError) throw dossiersError;

    // Fetch auth user to check providers (Edge Case 3)
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(id);
    const providers = authUser?.user?.app_metadata?.providers || [];

    res.json({ profile: { ...profile, providers }, dossiers });
  } catch (error: any) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/users/:id/audit
router.get('/:id/audit', async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('user_audit_log')
      .select('*, performed_by_profile:profiles!performed_by(first_name, last_name, email)')
      .eq('target_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/users
router.post('/', async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { email, password, first_name, last_name, role, phone, company_name, send_invite } = req.body;
    const currentUserId = (req as any).user.id;

    // Rate limiting (Security Guard 4)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCreates } = await supabaseAdmin.from('user_audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('action', 'user_created')
      .eq('performed_by', currentUserId)
      .gte('created_at', oneHourAgo);

    if (recentCreates && recentCreates >= 10) {
      return res.status(429).json({ error: 'Limite de création atteinte (10 comptes par heure)' });
    }

    // 1. Create auth.users entry via admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        role
      }
    });

    // Edge Case 1: Email already exists
    if (authError) {
      if (authError.message.includes('already registered') || authError.status === 422) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé par un autre compte' });
      }
      throw authError;
    }

    // 2. Update profile with additional fields
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        phone,
        company_name,
        role
      })
      .eq('id', authData.user.id)
      .select()
      .single();

    if (profileError) throw profileError;

    // 3. Send invite if requested
    if (send_invite) {
      await supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email: email
      });
    }

    await logAudit(supabaseAdmin, 'user_created', authData.user.id, currentUserId, null, profileData, req);

    res.json({ user: profileData, message: 'Compte créé avec succès' });
  } catch (error: any) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/users/:id
router.put('/:id', async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { id } = req.params;
    const currentUserId = (req as any).user.id;
    const { first_name, last_name, phone, role, is_active, company_name, siret, address, city, postal_code, notes, updated_at } = req.body;

    // Self-protection (Security Guard 1)
    if (currentUserId === id && (role !== undefined || is_active !== undefined)) {
      return res.status(403).json({ error: 'Vous ne pouvez pas modifier votre propre rôle ou statut depuis cette interface.' });
    }

    // Concurrent edits (Edge Case 5)
    if (updated_at) {
      const { data: currentProfile } = await supabaseAdmin.from('profiles').select('updated_at').eq('id', id).single();
      if (currentProfile && currentProfile.updated_at !== updated_at) {
        return res.status(409).json({ error: 'Ce profil a été modifié par un autre admin. Rechargez pour voir les dernières modifications.' });
      }
    }

    // Fetch old values for audit log
    const { data: oldValues } = await supabaseAdmin.from('profiles').select('*').eq('id', id).single();

    // 1. Update profiles table
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        first_name,
        last_name,
        phone,
        role,
        is_active,
        company_name,
        siret,
        address,
        city,
        postal_code,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (profileError) throw profileError;

    // 2. Update auth user metadata if role changed
    if (role && oldValues?.role !== role) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        user_metadata: { role }
      });
      if (authError) throw authError;
    }

    // 3. Invalidate sessions if deactivated
    if (is_active === false && oldValues?.is_active !== false) {
      await supabaseAdmin.auth.admin.signOut(id, 'global');
    }

    await logAudit(supabaseAdmin, 'user_updated', id, currentUserId, oldValues, profileData, req);

    res.json({ user: profileData, message: 'Profil mis à jour' });
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/users/:id/email
router.patch('/:id/email', async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { id } = req.params;
    const { email } = req.body;
    const currentUserId = (req as any).user.id;

    const { data: oldValues } = await supabaseAdmin.from('profiles').select('email').eq('id', id).single();

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      email,
      email_confirm: true
    });

    if (authError) {
      if (authError.message.includes('already registered') || authError.status === 422) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé par un autre compte' });
      }
      throw authError;
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ email })
      .eq('id', id);

    if (profileError) throw profileError;

    await logAudit(supabaseAdmin, 'user_updated', id, currentUserId, oldValues, { email }, req);

    res.json({ message: 'Email mis à jour' });
  } catch (error: any) {
    console.error('Error updating user email:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/users/:id/password
router.patch('/:id/password', async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { id } = req.params;
    const { new_password, notify_user } = req.body;
    const currentUserId = (req as any).user.id;

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password: new_password
    });

    if (authError) throw authError;

    if (notify_user) {
      console.log(`Sending password reset notification to user ${id}`);
    }

    await logAudit(supabaseAdmin, 'password_reset_sent', id, currentUserId, null, null, req);

    res.json({ message: 'Mot de passe mis à jour' });
  } catch (error: any) {
    console.error('Error updating user password:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/users/:id/toggle-status
router.patch('/:id/toggle-status', async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { id } = req.params;
    const { is_active } = req.body;
    const currentUserId = (req as any).user.id;

    // Self-protection (Security Guard 1)
    if (currentUserId === id) {
      return res.status(403).json({ error: 'Vous ne pouvez pas désactiver votre propre compte depuis cette interface.' });
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ is_active })
      .eq('id', id);

    if (profileError) throw profileError;

    if (!is_active) {
      await supabaseAdmin.auth.admin.signOut(id, 'global');
    }

    await logAudit(supabaseAdmin, 'status_toggled', id, currentUserId, { is_active: !is_active }, { is_active }, req);

    res.json({ message: 'Statut mis à jour' });
  } catch (error: any) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/users/:id/role
router.patch('/:id/role', async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { id } = req.params;
    const { role } = req.body;
    const currentUserId = (req as any).user.id;

    // Self-protection (Security Guard 1)
    if (currentUserId === id) {
      return res.status(403).json({ error: 'Vous ne pouvez pas modifier votre propre rôle depuis cette interface.' });
    }

    // Last admin protection (Security Guard 2)
    if (role === 'client') {
      const { count, error: countError } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');

      if (countError) throw countError;

      if (count && count <= 1) {
        return res.status(400).json({ error: 'Impossible de rétrograder le dernier administrateur' });
      }
    }

    const { data: oldValues } = await supabaseAdmin.from('profiles').select('role').eq('id', id).single();

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', id);

    if (profileError) throw profileError;

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: { role }
    });

    if (authError) throw authError;

    await logAudit(supabaseAdmin, 'role_changed', id, currentUserId, oldValues, { role }, req);

    res.json({ message: 'Rôle modifié avec succès' });
  } catch (error: any) {
    console.error('Error changing user role:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/users/:id/resend-invite
router.post('/:id/resend-invite', async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { id } = req.params;
    const currentUserId = (req as any).user.id;

    const { data: user } = await supabaseAdmin.auth.admin.getUserById(id);
    if (!user.user?.email) throw new Error('User email not found');

    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: user.user.email
    });

    if (error) throw error;

    await logAudit(supabaseAdmin, 'password_reset_sent', id, currentUserId, null, null, req);

    res.json({ message: 'Email de confirmation renvoyé' });
  } catch (error: any) {
    console.error('Error resending invite:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/users/:id/revoke-sessions
router.post('/:id/revoke-sessions', async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { id } = req.params;
    const currentUserId = (req as any).user.id;

    const { error } = await supabaseAdmin.auth.admin.signOut(id, 'global');
    if (error) throw error;

    await logAudit(supabaseAdmin, 'sessions_revoked', id, currentUserId, null, null, req);

    res.json({ message: 'Sessions révoquées' });
  } catch (error: any) {
    console.error('Error revoking sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/:id', async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { id } = req.params;
    const { mode, reason } = req.body;
    const currentUserId = (req as any).user.id;

    // Self-protection (Security Guard 1)
    if (currentUserId === id) {
      return res.status(403).json({ error: 'Vous ne pouvez pas supprimer votre propre compte depuis cette interface.' });
    }

    // Last admin protection (Security Guard 2)
    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', id).single();
    if (profile?.role === 'admin') {
      const { count, error: countError } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');

      if (countError) throw countError;

      if (count && count <= 1) {
        return res.status(400).json({ error: 'Impossible de supprimer le dernier administrateur' });
      }
    }

    // Active dossiers check (Security Guard 3)
    const { count: activeDossiers, error: countError } = await supabaseAdmin
      .from('dossiers')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', id)
      .not('status', 'in', '("completed","rejected")');

    if (countError) throw countError;

    if (activeDossiers && activeDossiers > 0 && mode === 'hard') {
      return res.status(400).json({ error: `Impossible de supprimer ce compte car il possède ${activeDossiers} dossier(s) actif(s)` });
    }

    if (mode === 'soft') {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          first_name: 'Utilisateur',
          last_name: 'Supprimé',
          email: `deleted-${id}@formalia.invalid`,
          phone: null,
          company_name: null,
          siret: null,
          address: null,
          is_active: false,
          notes: `Compte supprimé le ${new Date().toISOString()} - Raison: ${reason || 'Non spécifiée'}`
        })
        .eq('id', id);

      if (profileError) throw profileError;

      await supabaseAdmin.auth.admin.signOut(id, 'global');
      await logAudit(supabaseAdmin, 'user_deleted', id, currentUserId, null, { mode: 'soft', reason }, req);
    } else if (mode === 'hard') {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (authError) throw authError;
      await logAudit(supabaseAdmin, 'user_deleted', id, currentUserId, null, { mode: 'hard', reason }, req);
    } else {
      return res.status(400).json({ error: 'Mode de suppression invalide' });
    }

    res.json({ message: 'Compte supprimé' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
