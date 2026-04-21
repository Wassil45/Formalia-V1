import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { SkeletonRow } from '../../components/ui/Skeleton';
import { 
  Plus, Search, FileText, Clock, CheckCircle2, 
  AlertCircle, XCircle, Eye, ArrowRight
} from 'lucide-react';

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', color: 'text-slate-600', bg: 'bg-slate-100', icon: FileText },
  received: { label: 'Reçu', color: 'text-blue-700', bg: 'bg-blue-100', icon: Clock },
  processing: { label: 'En cours', color: 'text-orange-700', bg: 'bg-orange-100', icon: Clock },
  pending_documents: { label: 'Action requise', color: 'text-amber-700', bg: 'bg-amber-100', icon: AlertCircle },
  completed: { label: 'Terminé', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle2 },
  rejected: { label: 'Rejeté', color: 'text-red-700', bg: 'bg-red-100', icon: XCircle },
};

export function DossiersList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const { data: dossiers, isLoading } = useQuery({
    queryKey: ['client_dossiers', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossiers')
        .select('*, formalites_catalogue(name, type)')
        .eq('client_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const filtered = dossiers?.filter(d => {
    // Search
    const q = search.toLowerCase();
    const matchesSearch = !q || d.reference?.toLowerCase().includes(q) || (d.formalites_catalogue as any)?.name?.toLowerCase().includes(q);
    
    // Status
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    
    // Date
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const date = new Date(d.created_at);
      const now = new Date();
      if (dateFilter === 'today') {
        matchesDate = date.toDateString() === now.toDateString();
      } else if (dateFilter === '7days') {
        const pass = new Date(now.setDate(now.getDate() - 7));
        matchesDate = date >= pass;
      } else if (dateFilter === '30days') {
        const pass = new Date(now.setDate(now.getDate() - 30));
        matchesDate = date >= pass;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  }) ?? [];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 min-w-0 w-full">
      <header className="bg-white border-b border-slate-100 px-4 md:px-8 py-5 
        flex items-center justify-between sticky top-0 z-10 w-full">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 truncate">Mes dossiers</h1>
          <p className="text-sm text-slate-500 truncate">
            {isLoading ? 'Chargement...' : `${dossiers?.length ?? 0} dossier(s)`}
          </p>
        </div>
        <Link to="/formalite"
          className="flex items-center gap-2 px-4 py-2.5 gradient-primary text-white 
            text-sm font-semibold rounded-xl shadow-md shadow-primary/20 
            hover:shadow-lg hover:-translate-y-0.5 transition-all shrink-0">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nouvelle formalité</span>
        </Link>
      </header>

      <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6 min-w-0">
        {/* En-tête avec filtres */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par référence ou formalité..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl 
                text-sm focus:outline-none focus:border-primary focus:ring-2 
                focus:ring-primary/10 transition-all shadow-sm" />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 md:flex-none px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm 
                focus:outline-none focus:border-primary shadow-sm"
            >
              <option value="all">Tous statuts</option>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="flex-1 md:flex-none px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm 
                focus:outline-none focus:border-primary shadow-sm"
            >
              <option value="all">Toutes dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="7days">7 derniers jours</option>
              <option value="30days">30 derniers jours</option>
            </select>
          </div>
        </div>

        {/* Alerts */}
        {dossiers?.filter(d => d.status === 'pending_documents').map(d => (
          <div key={d.id} 
            className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 
              rounded-2xl cursor-pointer hover:bg-amber-100 transition-all"
            onClick={() => navigate(`/dashboard/dossiers/${d.id}`)}
          >
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">
                Action requise — Dossier {d.reference}
              </p>
              <p className="text-xs text-amber-700">Des documents sont manquants</p>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-500" />
          </div>
        ))}

        {/* Liste */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <table className="w-full">
              <tbody>{[1,2,3].map(i => <SkeletonRow key={i} />)}</tbody>
            </table>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 
            shadow-sm">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-700 mb-2">
              {search ? 'Aucun résultat' : 'Aucun dossier pour l\'instant'}
            </h3>
            {!search && (
              <Link to="/formalite"
                className="inline-flex items-center gap-2 mt-4 px-6 py-3 
                  gradient-primary text-white rounded-xl text-sm font-semibold 
                  shadow-md shadow-primary/20 hover:shadow-lg transition-all">
                <Plus className="w-4 h-4" />
                Créer ma première formalité
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(d => {
              const config = STATUS_CONFIG[d.status as keyof typeof STATUS_CONFIG];
              const Icon = config?.icon ?? FileText;
              return (
                <div key={d.id}
                  onClick={() => navigate(`/dashboard/dossiers/${d.id}`)}
                  className={`bg-white rounded-2xl border shadow-sm hover:shadow-md 
                    cursor-pointer transition-all hover:-translate-y-0.5 overflow-hidden
                    ${d.status === 'pending_documents' ? 'border-l-4 border-l-amber-400 border-slate-100' : 'border-slate-100'}`}
                >
                  <div className="flex items-center gap-4 p-5">
                    <div className={`w-11 h-11 ${config?.bg} rounded-xl flex items-center 
                      justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${config?.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold text-slate-700">
                          {d.reference}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full 
                          text-xs font-semibold ${config?.bg} ${config?.color}`}>
                          {config?.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 truncate">
                        {(d.formalites_catalogue as any)?.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(d.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'long', year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {d.total_amount && (
                        <span className="text-sm font-bold text-slate-900">
                          {d.total_amount.toLocaleString('fr-FR', 
                            { style: 'currency', currency: 'EUR' })}
                        </span>
                      )}
                      <ArrowRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
