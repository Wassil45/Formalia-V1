import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Plus, AlertTriangle, TrendingUp, FolderOpen, Hourglass, CheckCircle2, Euro, MoreVertical } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export function Dashboard() {
  const { user, profile } = useAuth();

  const { data: dossiers, isLoading, isError, error } = useQuery({
    queryKey: ['client_dossiers', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossiers')
        .select(`
          *,
          formalites_catalogue (name, type)
        `)
        .eq('client_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase error fetching client dossiers:', error);
        throw error;
      }
      return data;
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Brouillon</span>;
      case 'received':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Reçu</span>;
      case 'processing':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">En cours</span>;
      case 'pending_documents':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"><AlertTriangle className="w-3.5 h-3.5" />En attente de documents</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Terminé</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejeté</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  const activeDossiersCount = dossiers?.filter((d: any) => d.status !== 'completed' && d.status !== 'rejected' && d.status !== 'draft')?.length || 0;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-50 relative">
      <header className="flex items-center justify-between px-8 py-6 z-10">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-display">Bonjour {profile?.first_name || ''} 👋</h2>
          <p className="text-slate-500 text-sm mt-1">Voici un aperçu de vos formalités juridiques.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-full bg-white shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <Link to="/formalite" className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nouveau dossier
          </Link>
        </div>
      </header>

      <div className="px-8 pb-8 flex flex-col gap-8 z-10 max-w-7xl mx-auto w-full">
        {/* Alert Banner */}
        <div className="bg-orange-50/80 border border-orange-200 backdrop-blur-sm rounded-xl p-5 flex items-start md:items-center gap-4 shadow-sm">
          <div className="p-2 bg-orange-100 text-orange-600 rounded-lg flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-slate-900 font-semibold text-sm">Action requise</h3>
            <p className="text-slate-600 text-sm">Veuillez signer le document 'Statuts SAS' pour finaliser votre dossier #REF-2024.</p>
          </div>
          <button className="whitespace-nowrap px-4 py-2 bg-white text-orange-600 border border-orange-200 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors shadow-sm">
            Signer maintenant
          </button>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <FolderOpen className="w-5 h-5" />
              </div>
              <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3 mr-1" /> +1
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500 text-sm font-medium">Dossiers en cours</span>
              <span className="text-2xl font-bold text-slate-900 mt-1 font-display">{activeDossiersCount}</span>
            </div>
          </div>
          {/* ... other KPI cards ... */}
        </div>

        {/* Recent Dossiers Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
            <h3 className="font-bold text-lg text-slate-900 font-display">Dossiers Récents</h3>
            <button className="text-primary hover:text-primary-dark text-sm font-medium">Voir tout</button>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : isError ? (
              <div className="p-8 text-center">
                <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                <p className="text-red-700 font-medium">Erreur lors du chargement de vos dossiers.</p>
                <p className="text-sm text-red-500 mt-1">{error instanceof Error ? error.message : 'Erreur inconnue'}</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-100">
                    <th className="px-6 py-4">Réf</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Statut</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dossiers?.map((dossier: any) => (
                    <tr key={dossier.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-slate-900 font-medium text-sm">{dossier.reference}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-700 text-sm">{dossier.formalites_catalogue?.name || 'Formalité inconnue'}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm">
                        {new Date(dossier.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(dossier.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-400 hover:text-primary p-1 rounded transition-colors">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!dossiers || dossiers.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        Vous n'avez pas encore de dossier.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
