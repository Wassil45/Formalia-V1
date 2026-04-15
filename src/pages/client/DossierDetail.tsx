import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { 
  ArrowLeft, FileText, Clock, CheckCircle2, AlertCircle, 
  XCircle, Send, Upload, File, X, Loader2,
  MessageSquare, History, ExternalLink, Plus
} from 'lucide-react';

import { uploadDocument as uploadDocumentHelper, getDocumentUrl } from '../../lib/storage';

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', color: 'text-slate-600', bg: 'bg-slate-100', 
    icon: FileText, description: 'Votre dossier est en cours de création.' },
  received: { label: 'Reçu', color: 'text-blue-700', bg: 'bg-blue-100', 
    icon: Clock, description: 'Votre dossier a été reçu et sera traité prochainement.' },
  processing: { label: 'En cours de traitement', color: 'text-orange-700', bg: 'bg-orange-100', 
    icon: Clock, description: 'Notre équipe traite votre dossier.' },
  pending_documents: { label: 'Documents manquants', color: 'text-amber-700', bg: 'bg-amber-100', 
    icon: AlertCircle, description: 'Des documents supplémentaires sont requis.' },
  completed: { label: 'Terminé', color: 'text-emerald-700', bg: 'bg-emerald-100', 
    icon: CheckCircle2, description: 'Votre dossier a été traité avec succès.' },
  rejected: { label: 'Rejeté', color: 'text-red-700', bg: 'bg-red-100', 
    icon: XCircle, description: 'Votre dossier a été rejeté. Contactez notre équipe.' },
};

