import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../hooks/useSettings';
import { SkeletonCard, SkeletonRow } from '../../components/ui/Skeleton';
import { 
  AlertTriangle, FolderOpen, Clock, CheckCircle2, 
  FileText, Plus, MoreVertical, HelpCircle, Mail, ExternalLink, CreditCard
} from 'lucide-react';

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', color: 'text-slate-600', bg: 'bg-slate-100' },
  received: { label: 'Reçu', color: 'text-blue-700', bg: 'bg-blue-100' },
  processing: { label: 'En cours', color: 'text-orange-700', bg: 'bg-orange-100' },
  pending_documents: { label: 'Docs manquants', color: 'text-amber-700', bg: 'bg-amber-100', urgent: true },
  completed: { label: 'Terminé', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  rejected: { label: 'Rejeté', color: 'text-red-700', bg: 'bg-red-100' },
};

export function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { data: settings } = useSettings();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  
  const day = new Date().getDay();
  const isOpen = day >= 1 && day <= 5 && hour >= 9 && hour < 18;

  const { data: dossiers, isLoading } = useQuery({
    queryKey: ['client_dossiers', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await (supabase as any)
        .from('dossiers')
        .select('*, formalites_catalogue(name, price_ttc)')
        .eq('client_id', profile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!profile?.id
  });

  const kpis = useMemo(() => {
    if (!dossiers) return null;
    return {
      inProgress: dossiers.filter(d => !['completed', 'rejected', 'draft'].includes(d.status)).length,
      completed: dossiers.filter(d => d.status === 'completed').length,
      actionRequired: dossiers.filter(d => d.status === 'pending_documents').length,
      totalSpent: dossiers.reduce((acc, d) => acc + (d.total_amount || 0), 0),
    };
  }, [dossiers]);

  const pendingDossier = dossiers?.find(d => d.status === 'pending_documents');

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
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8 animate-fade-in-up min-w-0">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {greeting}, {profile?.first_name} 👋
            </h1>
            <p className="text-slate-500 mt-1">
              Bienvenue sur votre espace personnel {settings?.company_name || 'Formalia'}.
            </p>
          </div>
          <button
            onClick={() => navigate('/formalite')}
            className="flex items-center gap-2 px-5 py-2.5 gradient-primary text-white 
              text-sm font-bold rounded-xl shadow-md shadow-primary/20 
              hover:shadow-lg hover:-translate-y-0.5 transition-all w-fit"
          >
            <Plus className="w-4 h-4" />
            Nouveau dossier
          </button>
        </div>

      {/* Alert Banner */}
      {pendingDossier && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-amber-50 border border-amber-200 
          rounded-2xl animate-fade-in-up">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>Action requise</strong> sur le dossier{' '}
              <span className="font-mono">{pendingDossier.reference}</span> :
              des documents sont manquants.
            </p>
          </div>
          <button 
            onClick={() => navigate(`/dashboard/dossiers/${pendingDossier.id}`)}
            className="whitespace-nowrap px-4 py-2 text-center bg-amber-500 text-white 
            text-xs font-bold rounded-xl hover:bg-amber-600 transition-all w-full sm:w-fit"
          >
            Voir le dossier
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {isLoading ? (
          [1,2,3,4].map(i => <SkeletonCard key={i} />)
        ) : [
          { label: 'Dossiers en cours', value: kpis?.inProgress ?? 0, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Terminés', value: kpis?.completed ?? 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { 
            label: 'Action requise', 
            value: kpis?.actionRequired ?? 0, 
            icon: AlertTriangle, 
            color: 'text-amber-600', 
            bg: 'bg-amber-50',
            badge: (kpis?.actionRequired ?? 0) > 0
          },
          { 
            label: 'Total dépensé', 
            value: (kpis?.totalSpent ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }), 
            icon: CreditCard, 
            color: 'text-purple-600', 
            bg: 'bg-purple-50' 
          },
        ].map(({ label, value, icon: Icon, color, bg, badge }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-slate-100 
            shadow-sm hover:shadow-md transition-shadow card-hover relative min-w-0">
            {badge && (
              <span className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-500/50" />
            )}
            <div className={`w-10 h-10 ${bg} ${color} rounded-xl flex items-center justify-center mb-4 shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-sm text-slate-500 font-medium truncate">{label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1 font-display truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Table (Desktop) / Cards (Mobile) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col w-full min-w-0">
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-slate-900">Dossiers récents</h2>
          {dossiers && dossiers.length > 5 && (
            <button 
              onClick={() => navigate('/dashboard/dossiers')}
              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors hidden sm:block"
            >
              Voir tous
            </button>
          )}
        </div>
        
        {/* Vue Desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/50">
                {['Référence', 'Type', 'Date', 'Statut', 'Montant', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3.5 text-xs font-semibold text-slate-400 
                    uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                [1,2,3].map(i => <SkeletonRow key={i} />)
              ) : dossiers?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Aucun dossier</h3>
                    <p className="text-sm text-slate-500 mb-6">Vous n'avez pas encore créé de dossier.</p>
                    <button
                      onClick={() => navigate('/formalite')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 
                        text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Créer ma première formalité
                    </button>
                  </td>
                </tr>
              ) : (
                dossiers?.slice(0, 5).map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono font-semibold text-slate-700">
                        {d.reference}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-900">
                        {d.formalites_catalogue?.name || 'Formalité'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-500">
                        {new Date(d.created_at).toLocaleDateString('fr-FR', { 
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-slate-900">
                        {d.total_amount != null
                          ? d.total_amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                          : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/dashboard/dossiers/${d.id}`)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Vue Mobile (Cartes) */}
        <div className="block sm:hidden divide-y divide-slate-50">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1,2,3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : dossiers?.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-slate-300" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Aucun dossier</h3>
              <p className="text-xs text-slate-500 mb-5">Vous n'avez pas encore créé de dossier.</p>
              <button
                onClick={() => navigate('/formalite')}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 
                  text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Créer ma première formalité
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {dossiers?.slice(0, 5).map((d) => (
                <div key={d.id} onClick={() => navigate(`/dashboard/dossiers/${d.id}`)}
                  className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm active:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono font-semibold text-slate-500">{d.reference}</span>
                    <StatusBadge status={d.status} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1 leading-tight">
                    {d.formalites_catalogue?.name || 'Formalité'}
                  </h4>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-slate-500">
                      {new Date(d.created_at).toLocaleDateString('fr-FR', { 
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {d.total_amount != null
                        ? d.total_amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                        : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {dossiers && dossiers.length > 5 && (
          <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/50 text-center sm:hidden">
            <button 
              onClick={() => navigate('/dashboard/dossiers')}
              className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors w-full"
            >
              Voir tous mes dossiers
            </button>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 
        flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 mb-1">Besoin d'aide ?</h3>
          <p className="text-sm text-slate-500">
            Notre équipe est disponible du lundi au vendredi, de 9h à 18h.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <button onClick={() => navigate('/faq')} className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 rounded-xl text-sm 
            font-medium text-slate-700 hover:bg-slate-50 transition-all text-center">
            Voir la FAQ
          </button>
          <a href={`mailto:${settings?.email_contact || 'contact@formalia.fr'}`} 
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 gradient-primary text-white 
              rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all">
            <Mail className="w-4 h-4" />
            Nous contacter
          </a>
        </div>
      </div>

    </div>
    </div>
  );
}
