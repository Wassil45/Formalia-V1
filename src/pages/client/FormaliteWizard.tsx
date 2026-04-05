import { useReducer, useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, getSafeSession } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, MapPin, User, ArrowRight, ArrowLeft, 
  CheckCircle2, FileText, Upload, Trash2, CreditCard,
  AlertCircle, Loader2, Save, Info, RefreshCw, LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { WizardState, WizardAction, WizardStep, UploadedDocument, FormaliteCatalogue } from '../../types/wizard.types';
import { DynamicField } from '../../components/ui/DynamicField';

const initialState: WizardState = {
  currentStep: 1,
  selectedFormaliteId: null,
  selectedFormalite: null,
  formData: {},
  documents: {},
  isSaving: false,
  error: null,
  dossierId: null,
  reference: null,
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SELECT_FORMALITE':
      return { 
        ...state, 
        selectedFormalite: action.payload.formalite,
        selectedFormaliteId: action.payload.formalite.id,
        reference: action.payload.reference,
        dossierId: action.payload.dossierId,
        formData: action.payload.formData || {},
        documents: (action.payload.formData as Record<string, unknown>)?._documents as Record<string, UploadedDocument> || {},
        currentStep: 2
      };
    case 'UPDATE_FORM_DATA':
      return { 
        ...state, 
        formData: { 
          ...state.formData, 
          ...action.payload,
          _documents: state.documents // Ensure documents are preserved in formData
        } 
      };
    case 'SET_DOCUMENTS':
      return { 
        ...state, 
        documents: action.payload,
        formData: {
          ...state.formData,
          _documents: action.payload // Sync to formData for saving
        }
      };
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function FormaliteWizard() {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset, trigger } = useForm({
    defaultValues: state.formData
  });

  // Fetch catalogue
  const { data: catalogue, isLoading: isLoadingCatalogue, error: catalogueError } = useQuery({
    queryKey: ['formalites_catalogue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formalites_catalogue')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        console.error('Catalogue fetch error:', {
          code: error.code,
          message: error.message,
          hint: error.hint
        });
        throw error;
      }
      return data as FormaliteCatalogue[];
    },
    staleTime: 5 * 60 * 1000
  });

  // Fetch active draft
  const { data: draft, isLoading: isLoadingDraft } = useQuery({
    queryKey: ['draft_dossier', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('dossiers')
        .select('*, formalites_catalogue(*)')
        .eq('client_id', user.id)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && state.currentStep === 1
  });

  // Initialize from draft
  useEffect(() => {
    if (draft && !state.dossierId && state.currentStep === 1) {
      // We don't auto-select, we let user choose to resume
    }
  }, [draft, state.dossierId, state.currentStep]);

  // Sync form data to state
  const watchedFields = watch();
  useEffect(() => {
    if (Object.keys(watchedFields).length > 0) {
      dispatch({ type: 'UPDATE_FORM_DATA', payload: watchedFields });
    }
  }, [watchedFields]);

  const [creatingId, setCreatingId] = useState<string | null>(null);

  const handleSelectFormalite = async (
    formalite: FormaliteCatalogue
  ) => {
    setCreatingId(formalite.id)

    try {
      // ① Verify active session
      const session = await getSafeSession()

      if (!session) {
        toast.error('Session expirée. Reconnectez-vous.')
        navigate('/auth?redirect=/formalite')
        return
      }

      const userId = session.user.id

      // ③ Insert draft dossier
      const { data, error } = await supabase
        .from('dossiers')
        .insert({
          client_id: userId,
          formalite_id: formalite.id,
          status: 'draft',
          form_data: {},
          total_amount: formalite.price_ttc 
            ?? (formalite.price_ht * 1.2) 
            ?? 0,
          reference: `DRAFT-${userId.slice(0,8)}-${Date.now()}`
        })
        .select('id, reference, form_data')
        .single()

      if (error) {
        // Log full error for debugging
        console.error('INSERT dossier failed:', {
          code:    error.code,
          message: error.message,
          details: error.details,
          hint:    error.hint,
          userId,
          formaliteId: formalite.id
        })
        throw error
      }

      // ④ Success → advance wizard to step 2
      dispatch({ 
        type: 'SELECT_FORMALITE', 
        payload: { 
          formalite, 
          reference: data.reference, 
          dossierId: data.id,
          formData: data.form_data || {}
        } 
      });
      reset((data.form_data as Record<string, unknown>) || {});
      dispatch({ type: 'SET_STEP', payload: 2 });
      window.scrollTo(0, 0);

    } catch (error: unknown) {
      const err = error as { code?: string; message?: string }
      console.error('handleSelectFormalite error:', err)

      // Specific messages by error code
      const errorMessages: Record<string, string> = {
        '42501': 'Permission refusée. Réessayez ou reconnectez-vous.',
        '23503': 'Formalité invalide. Rafraîchissez la page.',
        '23502': 'Données manquantes. Vérifiez votre profil.',
        '23505': 'Un dossier similaire existe déjà.',
        'PGRST301': 'Session expirée. Reconnectez-vous.'
      }

      const message = err.code && errorMessages[err.code]
        ? errorMessages[err.code]
        : 'Impossible de créer le dossier. Réessayez.'

      toast.error(message)

    } finally {
      setCreatingId(null)
    }
  }

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      if (!state.dossierId) return;
      const { error } = await supabase
        .from('dossiers')
        .update({ 
          form_data: state.formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', state.dossierId);
      if (error) throw error;
    },
    onMutate: () => dispatch({ type: 'SET_SAVING', payload: true }),
    onSettled: () => dispatch({ type: 'SET_SAVING', payload: false }),
    onSuccess: () => {
      // toast.success('Brouillon sauvegardé');
    }
  });

  // Auto-save
  useEffect(() => {
    if (state.dossierId && state.currentStep > 1) {
      const timer = setTimeout(() => {
        saveDraftMutation.mutate();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.formData, state.dossierId, state.currentStep]);

  const handleResumeDraft = () => {
    if (draft) {
      const d = draft as { formalites_catalogue: FormaliteCatalogue, reference: string, id: string, form_data: Record<string, unknown> };
      dispatch({ 
        type: 'SELECT_FORMALITE', 
        payload: { 
          formalite: d.formalites_catalogue, 
          reference: d.reference, 
          dossierId: d.id,
          formData: d.form_data || {}
        } 
      });
      reset(d.form_data || {});
      toast.success('Brouillon repris');
    }
  };

  const handleNext = async () => {
    // Validate form on step 2 only
    if (state.currentStep === 2) {
      const isValid = await trigger();
      if (!isValid) return;
      // Save draft before advancing
      await saveDraftMutation.mutateAsync();
    }
    if (state.currentStep < 5) {
      dispatch({ 
        type: 'SET_STEP', 
        payload: (state.currentStep + 1) as WizardStep 
      });
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (state.currentStep > 1) {
      dispatch({ type: 'SET_STEP', payload: (state.currentStep - 1) as WizardStep });
      window.scrollTo(0, 0);
    }
  };

  const handlePayment = async () => {
    try {
      dispatch({ type: 'SET_SAVING', payload: true });
      
      // 1. Save final draft
      await saveDraftMutation.mutateAsync();

      // 2. Call Stripe Checkout API
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dossierId: state.dossierId,
          formaliteId: state.selectedFormaliteId,
          successUrl: `${window.location.origin}/dashboard/confirmation?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/formalite`
        })
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Erreur lors de la création de la session de paiement');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  };

  const getSteps = () => [
    { id: 1, name: 'Service',       icon: LayoutGrid    },
    { id: 2, name: 'Informations',  icon: FileText      },
    { id: 3, name: 'Documents',     icon: Upload        },
    { id: 4, name: 'Validation',    icon: CreditCard    },
    { id: 5, name: 'Terminé',       icon: CheckCircle2  },
  ];

  const steps = getSteps();

  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 font-display">Quelle formalité souhaitez-vous réaliser ?</h1>
        <p className="text-slate-500 text-lg">Choisissez le type de dossier que vous souhaitez que nous traitions pour vous.</p>
      </div>

      {draft && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Save className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900">Brouillon en cours</h3>
              <p className="text-sm text-blue-700">Vous avez un dossier "{(draft as { formalites_catalogue?: { name?: string } }).formalites_catalogue?.name}" non terminé.</p>
            </div>
          </div>
          <button 
            onClick={handleResumeDraft}
            className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
          >
            Reprendre
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {catalogue && catalogue.length > 0 ? (
          catalogue.map((formalite) => (
            <button
              key={formalite.id}
              onClick={() => handleSelectFormalite(formalite)}
              disabled={creatingId !== null}
              className={`group relative bg-white border border-slate-200 rounded-3xl p-8 text-left hover:border-primary hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 flex flex-col gap-6 overflow-hidden cursor-pointer active:scale-95 disabled:cursor-not-allowed ${creatingId && creatingId !== formalite.id ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg">
                  {creatingId === formalite.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowRight className="w-5 h-5" />
                  )}
                </div>
              </div>
              
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300 transform group-hover:rotate-6">
                {formalite.type === 'immatriculation' && <Building2 className="w-8 h-8" />}
                {formalite.type === 'modification' && <RefreshCw className="w-8 h-8" />}
                {formalite.type === 'radiation' && <Trash2 className="w-8 h-8" />}
              </div>

              <div className="flex-grow">
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors font-display">{formalite.name}</h3>
                <p className="text-slate-500 text-sm mt-3 leading-relaxed line-clamp-3">{formalite.description || 'Accompagnement complet pour votre démarche juridique.'}</p>
              </div>

              <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="text-right">
                  <span className="text-xl font-black text-slate-900">{formalite.price_ttc || (formalite.price_ht * 1.2).toFixed(2)}€ <span className="text-xs font-medium text-slate-400">TTC</span></span>
                  <div className="text-[10px] text-slate-400 mt-0.5">Soit {formalite.price_ht}€ HT</div>
                </div>
                <div className="flex items-center gap-2 text-primary font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  Démarrer <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300">
            {catalogueError ? (
              <>
                <p className="text-red-500 font-medium">
                  Erreur de chargement des formalités
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  {catalogueError instanceof Error ? catalogueError.message : 'Une erreur est survenue'}
                </p>
                <button 
                  onClick={() => queryClient.invalidateQueries({ 
                    queryKey: ['formalites_catalogue'] 
                  })}
                  className="mt-4 px-4 py-2 text-sm bg-primary text-white rounded-xl"
                >
                  Réessayer
                </button>
              </>
            ) : (
              <p className="text-slate-500">
                Aucune formalité disponible pour le moment.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => {
    const schema = (state.selectedFormalite?.form_schema as { sections: { title: string; icon: string; fields: { id: string; type: string; label: string; required: boolean; placeholder?: string; help?: string; options?: string[] }[] }[] }) || {
      sections: [
        {
          title: "Identité de l'entreprise",
          icon: "Building2",
          fields: [
            { id: "company_name", type: "text", label: "Dénomination sociale", required: true, placeholder: "Ex: Ma Société SAS" },
            { id: "siret", type: "siret", label: "SIRET", required: true, help: "14 chiffres sans espaces" },
            { id: "legal_form", type: "select", label: "Forme juridique", required: true, options: ["SAS", "SASU", "SARL", "EURL", "SCI", "Auto-entrepreneur"] }
          ]
        },
        {
          title: "Siège social",
          icon: "MapPin",
          fields: [
            { id: "address", type: "text", label: "Adresse", required: true },
            { id: "city", type: "text", label: "Ville", required: true },
            { id: "postal_code", type: "text", label: "Code postal", required: true }
          ]
        }
      ]
    };

    // Find the current step in the dynamic steps to know which section to render
    const currentStepConfig = steps.find(s => s.id === state.currentStep) as { id: number; name: string; icon: React.ElementType; sectionIndex?: number } | undefined;
    const sectionIndex = currentStepConfig?.sectionIndex;
    
    const sectionsToRender = sectionIndex !== undefined && sectionIndex !== null 
      ? [schema.sections[sectionIndex]].filter(Boolean)
      : schema.sections;

    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 font-display">
            {currentStepConfig?.name || "Informations sur l'entreprise"}
          </h1>
          <p className="text-slate-500 text-lg">Ces informations nous permettront de rédiger vos documents juridiques.</p>
        </div>

        <div className="space-y-8">
          {sectionsToRender.map((section, idx: number) => (
            <div key={idx} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-primary">
                  {section.icon === 'Building2' && <Building2 size={20} />}
                  {section.icon === 'MapPin' && <MapPin size={20} />}
                  {section.icon === 'User' && <User size={20} />}
                </div>
                <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {section.fields.map((field) => (
                  <DynamicField 
                    key={field.id} 
                    field={field} 
                    register={register} 
                    errors={errors} 
                    watch={watch}
                    setValue={setValue}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleFileUpload = async (docId: string, file: File) => {
    if (!state.dossierId || !user) return;

    try {
      dispatch({ type: 'SET_SAVING', payload: true });
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${state.dossierId}/${docId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('dossier-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const newDocs = {
        ...state.documents,
        [docId]: {
          id: docId,
          name: file.name,
          url: data.path,
          status: 'uploaded' as const,
          uploadedAt: new Date().toISOString()
        }
      };

      dispatch({ type: 'SET_DOCUMENTS', payload: newDocs });
      
      // Update dossier with document info inside form_data
      await supabase
        .from('dossiers')
        .update({ 
          form_data: { ...state.formData, _documents: newDocs } as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', state.dossierId);

      toast.success(`${file.name} téléchargé avec succès`);
    } catch (err: unknown) {
      console.error('Upload error:', err);
      toast.error(`Erreur lors du téléchargement: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  };

  const handleRemoveFile = async (docId: string) => {
    if (!state.dossierId) return;

    try {
      const doc = state.documents[docId];
      if (doc?.url) {
        await supabase.storage.from('dossier-documents').remove([doc.url]);
      }

      const newDocs = { ...state.documents };
      delete newDocs[docId];

      dispatch({ type: 'SET_DOCUMENTS', payload: newDocs });

      await supabase
        .from('dossiers')
        .update({ 
          form_data: { ...state.formData, _documents: newDocs } as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', state.dossierId);

      toast.success('Document supprimé');
    } catch (err: unknown) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 font-display">Documents requis</h1>
        <p className="text-slate-500 text-lg">Veuillez télécharger les pièces justificatives nécessaires pour votre dossier.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {((state.selectedFormalite?.required_documents as { id: string; label: string; description?: string }[]) || [
          { id: 'id_card', label: "Pièce d'identité du dirigeant", description: "CNI (recto/verso) ou Passeport en cours de validité" },
          { id: 'address_proof', label: "Justificatif de domicile", description: "Facture EDF, gaz ou téléphone de moins de 3 mois" },
          { id: 'statuts', label: "Projet de statuts", description: "Si vous en possédez déjà un, sinon nous les rédigerons" }
        ]).map((doc) => {
          const uploadedFile = state.documents[doc.id];
          
          return (
            <div key={doc.id} className={`bg-white border rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${uploadedFile ? 'border-green-200 bg-green-50/30' : 'border-slate-200 hover:border-primary/30'}`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${uploadedFile ? 'bg-green-100 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                  {uploadedFile ? <CheckCircle2 className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{doc.label}</h3>
                  <p className="text-sm text-slate-500 mt-1">{doc.description}</p>
                  {uploadedFile && (
                    <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {uploadedFile.name}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {uploadedFile ? (
                  <button 
                    onClick={() => handleRemoveFile(doc.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                ) : (
                  <label className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-100 transition-all border border-slate-200 cursor-pointer">
                    <Upload className="w-4 h-4" /> Parcourir
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(doc.id, file);
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
        <Info className="w-6 h-6 text-amber-600 shrink-0" />
        <div>
          <h4 className="font-bold text-amber-900">Note importante</h4>
          <p className="text-sm text-amber-800 mt-1">
            Tous les documents doivent être parfaitement lisibles. Les formats acceptés sont PDF, JPG et PNG.
            Taille maximale par fichier : 5 Mo.
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 font-display">Récapitulatif</h1>
        <p className="text-slate-500 text-lg">Vérifiez vos informations avant de passer au paiement.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">La formalité</h3>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="p-2 bg-white rounded-lg text-primary shadow-sm">
                  <Building2 size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{state.selectedFormalite?.name}</p>
                  <p className="text-xs text-slate-500">Réf: {state.reference}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Prix total</h3>
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <span className="text-slate-600 font-medium">Total à régler</span>
                <div className="text-right">
                  <span className="text-2xl font-black text-primary">{state.selectedFormalite?.price_ttc || ((state.selectedFormalite?.price_ht || 0) * 1.2).toFixed(2)}€ TTC</span>
                  <div className="text-xs text-slate-500 font-medium">Soit {state.selectedFormalite?.price_ht}€ HT</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Informations saisies</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Object.entries(state.formData).map(([key, value]) => (
                <div key={key}>
                  <p className="text-xs text-slate-400 capitalize">{key.replace(/_/g, ' ')}</p>
                  <p className="font-medium text-slate-800 mt-0.5">{String(value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 font-display">Paiement sécurisé</h1>
        <p className="text-slate-500 text-lg">Finalisez votre commande pour lancer le traitement de votre dossier.</p>
      </div>

      <div className="max-w-md mx-auto w-full">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-8 text-center border-b border-slate-100">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Règlement par carte</h3>
            <p className="text-slate-500 text-sm mt-1">Paiement 100% sécurisé via Stripe</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Service {state.selectedFormalite?.name}</span>
                <span className="font-medium text-slate-900">{state.selectedFormalite?.price_ht}€ HT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">TVA ({(state.selectedFormalite?.tva_rate || 0.2) * 100}%)</span>
                <span className="font-medium text-slate-900">{((state.selectedFormalite?.price_ht || 0) * (state.selectedFormalite?.tva_rate || 0.2)).toFixed(2)}€</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-900">Total TTC</span>
                <span className="text-2xl font-black text-primary">{state.selectedFormalite?.price_ttc || ((state.selectedFormalite?.price_ht || 0) * (1 + (state.selectedFormalite?.tva_rate || 0.2))).toFixed(2)}€</span>
              </div>
            </div>

            <button 
              onClick={handlePayment}
              disabled={state.isSaving}
              className="w-full py-4 bg-primary text-white font-black text-lg rounded-2xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0"
            >
              {state.isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CreditCard className="w-6 h-6" /> Payer maintenant</>}
            </button>

            <div className="flex items-center justify-center gap-4 opacity-50 grayscale">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoadingCatalogue || isLoadingDraft || isLoadingAuth) {
    return (
      <div className="h-full flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-slate-500 font-medium">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      {/* Step Indicator */}
      <div className="mb-16">
        <div className="flex items-center justify-between max-w-4xl mx-auto relative">
          {/* Progress Line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 -z-10" />
          <motion.div 
            className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 -z-10"
            initial={{ width: 0 }}
            animate={{ width: `${((state.currentStep - 1) / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />

          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = state.currentStep === step.id;
            const isCompleted = state.currentStep > step.id;

            return (
              <div key={step.id} className="flex flex-col items-center gap-3">
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: isActive || isCompleted ? '#2563eb' : '#ffffff',
                    borderColor: isActive || isCompleted ? '#2563eb' : '#e2e8f0',
                    color: isActive || isCompleted ? '#ffffff' : '#94a3b8',
                    scale: isActive ? 1.1 : 1,
                  }}
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center shadow-sm z-10 transition-colors`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> : <Icon className="w-5 h-5 md:w-6 md:h-6" />}
                </motion.div>
                <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={state.currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {state.currentStep === 1 && renderStep1()}
          {state.currentStep === 2 && renderStep2()}
          {state.currentStep === 3 && renderStep3()}
          {state.currentStep === 4 && renderStep4()}
          {state.currentStep === 5 && renderStep5()}
        </motion.div>
      </AnimatePresence>

      {state.currentStep > 1 && (
        <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 px-6 py-3 text-slate-500 font-bold hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Retour
          </button>
          
          <div className="flex items-center gap-4">
            {state.isSaving && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Sauvegarde...
              </span>
            )}
            {state.currentStep < 5 && (
              <button 
                onClick={handleNext}
                className="flex items-center gap-2 px-10 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all active:translate-y-0"
              >
                Continuer <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