export function DossierDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);

  const [isPaying, setIsPaying] = useState(false);

  // Fetch le dossier
  const { data: dossier, isLoading } = useQuery({
    queryKey: ['dossier_detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossiers')
        .select('*, formalites_catalogue(name, type, estimated_delay_days)')
        .eq('id', id!)
        .eq('client_id', user!.id) // Sécurité : ne peut voir que ses propres dossiers
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  const handlePayment = async () => {
    try {
      setIsPaying(true);
      
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dossierId: dossier.id,
          formaliteId: dossier.formalite_id,
          successUrl: `${window.location.origin}/dashboard/confirmation?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/dashboard/dossiers/${dossier.id}`
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la session de paiement');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Erreur lors de la création de la session de paiement');
      }
    } catch (err: unknown) {
      console.error('Payment error:', err);
      toast('error', 'Erreur', err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsPaying(false);
    }
  };

  // Fetch les messages
  const { data: messages } = useQuery({
    queryKey: ['client_messages', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossier_messages')
        .select('*, profiles(first_name, last_name, role)')
        .eq('dossier_id', id!)
        .order('created_at', { ascending: true });
      if (error) return [];
      return (data ?? []) as any[];
    },
  });

  // Fetch historique statuts
  const { data: history } = useQuery({
    queryKey: ['client_history', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossier_status_history')
        .select('*')
        .eq('dossier_id', id!)
        .order('created_at', { ascending: false });
      if (error) return [];
      return (data ?? []) as any[];
    },
  });

  // Upload de documents supplémentaires
  const uploadDocument = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast('error', 'Fichier trop volumineux', 'Maximum 10 Mo');
      return;
    }

    const fileId = Math.random().toString(36).slice(2, 9);
    setUploadingFiles(prev => [...prev, fileId]);

    const result = await uploadDocumentHelper(
      file, 
      user?.id ?? 'demo', 
      dossier?.formalite_id ?? 'demo',
      fileId
    );

    setUploadingFiles(prev => prev.filter(f => f !== fileId));

    if (!result.success) {
      toast('error', 'Erreur d\'upload', result.error ?? 'Erreur inconnue');
      return;
    }

    // Mettre à jour form_data du dossier avec le nouveau document
    const currentDocs = (dossier?.form_data as any)?.documents ?? [];
    const { error: updateError } = await supabase
      .from('dossiers')
      .update({
        form_data: {
          ...dossier?.form_data as any,
          documents: [...currentDocs, { name: file.name, url: result.path || result.url! }]
        }
      })
      .eq('client_id', user!.id)
      .eq('id', id!);

    if (updateError) {
      toast('error', 'Erreur', updateError.message);
    } else {
      queryClient.invalidateQueries({ queryKey: ['dossier_detail', id] });
      toast('success', 'Document ajouté', file.name);
    }
  };

  // Envoyer un message
  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!message.trim()) return;
      const { error } = await supabase.from('dossier_messages').insert({
        dossier_id: id,
        sender_id: user?.id,
        sender_role: 'client',
        content: message.trim(),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client_messages', id] });
      setMessage('');
    },
    onError: (err: any) => toast('error', 'Erreur', err.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <XCircle className="w-12 h-12 text-red-400" />
        <p className="text-slate-600">Dossier introuvable</p>
        <button onClick={() => navigate('/dashboard/dossiers')}
          className="text-primary hover:underline text-sm">
          Retour à mes dossiers
        </button>
      </div>
    );
  }

  const config = STATUS_CONFIG[dossier.status as keyof typeof STATUS_CONFIG];
  const Icon = config?.icon ?? FileText;
  const formData = dossier.form_data as any;
  const documents = formData?.documents ?? [];

  const handleDownload = async (url: string) => {
    try {
      const signedUrl = await getDocumentUrl(url);
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast('error', 'Erreur', 'Impossible d\'ouvrir le document');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 md:px-8 py-4 
        sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard/dossiers')}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-slate-900">{dossier.reference}</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl 
                text-xs font-semibold ${config?.bg} ${config?.color}`}>
                <Icon className="w-3.5 h-3.5" />
                {config?.label}
              </span>
            </div>
            <p className="text-sm text-slate-500 truncate">
              {(dossier.formalites_catalogue as any)?.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {(dossier.status === 'draft' || dossier.status === 'pending_documents') && (
              <button
                onClick={() => navigate(`/formalite?dossierId=${dossier.id}`)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-700 bg-slate-100
                  transition-all hover:bg-slate-200"
              >
                Modifier
              </button>
            )}
            {dossier.stripe_payment_status !== 'paid' && dossier.stripe_payment_status !== 'succeeded' && (
              <button
                onClick={handlePayment}
                disabled={isPaying}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white 
                  transition-all gradient-primary shadow-md hover:shadow-lg disabled:opacity-60 flex items-center gap-2"
              >
                {isPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Payer {dossier.total_amount ? `${dossier.total_amount} €` : ''}
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="p-4 md:p-8 max-w-4xl mx-auto w-full grid lg:grid-cols-3 gap-6">
        
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Statut et description */}
          <div className={`p-5 rounded-2xl border ${config?.bg} 
            border-current/20 flex items-start gap-3`}>
            <Icon className={`w-6 h-6 ${config?.color} flex-shrink-0 mt-0.5`} />
            <div>
              <p className={`font-semibold ${config?.color}`}>{config?.label}</p>
              <p className={`text-sm ${config?.color} opacity-80 mt-0.5`}>
                {config?.description}
              </p>
              {dossier.admin_message_to_client && (
                <div className="mt-3 p-3 bg-white/50 rounded-xl">
                  <p className="text-xs font-semibold text-slate-600 mb-1">
                    Message de notre équipe :
                  </p>
                  <p className="text-sm text-slate-700">
                    {dossier.admin_message_to_client}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Informations entreprise */}
          {formData?.companyInfo && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-50">
                <FileText className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-700">Informations saisies</h2>
              </div>
              <div className="p-5 grid grid-cols-2 gap-4">
                {Object.entries(formData.companyInfo).map(([key, value]) => (
                  value && (
                    <div key={key}>
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
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
              <div className="flex items-center gap-2.5">
                <Upload className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-700">
                  Documents ({documents.length})
                </h2>
              </div>
              {dossier.status !== 'completed' && dossier.status !== 'rejected' && (
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/8 
                    text-primary rounded-xl text-xs font-medium 
                    hover:bg-primary/15 transition-all">
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter
                </button>
              )}
            </div>
            <div className="p-5 space-y-2">
              {documents.map((doc: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 
                  rounded-xl border border-slate-100">
                  <File className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-700 flex-1 truncate">{doc.name}</span>
                  <button onClick={() => handleDownload(doc.url)}
                    className="p-1 rounded-lg text-slate-400 hover:text-primary transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {uploadingFiles.map(fid => (
                <div key={fid} className="flex items-center gap-3 p-3 bg-slate-50 
                  rounded-xl border border-slate-100">
                  <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary/40 rounded-full shimmer w-2/3" />
                  </div>
                </div>
              ))}
              {documents.length === 0 && uploadingFiles.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4 italic">
                  Aucun document
                </p>
              )}
            </div>
            <input ref={fileInputRef} type="file" multiple className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => e.target.files && 
                Array.from(e.target.files).forEach(uploadDocument)} />
          </div>

          {/* Messagerie */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-50">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700">
                Messages ({messages?.length ?? 0})
              </h2>
            </div>
            <div className="p-5">
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {messages?.length === 0 ? (
                  <p className="text-sm text-slate-400 italic text-center py-4">
                    Aucun message
                  </p>
                ) : (
                  messages?.map(msg => (
                    <div key={msg.id} className={`flex gap-2 ${
                      msg.sender_role === 'client' ? 'flex-row-reverse' : ''
                    }`}>
                      <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm ${
                        msg.sender_role === 'client'
                          ? 'gradient-primary text-white rounded-tr-sm'
                          : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                      }`}>
                        <p>{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${
                          msg.sender_role === 'client' ? 'text-white/60' : 'text-slate-400'
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString('fr-FR', 
                            { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input value={message} onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage.mutate()}
                  placeholder="Écrire un message à notre équipe..."
                  className="flex-1 px-3.5 py-2.5 text-sm border border-slate-200 
                    rounded-xl focus:outline-none focus:border-primary 
                    focus:ring-2 focus:ring-primary/10 transition-all" />
                <button onClick={() => sendMessage.mutate()}
                  disabled={!message.trim() || sendMessage.isPending}
                  className="p-2.5 gradient-primary text-white rounded-xl 
                    disabled:opacity-50 transition-all hover:shadow-md">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-4">
          {/* Récap */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-slate-900 text-sm">Récapitulatif</h3>
            {[
              { label: 'Formalité', value: (dossier.formalites_catalogue as any)?.name },
              { label: 'Créé le', value: new Date(dossier.created_at).toLocaleDateString('fr-FR', 
                { day: '2-digit', month: 'long', year: 'numeric' }) },
              { label: 'Montant', value: dossier.total_amount 
                ? dossier.total_amount.toLocaleString('fr-FR', 
                    { style: 'currency', currency: 'EUR' }) 
                : '—' },
              { label: 'Délai estimé', value: (dossier.formalites_catalogue as any)?.estimated_delay_days 
                ? `${(dossier.formalites_catalogue as any).estimated_delay_days} jours ouvrés` 
                : '—' },
            ].map(({ label, value }) => value && (
              <div key={label}>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">
                  {label}
                </p>
                <p className="text-sm font-medium text-slate-900">{value}</p>
              </div>
            ))}
          </div>

          {/* Historique */}
          {history && history.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-4 h-4 text-slate-400" />
                <h3 className="font-semibold text-slate-900 text-sm">Historique</h3>
              </div>
              <div className="space-y-3">
                {history.map((h, idx) => (
                  <div key={h.id} className="flex items-start gap-2.5">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      idx === 0 ? 'bg-primary' : 'bg-slate-200'
                    }`} />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-slate-700">
                        {STATUS_CONFIG[h.new_status as keyof typeof STATUS_CONFIG]?.label 
                          ?? h.new_status}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(h.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'short', 
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
