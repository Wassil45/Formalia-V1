import { useState, useMemo } from 'react';
import { DossierWithRelations, useAdminDossiers } from '../../hooks/useAdmin';
import { SkeletonCard, SkeletonRow } from '../../components/ui/Skeleton';
import { 
  FolderOpen, Clock, AlertCircle, CheckCircle2, TrendingUp, 
  Search, Filter, AlertTriangle, ChevronDown, Eye, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', color: 'text-slate-600', bg: 'bg-slate-100' },
  received: { label: 'Reçu', color: 'text-blue-700', bg: 'bg-blue-100' },
  processing: { label: 'En cours', color: 'text-orange-700', bg: 'bg-orange-100' },
  pending_documents: { label: 'Docs manquants', color: 'text-amber-700', bg: 'bg-amber-100', urgent: true },
  completed: { label: 'Terminé', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  rejected: { label: 'Rejeté', color: 'text-red-700', bg: 'bg-red-100' },
};

const STATUS_FILTERS = [
  { value: null, label: 'Tous les statuts' },
  { value: 'received', label: 'Reçu' },
  { value: 'processing', label: 'En cours' },
  { value: 'pending_documents', label: 'Docs manquants' },
  { value: 'completed', label: 'Terminé' },
];

export function AdminDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const { data: dossiers, isLoading, isError } = useAdminDossiers();

  const kpis = useMemo(() => {
    if (!dossiers) return null;
    return {
      actifs: dossiers.filter(d => !['completed', 'rejected'].includes(d.status)).length,
      urgent: dossiers.filter(d => d.status === 'pending_documents').length,
      termines: dossiers.filter(d => d.status === 'completed').length,
      total: dossiers.length,
    };
  }, [dossiers]);

  const filtered = useMemo(() => {
    if (!dossiers) return [];
    const q = searchQuery.toLowerCase();
    return dossiers.filter(d => {
      const matchSearch = !q 
        || d.reference?.toLowerCase().includes(q)
        || d.profiles?.first_name?.toLowerCase().includes(q)
        || d.profiles?.last_name?.toLowerCase().includes(q)
        || d.profiles?.email?.toLowerCase().includes(q);
      const matchStatus = !filterStatus || d.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [dossiers, searchQuery, filterStatus]);

  const StatusBadge = ({ status }: { status: string }) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
    if (!config) return null;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg 
        text-xs font-semibold ${config.bg} ${config.color}`}>
        {'urgent' in config && config.urgent && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />}
        {config.label}
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 min-w-0 w-full">

      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 sm:px-8 py-5 sticky top-0 z-10 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 truncate">Vue d'ensemble</h1>
            <p className="text-sm text-slate-500 mt-0.5 truncate">Gérez l'activité de la plateforme</p>
          </div>
          <div className="relative w-full sm:w-auto sm:max-w-xs shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl 
                text-sm w-full focus:outline-none focus:border-primary focus:ring-2 
                focus:ring-primary/10 focus:bg-white transition-all"
            />
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full min-w-0">

        {isError && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
            <Info className="w-4 h-4 flex-shrink-0" />
            Mode démonstration — Configurez vos variables Supabase pour voir vos données réelles.
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {isLoading ? (
            [1,2,3,4].map(i => <SkeletonCard key={i} />)
          ) : [
            { label: 'Dossiers actifs', value: kpis?.actifs ?? 0, icon: FolderOpen, 
              color: 'text-blue-600', bg: 'bg-blue-50', trend: '+3 ce mois' },
            { label: 'Docs manquants', value: kpis?.urgent ?? 0, icon: AlertCircle, 
              color: 'text-amber-600', bg: 'bg-amber-50', 
              trend: kpis?.urgent ? '⚠ Action requise' : null },
            { label: 'Dossiers traités', value: kpis?.termines ?? 0, icon: CheckCircle2, 
              color: 'text-emerald-600', bg: 'bg-emerald-50', trend: null },
            { label: 'Total dossiers', value: kpis?.total ?? 0, icon: TrendingUp, 
              color: 'text-primary', bg: 'bg-primary/8', trend: null },
          ].map(({ label, value, icon: Icon, color, bg, trend }) => (
            <div key={label} className="bg-white rounded-2xl p-5 border border-slate-100 
              shadow-sm hover:shadow-md transition-shadow card-hover min-w-0">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 ${bg} ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                {trend && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap
                    ${trend.includes('⚠') ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {trend}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 font-medium truncate">{label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1 font-display truncate">{value}</p>
            </div>
          ))}
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col w-full min-w-0">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-slate-900">Dossiers à traiter</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isLoading ? 'Chargement...' : `${filtered.length} résultat(s)`}
              </p>
            </div>
            <div className="relative w-full sm:w-auto">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className={`flex items-center justify-between sm:justify-start gap-2 px-3.5 py-2 rounded-xl text-sm 
                  font-medium border transition-all w-full sm:w-auto ${
                  filterStatus 
                    ? 'border-primary/30 bg-primary/8 text-primary' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5" />
                  {filterStatus 
                    ? STATUS_FILTERS.find(f => f.value === filterStatus)?.label 
                    : 'Filtrer'}
                </div>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showFilterMenu && (
                <div className="absolute right-0 mt-2 w-full sm:w-48 bg-white rounded-xl shadow-xl 
                  border border-slate-100 overflow-hidden z-20 animate-scale-in">
                  {STATUS_FILTERS.map(f => (
                    <button
                      key={String(f.value)}
                      onClick={() => { setFilterStatus(f.value); setShowFilterMenu(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        filterStatus === f.value 
                          ? 'bg-primary/8 text-primary font-medium' 
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/50">
                  <th className="px-4 md:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Référence</th>
                  <th className="hidden md:table-cell px-4 md:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Client</th>
                  <th className="hidden md:table-cell px-4 md:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Formalité</th>
                  <th className="hidden lg:table-cell px-4 md:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th className="px-4 md:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Statut</th>
                  <th className="px-4 md:px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  [1,2,3,4,5].map(i => <SkeletonRow key={i} columns={6} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 md:px-6 py-16 text-center">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-600">
                        {searchQuery || filterStatus 
                          ? 'Aucun résultat pour cette recherche' 
                          : 'Tous les dossiers sont traités !'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((d) => (
                    <tr key={d.id} 
                      className={`hover:bg-slate-50/50 transition-colors group ${
                        d.status === 'pending_documents' ? 'border-l-2 border-l-amber-400' : ''
                      }`}
                    >
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono font-semibold text-slate-700">
                          {d.reference}
                          <span className="block md:hidden mt-1 text-xs text-slate-500 font-sans font-normal truncate max-w-[130px]">
                            {d.formalites_catalogue?.name}
                          </span>
                          <span className="block md:hidden mt-0.5 text-xs text-slate-400 font-sans font-normal truncate max-w-[130px]">
                            {d.profiles?.first_name} {d.profiles?.last_name}
                          </span>
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 gradient-primary rounded-lg flex items-center 
                            justify-center text-white text-xs font-bold flex-shrink-0">
                            {d.profiles?.first_name?.[0]}{d.profiles?.last_name?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {d.profiles?.first_name} {d.profiles?.last_name}
                            </p>
                            <p className="text-xs text-slate-400">{d.profiles?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-4 md:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-700 truncate max-w-[150px] md:max-w-[200px] block">
                          {d.formalites_catalogue?.name}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell px-4 md:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-500">
                          {new Date(d.created_at).toLocaleDateString('fr-FR', { 
                            day: '2-digit', month: 'short' 
                          })}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => navigate(`/admin/dossiers/${d.id}`)}
                          className="opacity-0 group-hover:opacity-100 flex items-center 
                            gap-1.5 px-3 py-1.5 text-xs font-medium text-primary 
                            bg-primary/8 rounded-lg hover:bg-primary/15 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Traiter
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
