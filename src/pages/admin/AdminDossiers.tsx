import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { getDocumentUrl } from '../../lib/storage';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { useSendAdminEmail } from '../../hooks/useAdmin';
import { SkeletonRow } from '../../components/ui/Skeleton';
import { 
  Search, Filter, Eye, MessageSquare, FileDown, 
  ChevronDown, X, Send, CheckCircle2, Clock, 
  AlertCircle, XCircle, FileText, ExternalLink,
  ArrowLeft, Loader2
} from 'lucide-react';

const STATUS_FLOW = {
  draft: { label: 'Brouillon', next: ['received'] },
  received: { label: 'Reçu', next: ['processing', 'pending_documents', 'rejected'] },
  processing: { label: 'En cours', next: ['pending_documents', 'completed', 'rejected'] },
  pending_documents: { label: 'Docs manquants', next: ['processing', 'rejected'] },
  completed: { label: 'Terminé', next: [] },
  rejected: { label: 'Rejeté', next: [] },
};

const STATUS_CONFIG: Record<string, { 
  label: string; color: string; bg: string; 
  icon: React.ElementType; border?: string 
}> = {
  draft: { label: 'Brouillon', color: 'text-slate-600', bg: 'bg-slate-100', icon: Clock },
  received: { label: 'Reçu', color: 'text-blue-700', bg: 'bg-blue-100', icon: CheckCircle2 },
  processing: { label: 'En cours', color: 'text-orange-700', bg: 'bg-orange-100', icon: Clock },
  pending_documents: { label: 'Docs manquants', color: 'text-amber-700', 
    bg: 'bg-amber-100', icon: AlertCircle, border: 'border-l-4 border-l-amber-400' },
  completed: { label: 'Terminé', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle2 },
  rejected: { label: 'Rejeté', color: 'text-red-700', bg: 'bg-red-100', icon: XCircle },
};

