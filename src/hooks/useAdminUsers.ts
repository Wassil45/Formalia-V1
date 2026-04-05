import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase, getSafeSession } from '../lib/supabase';

export type UserFilters = {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'client' | 'admin';
  is_active?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
};

export type CreateUserPayload = {
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  role: 'client' | 'admin';
  phone?: string;
  company_name?: string;
  send_invite?: boolean;
};

export type UpdateUserPayload = Partial<{
  first_name: string;
  last_name: string;
  phone: string;
  role: 'client' | 'admin';
  is_active: boolean;
  company_name: string;
  siret: string;
  address: string;
  city: string;
  postal_code: string;
  notes: string;
  updated_at: string;
}>;

export type DeleteUserPayload = {
  id: string;
  mode: 'soft' | 'hard';
  reason?: string;
};

const toQueryString = (filters: UserFilters) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.append(key, String(value));
    }
  });
  return params.toString();
};

const getAuthHeaders = async () => {
  const session = await getSafeSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
  };
};

export function useAdminUsers(filters: UserFilters) {
  return useQuery({
    queryKey: ['admin-users', filters],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/users?${toQueryString(filters)}`, { headers });
      if (!res.ok) throw new Error('Erreur lors de la récupération des utilisateurs');
      return res.json();
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData
  });
}

export function useAdminUserDetail(id: string) {
  return useQuery({
    queryKey: ['admin-user', id],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/users/${id}`, { headers });
      if (!res.ok) throw new Error('Erreur lors de la récupération de l\'utilisateur');
      return res.json();
    },
    enabled: !!id
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateUserPayload) => {
      const headers = await getAuthHeaders();
      return fetch('/api/admin/users', {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      }).then(async r => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.error || 'Erreur lors de la création');
        }
        return r.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Compte créé avec succès');
    },
    onError: (error: Error) => toast.error(error.message)
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateUserPayload) => {
      const headers = await getAuthHeaders();
      return fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      }).then(async r => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.error || 'Erreur lors de la mise à jour');
        }
        return r.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] });
      toast.success('Profil mis à jour');
    },
    onError: (error: Error) => toast.error(error.message)
  });
}

export function useUpdateUserEmail(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      const headers = await getAuthHeaders();
      return fetch(`/api/admin/users/${id}/email`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ email })
      }).then(async r => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.error || 'Erreur lors de la mise à jour de l\'email');
        }
        return r.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] });
      toast.success('Email mis à jour avec succès');
    },
    onError: (error: Error) => toast.error(error.message)
  });
}

export function useUpdateUserPassword(id: string) {
  return useMutation({
    mutationFn: async (password: string) => {
      const headers = await getAuthHeaders();
      return fetch(`/api/admin/users/${id}/password`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ password })
      }).then(async r => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.error || 'Erreur lors de la mise à jour du mot de passe');
        }
        return r.json();
      });
    },
    onSuccess: () => {
      toast.success('Mot de passe mis à jour avec succès');
    },
    onError: (error: Error) => toast.error(error.message)
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const headers = await getAuthHeaders();
      return fetch(`/api/admin/users/${id}/toggle-status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ is_active })
      }).then(async r => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.error || 'Erreur lors de la mise à jour du statut');
        }
        return r.json();
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user', variables.id] });
      toast.success('Statut mis à jour');
    },
    onError: (error: Error) => toast.error(error.message)
  });
}

export function useChangeUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: 'client' | 'admin' }) => {
      const headers = await getAuthHeaders();
      return fetch(`/api/admin/users/${id}/role`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ role })
      }).then(async r => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.error || 'Erreur lors de la modification du rôle');
        }
        return r.json();
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user', variables.id] });
      toast.success('Rôle modifié avec succès');
    },
    onError: (error: Error) => toast.error(error.message)
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, mode, reason }: DeleteUserPayload) => {
      const headers = await getAuthHeaders();
      return fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ mode, reason })
      }).then(async r => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.error || 'Erreur lors de la suppression');
        }
        return r.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Compte supprimé');
    },
    onError: (error: Error) => toast.error(error.message)
  });
}

export function useResendInvite() {
  return useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders();
      return fetch(`/api/admin/users/${id}/resend-invite`, {
        method: 'POST',
        headers
      }).then(async r => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.error || 'Erreur lors de l\'envoi de l\'invitation');
        }
        return r.json();
      });
    },
    onSuccess: () => {
      toast.success('Email de confirmation renvoyé avec succès');
    },
    onError: (error: Error) => toast.error(error.message)
  });
}

export function useRevokeSessions() {
  return useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders();
      return fetch(`/api/admin/users/${id}/revoke-sessions`, {
        method: 'POST',
        headers
      }).then(async r => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.error || 'Erreur lors de la révocation des sessions');
        }
        return r.json();
      });
    },
    onSuccess: () => {
      toast.success('Toutes les sessions ont été révoquées');
    },
    onError: (error: Error) => toast.error(error.message)
  });
}

export function useUserAuditLogs(id: string) {
  return useQuery({
    queryKey: ['admin-user-audit', id],
    queryFn: async () => {
      if (!id) return [];
      const headers = await getAuthHeaders();
      return fetch(`/api/admin/users/${id}/audit`, { headers }).then(async r => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.error || 'Erreur lors du chargement de l\'historique');
        }
        return r.json();
      });
    },
    enabled: !!id
  });
}
