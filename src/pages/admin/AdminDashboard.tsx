import { FolderOpen, TrendingUp, Users, AlertCircle, Search, Filter, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export function AdminDashboard() {
  const { data: dossiers, isLoading, isError, error } = useQuery({
    queryKey: ['admin_dossiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossiers')
        .select(`
          *,
          profiles (first_name, last_name, email),
          formalites_catalogue (name, type)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase error fetching admin dossiers:', error);
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
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"><AlertCircle className="w-3.5 h-3.5" />En attente de documents</span>;
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
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-display">Vue d'ensemble</h2>
          <p className="text-slate-500 text-sm mt-1">Gérez l'activité de la plateforme.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher un dossier, client..." 
              className="pl-9 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg text-sm w-64 transition-all outline-none"
            />
          </div>
        </div>
      </header>

      <div className="p-8 flex flex-col gap-8 max-w-7xl mx-auto w-full">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <FolderOpen className="w-5 h-5" />
              </div>
              <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3 mr-1" /> +12%
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500 text-sm font-medium">Dossiers actifs</span>
              <span className="text-2xl font-bold text-slate-900 mt-1 font-display">{activeDossiersCount}</span>
            </div>
          </div>
          {/* Add more KPI cards as needed */}
        </div>

        {/* Recent Activity Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
            <h3 className="font-bold text-lg text-slate-900 font-display">Dossiers à traiter urgemment</h3>
            <button className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors">
              <Filter className="w-4 h-4" /> Filtrer
            </button>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : isError ? (
              <div className="p-8 text-center">
                <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                <p className="text-red-700 font-medium">Erreur lors du chargement des dossiers.</p>
                <p className="text-sm text-red-500 mt-1">{error instanceof Error ? error.message : 'Erreur inconnue'}</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                    <th className="px-6 py-4">Réf</th>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Statut</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dossiers?.map((dossier: any) => (
                    <tr key={dossier.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-slate-900 font-medium text-sm">{dossier.reference}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 uppercase">
                            {dossier.profiles?.first_name?.[0] || ''}{dossier.profiles?.last_name?.[0] || ''}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900">
                              {dossier.profiles?.first_name} {dossier.profiles?.last_name}
                            </span>
                            <span className="text-xs text-slate-500">{dossier.profiles?.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-700 text-sm">{dossier.formalites_catalogue?.name || 'Formalité inconnue'}</span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(dossier.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-sm font-medium text-primary hover:text-primary-dark hover:underline">
                          Traiter
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!dossiers || dossiers.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        Aucun dossier à traiter pour le moment.
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
