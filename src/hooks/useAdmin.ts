import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { MOCK_DOSSIERS } from '../data/mockDossiers';

export type DossierWithRelations = {
  id: string;
  reference: string;
  status: string;
  created_at: string;
  total_amount: number;
  form_data?: Record<string, unknown>;
  profiles: { first_name: string; last_name: string; email: string; };
  formalites_catalogue: { name: string; type: string; description?: string; required_documents?: any[] };
  admin_message_to_client?: string;
};

export function useAdminDossiers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('admin_dossiers_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dossiers' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin_dossiers'] });
          queryClient.invalidateQueries({ queryKey: ['admin_stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ['admin_dossiers'],
    enabled: !!user,
    queryFn: async (): Promise<DossierWithRelations[]> => {
      if (!isSupabaseConfigured()) {
        console.warn('Supabase non configuré — données de démonstration utilisées');
        return MOCK_DOSSIERS.filter(d => d.status !== 'draft') as unknown as DossierWithRelations[];
      }

      const { data, error } = await supabase
        .from('dossiers')
        .select(`
          *,
          profiles (first_name, last_name, email),
          formalites_catalogue (name, type)
        `)
        .neq('status', 'draft')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching admin dossiers:', error);
        throw error;
      }
      return data as unknown as DossierWithRelations[];
    }
  });
}

export function useAdminPriorityDossiers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('admin_priority_dossiers_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dossiers' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin_priority_dossiers'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ['admin_priority_dossiers'],
    enabled: !!user,
    queryFn: async (): Promise<DossierWithRelations[]> => {
      if (!isSupabaseConfigured()) {
        return MOCK_DOSSIERS.filter(d => ['received', 'pending_documents'].includes(d.status)) as unknown as DossierWithRelations[];
      }

      const { data, error } = await supabase
        .from('dossiers')
        .select(`
          *,
          profiles (first_name, last_name, email),
          formalites_catalogue (name, type)
        `)
        .in('status', ['received', 'pending_documents'])
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching admin priority dossiers:', error);
        throw error;
      }
      return data as unknown as DossierWithRelations[];
    }
  });
}

export function useUpdateDossierStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string, status: "received" | "processing" | "pending_documents" | "completed" | "rejected" | "draft" }) => {
      const { error } = await supabase
        .from('dossiers')
        .update({ status })
        .eq('id', id);
      if (error) {
        console.error('Error updating dossier status:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_dossiers'] });
      queryClient.invalidateQueries({ queryKey: ['admin_dossiers_list'] });
      queryClient.invalidateQueries({ queryKey: ['admin_dossiers_priority'] });
    }
  });
}

export function useUpdateBulkDossierStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[], status: "received" | "processing" | "pending_documents" | "completed" | "rejected" | "draft" }) => {
      const { error } = await supabase
        .from('dossiers')
        .update({ status })
        .in('id', ids);
      if (error) {
        console.error('Error updating bulk dossier status:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_dossiers'] });
      queryClient.invalidateQueries({ queryKey: ['admin_dossiers_list'] });
      queryClient.invalidateQueries({ queryKey: ['admin_dossiers_priority'] });
    }
  });
}

export function useSendAdminEmail() {
  return useMutation({
    mutationFn: async ({ to, subject, body }: { to: string, subject: string, body: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch('/api/admin/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ to, subject, body })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP Error ${res.status}`);
      }

      return res.json();
    }
  });
}

export function useAdminStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['admin_stats'],
    enabled: !!user,
    queryFn: async () => {
      const { data: dossiers, error } = await supabase
        .from('dossiers')
        .select(`
          id, status, total_amount, created_at, completed_at, stripe_payment_status,
          formalites_catalogue (name, type)
        `);
      
      if (error) {
        console.error('Error fetching admin stats:', error);
        throw error;
      }

      const totalDossiers = dossiers.length;
      const ca = dossiers.filter(d => d.stripe_payment_status === 'paid').reduce((sum, d) => sum + (d.total_amount || 0), 0);
      
      const completedDossiers = dossiers.filter(d => d.status === 'completed');
      const conversion = totalDossiers > 0 ? Math.round((completedDossiers.length / totalDossiers) * 100) : 0;

      let totalDelai = 0;
      let delaiCount = 0;
      completedDossiers.forEach(d => {
        if (d.created_at && d.completed_at) {
          const start = new Date(d.created_at).getTime();
          const end = new Date(d.completed_at).getTime();
          const diffDays = (end - start) / (1000 * 3600 * 24);
          totalDelai += diffDays;
          delaiCount++;
        }
      });
      const delai = delaiCount > 0 ? Number((totalDelai / delaiCount).toFixed(1)) : 0;

      // Chart Data Computations
      
      // 1. CA par jour (7 derniers jours)
      const caData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayCa = dossiers
          .filter(doc => doc.created_at.startsWith(dateStr) && doc.stripe_payment_status === 'paid')
          .reduce((sum, doc) => sum + (doc.total_amount || 0), 0);
        caData.push({ name: d.toLocaleDateString('fr-FR', { weekday: 'short' }), value: dayCa });
      }

      // 2. Répartition par type
      const types: Record<string, number> = {};
      dossiers.forEach(d => {
        const type = d.formalites_catalogue?.type || 'Autre';
        types[type] = (types[type] || 0) + 1;
      });
      const typeData = Object.entries(types).map(([name, value]) => ({ name, value }));

      // 3. Top formalités
      const formalites: Record<string, number> = {};
      dossiers.forEach(d => {
        const name = d.formalites_catalogue?.name || 'Autre';
        formalites[name] = (formalites[name] || 0) + 1;
      });
      const topFormalitesData = Object.entries(formalites)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // 4. Temps de traitement moyen par semaine (4 dernières semaines)
      const timeData = [];
      for (let i = 3; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - (i * 7));
        const weekStart = new Date(d);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const weekCompleted = completedDossiers.filter(doc => {
          const docDate = new Date(doc.completed_at);
          return docDate >= weekStart && docDate <= weekEnd;
        });

        let wTotalDelai = 0;
        weekCompleted.forEach(doc => {
          const start = new Date(doc.created_at).getTime();
          const end = new Date(doc.completed_at).getTime();
          wTotalDelai += (end - start) / (1000 * 3600 * 24);
        });
        const wDelai = weekCompleted.length > 0 ? Number((wTotalDelai / weekCompleted.length).toFixed(1)) : 0;
        
        timeData.push({ name: `S-${i}`, value: wDelai });
      }

      return {
        ca,
        dossiers: totalDossiers,
        delai,
        conversion,
        caData,
        typeData,
        topFormalitesData,
        timeData
      };
    }
  });
}