function DossierDrawer({ dossier, onClose }: { dossier: any; onClose: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [showStatusChange, setShowStatusChange] = useState<string | false>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Fetch email templates
  const { data: emailTemplates } = useQuery<any[]>({
    queryKey: ['email_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const sendEmailMutation = useSendAdminEmail();

  const handleSendTemplate = async () => {
    if (!selectedTemplate) return;
    const template = emailTemplates?.find(t => t.id === selectedTemplate);
    if (!template) return;

    try {
      // Replace variables in body
      let body = template.body_html;
      const variables = {
        first_name: dossier.profiles?.first_name || '',
        reference: dossier.reference,
        formalite_name: dossier.formalites_catalogue?.name || '',
        dashboard_url: `${window.location.origin}/dashboard/dossiers/${dossier.id}`,
        dossier_url: `${window.location.origin}/dashboard/dossiers/${dossier.id}`,
        delay_days: dossier.formalites_catalogue?.estimated_delay_days || '3',
        documents_list: documents.map((d: any) => `<li>${d.name}</li>`).join('')
      };

      Object.entries(variables).forEach(([key, value]) => {
        body = body.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });

      await sendEmailMutation.mutateAsync({
        to: dossier.profiles?.email || '',
        subject: template.subject.replace(/{{reference}}/g, dossier.reference),
        body
      });
      
      toast.success(`Email envoyé: ${`Le modèle "${template.name}" a été envoyé.`}`);
      setSelectedTemplate('');
    } catch (err: any) {
      toast.error(`Erreur: ${err.message}`);
    }
  };

  // Fetch les messages du dossier
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['dossier_messages', dossier.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossier_messages')
        .select('*, profiles(first_name, last_name, role)')
        .eq('dossier_id', dossier.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  // Fetch l'historique des statuts
  const { data: history } = useQuery({
    queryKey: ['dossier_history', dossier.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossier_status_history')
        .select('*, profiles(first_name, last_name)')
        .eq('dossier_id', dossier.id)
        .order('created_at', { ascending: false });
      if (error) return [];
      return (data ?? []) as any[];
    },
  });

  // Mutation : changer le statut
  const changeStatus = useMutation({
    mutationFn: async ({ newStatus, note }: { newStatus: string; note: string }) => {
      const oldStatus = dossier.status;
      
      // 1. Mettre à jour le dossier
      const updateData: any = { 
        status: newStatus, 
        updated_at: new Date().toISOString(),
        admin_notes: note || null,
      };
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
      
      const { error: updateError } = await supabase
        .from('dossiers')
        .update(updateData)
        .eq('id', dossier.id);
      if (updateError) throw updateError;

      // 2. Logger le changement de statut
      const { error: historyError } = await supabase.from('dossier_status_history').insert({
        dossier_id: dossier.id,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: user?.id,
        note: note || null,
      } as any);
      if (historyError) throw historyError;
    },
    onSuccess: (_, { newStatus }) => {
      queryClient.invalidateQueries({ queryKey: ['admin_dossiers'] });
      queryClient.invalidateQueries({ queryKey: ['dossier_history', dossier.id] });
      toast.success(`Statut mis à jour: ${`Dossier ${dossier.reference} → ${STATUS_CONFIG[newStatus]?.label}`}`);
      setShowStatusChange(false);
      setStatusNote('');
      onClose(); // Ferme le drawer et recharge
    },
    onError: (err: any) => toast.error(`Erreur: ${err.message}`),
  });

  // Mutation : envoyer un message
  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!message.trim()) return;
      const { error } = await supabase.from('dossier_messages').insert({
        dossier_id: dossier.id,
        sender_id: user?.id,
        sender_role: 'admin',
        content: message.trim(),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossier_messages', dossier.id] });
      setMessage('');
      toast.success(`Message envoyé: Le client a été notifié`);
    },
    onError: (err: any) => toast.error(`Erreur: ${err.message}`),
  });

  const currentStatusConfig = STATUS_CONFIG[dossier.status];
  const StatusIcon = currentStatusConfig?.icon ?? Clock;
  const availableNextStatuses = Object.keys(STATUS_CONFIG).filter(s => s !== dossier.status);
  const formData = dossier.form_data as any;
  const documents = formData?.documents ?? [];

  const handleDownload = async (url: string) => {
    try {
      const signedUrl = await getDocumentUrl(url);
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(`Erreur: Impossible d\'ouvrir le document`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl h-full shadow-2xl 
        flex flex-col animate-slide-in-right">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 
          bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div>
              <h2 className="font-bold text-slate-900 font-mono">{dossier.reference}</h2>
              <p className="text-xs text-slate-500">{dossier.formalites_catalogue?.name}</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs 
            font-semibold ${currentStatusConfig?.bg} ${currentStatusConfig?.color}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {currentStatusConfig?.label}
          </span>
        </div>

        {/* Corps scrollable */}
        <div className="flex-1 overflow-y-auto">
          
          {/* Infos client */}
          <div className="p-6 border-b border-slate-50">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Client
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center 
                justify-center text-white font-bold text-sm shadow-sm">
                {dossier.profiles?.first_name?.[0]}{dossier.profiles?.last_name?.[0]}
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  {dossier.profiles?.first_name} {dossier.profiles?.last_name}
                </p>
                <p className="text-sm text-slate-500">{dossier.profiles?.email}</p>
              </div>
            </div>
          </div>

          {/* Données du formulaire */}
          {formData?.companyInfo && (
            <div className="p-6 border-b border-slate-50">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Informations entreprise
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(formData.companyInfo).map(([key, value]) => (
                  value && (
                    <div key={key} className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm font-medium text-slate-900">{String(value)}</p>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {documents.length > 0 && (
            <div className="p-6 border-b border-slate-50">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Documents ({documents.length})
              </h3>
              <div className="space-y-2">
                {documents.map((doc: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 
                    rounded-xl border border-slate-100">
                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-sm text-slate-700 flex-1 truncate">{doc.name}</span>
                    <button onClick={() => handleDownload(doc.url)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-primary 
                        hover:bg-primary/8 transition-all">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Changement de statut */}
          <div className="p-6 border-b border-slate-50">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Changer le statut
            </h3>
            {availableNextStatuses.length === 0 ? (
              <p className="text-sm text-slate-400 italic">
                Ce dossier est dans son statut final.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {availableNextStatuses.map(status => {
                    const config = STATUS_CONFIG[status];
                    const Icon = config?.icon ?? Clock;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setShowStatusChange(status)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs 
                          font-semibold border-2 transition-all hover:-translate-y-0.5 
                          ${showStatusChange === status
                            ? `${config?.bg} ${config?.color} border-current`
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        → {config?.label}
                      </button>
                    );
                  })}
                </div>
                {showStatusChange && (
                  <div className="animate-fade-in-up space-y-3">
                    <textarea
                      value={statusNote}
                      onChange={e => setStatusNote(e.target.value)}
                      placeholder="Note interne (optionnel)..."
                      rows={2}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 
                        rounded-xl focus:outline-none focus:border-primary 
                        focus:ring-2 focus:ring-primary/10 resize-none transition-all"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowStatusChange(false)}
                        className="flex-1 py-2.5 border border-slate-200 rounded-xl 
                          text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={() => changeStatus.mutate({ 
                          newStatus: showStatusChange, 
                          note: statusNote 
                        })}
                        disabled={changeStatus.isPending}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white 
                          transition-all disabled:opacity-60 gradient-primary shadow-md`}
                      >
                        {changeStatus.isPending 
                          ? <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />...</>
                          : 'Confirmer'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Historique des statuts */}
          {history && history.length > 0 && (
            <div className="p-6 border-b border-slate-50">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Historique
              </h3>
              <div className="space-y-2">
                {history.map(h => (
                  <div key={h.id} className="flex items-start gap-2.5 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium text-slate-700">
                        {h.old_status ? `${STATUS_CONFIG[h.old_status]?.label} → ` : ''}
                        {STATUS_CONFIG[h.new_status]?.label}
                      </span>
                      {h.note && <p className="text-xs text-slate-400 mt-0.5">{h.note}</p>}
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {new Date(h.created_at).toLocaleDateString('fr-FR', { 
                        day: '2-digit', month: 'short' 
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Envoi d'email */}
          <div className="p-6 border-b border-slate-50">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Envoyer un email
            </h3>
            <div className="flex gap-2">
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-sm border border-slate-200 
                  rounded-xl focus:outline-none focus:border-primary 
                  focus:ring-2 focus:ring-primary/10 transition-all bg-white"
              >
                <option value="">Sélectionner un modèle...</option>
                {emailTemplates?.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <button
                onClick={handleSendTemplate}
                disabled={!selectedTemplate || sendEmailMutation.isPending}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white 
                  transition-all disabled:opacity-60 gradient-primary shadow-md flex items-center gap-2"
              >
                {sendEmailMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Envoyer
              </button>
            </div>
          </div>

          {/* Messagerie */}
          <div className="p-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Messages ({messages?.length ?? 0})
            </h3>
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {messagesLoading ? (
                <p className="text-xs text-slate-400">Chargement...</p>
              ) : messages?.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Aucun message</p>
              ) : (
                messages?.map(msg => (
                  <div key={msg.id} className={`flex gap-2 ${
                    msg.sender_role === 'admin' ? 'flex-row-reverse' : ''
                  }`}>
                    <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm ${
                      msg.sender_role === 'admin'
                        ? 'gradient-primary text-white rounded-tr-sm'
                        : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                    }`}>
                      <p>{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${
                        msg.sender_role === 'admin' ? 'text-white/60' : 'text-slate-400'
                      }`}>
                        {msg.profiles?.first_name} · {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage.mutate()}
                placeholder="Écrire un message au client..."
                className="flex-1 px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl 
                  focus:outline-none focus:border-primary focus:ring-2 
                  focus:ring-primary/10 transition-all"
              />
              <button
                type="button"
                onClick={() => sendMessage.mutate()}
                disabled={!message.trim() || sendMessage.isPending}
                className="p-2.5 gradient-primary text-white rounded-xl shadow-sm 
                  disabled:opacity-50 transition-all hover:shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminDossiers() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [selectedDossier, setSelectedDossier] = useState<any | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);

  const { data: dossiers, isLoading } = useQuery({
    queryKey: ['admin_dossiers_full'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossiers')
        .select('*, profiles(first_name, last_name, email), formalites_catalogue(name, type)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const filtered = useMemo(() => {
    if (!dossiers) return [];
    const q = search.toLowerCase();
    return dossiers.filter(d => {
      const matchSearch = !q
        || d.reference?.toLowerCase().includes(q)
        || d.profiles?.email?.toLowerCase().includes(q)
        || d.profiles?.first_name?.toLowerCase().includes(q)
        || d.profiles?.last_name?.toLowerCase().includes(q);
      const matchStatus = !statusFilter || d.status === statusFilter;
      
      let matchDate = true;
      if (dateFilter) {
        const date = new Date(d.created_at);
        const now = new Date();
        if (dateFilter === 'today') {
          matchDate = date.toDateString() === now.toDateString();
        } else if (dateFilter === '7days') {
          const pass = new Date(now.setDate(now.getDate() - 7));
          matchDate = date >= pass;
        } else if (dateFilter === '30days') {
          const pass = new Date(now.setDate(now.getDate() - 30));
          matchDate = date >= pass;
        }
      }
      return matchSearch && matchStatus && matchDate;
    });
  }, [dossiers, search, statusFilter, dateFilter]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 min-w-0 w-full">
      <header className="bg-white border-b border-slate-100 px-4 md:px-8 py-4 sticky top-0 z-10 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 truncate">Dossiers</h1>
            <p className="text-sm text-slate-500 truncate">
              {isLoading ? 'Chargement...' : `${filtered.length} dossier(s)`}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Référence, client..."
                className="w-full sm:w-56 pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 
                  rounded-xl text-sm focus:outline-none focus:border-primary 
                  focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all" />
            </div>
            <div className="relative">
              <button onClick={() => setShowDateFilter(!showDateFilter)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm 
                  font-medium border transition-all ${dateFilter 
                    ? 'border-primary/30 bg-primary/8 text-primary' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                <Clock className="w-4 h-4" />
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showDateFilter && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl 
                  border border-slate-100 overflow-hidden z-20 animate-scale-in">
                  {[
                    { value: null, label: 'Toutes les dates' },
                    { value: 'today', label: "Aujourd'hui" },
                    { value: '7days', label: '7 derniers jours' },
                    { value: '30days', label: '30 derniers jours' }
                  ].map(f => (
                    <button key={String(f.value)}
                      onClick={() => { setDateFilter(f.value); setShowDateFilter(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        dateFilter === f.value 
                          ? 'bg-primary/8 text-primary font-medium' 
                          : 'text-slate-700 hover:bg-slate-50'}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button onClick={() => setShowFilter(!showFilter)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm 
                  font-medium border transition-all ${statusFilter 
                    ? 'border-primary/30 bg-primary/8 text-primary' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                <Filter className="w-4 h-4" />
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showFilter && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl 
                  border border-slate-100 overflow-hidden z-20 animate-scale-in">
                  {[null, ...Object.keys(STATUS_CONFIG)].map(s => (
                    <button key={String(s)}
                      onClick={() => { setStatusFilter(s); setShowFilter(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        statusFilter === s 
                          ? 'bg-primary/8 text-primary font-medium' 
                          : 'text-slate-700 hover:bg-slate-50'}`}>
                      {s === null ? 'Tous les statuts' : STATUS_CONFIG[s]?.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full min-w-0">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col w-full min-w-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/50">
                  {['Référence', 'Client', 'Formalité', 'Montant', 'Date', 'Statut', ''].map(h => (
                    <th key={h} className="px-4 md:px-6 py-3.5 text-xs font-semibold 
                      text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  [1,2,3,4,5].map(i => <SkeletonRow key={i} columns={7} />)
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-500">Aucun dossier trouvé</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map(d => {
                    const config = STATUS_CONFIG[d.status];
                    const Icon = config?.icon ?? Clock;
                    return (
                      <tr key={d.id} 
                        className={`hover:bg-slate-50/50 transition-colors group cursor-pointer
                          ${d.status === 'pending_documents' ? 'border-l-4 border-l-amber-400' : ''}`}
                        onClick={() => setSelectedDossier(d)}
                      >
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono font-semibold text-slate-700">
                            {d.reference}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 gradient-primary rounded-lg flex items-center 
                              justify-center text-white text-xs font-bold flex-shrink-0">
                              {d.profiles?.first_name?.[0]}{d.profiles?.last_name?.[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {d.profiles?.first_name} {d.profiles?.last_name}
                              </p>
                              <p className="text-xs text-slate-400 truncate hidden md:block">
                                {d.profiles?.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-700 truncate max-w-[200px] block">
                            {d.formalites_catalogue?.name}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-slate-900">
                            {d.total_amount 
                              ? d.total_amount.toLocaleString('fr-FR', 
                                  { style: 'currency', currency: 'EUR' }) 
                              : '—'}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-500">
                            {new Date(d.created_at).toLocaleDateString('fr-FR', {
                              day: '2-digit', month: 'short'
                            })}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 
                            rounded-lg text-xs font-semibold ${config?.bg} ${config?.color}`}>
                            <Icon className="w-3 h-3" />
                            {config?.label}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                          <Eye className="w-4 h-4 text-slate-300 group-hover:text-primary 
                            transition-colors" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedDossier && (
        <DossierDrawer 
          dossier={selectedDossier} 
          onClose={() => setSelectedDossier(null)} 
        />
      )}
    </div>
  );
}
