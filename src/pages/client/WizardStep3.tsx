import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWizard } from '../../context/WizardContext';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { 
  UploadCloud, File, CheckCircle2, X, AlertTriangle, 
  ArrowLeft, ArrowRight, Loader2 
} from 'lucide-react';

import { uploadDocument } from '../../lib/storage';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo

export function WizardStep3() {
  const navigate = useNavigate();
  const { data: wizardData, addDocument, removeDocument, canProceedToStep } = useWizard();
  const { user } = useAuth();
  const [uploading, setUploading] = useState<string[]>([]);
  
  // Custom states for the global dropzone fallback
  const globalFileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);

  useEffect(() => {
    if (!canProceedToStep(3)) navigate('/formalite/etape-2');
  }, [canProceedToStep, navigate]);

  // Fetch formalite to get required_documents
  const { data: formalite, isLoading } = useQuery({
    queryKey: ['formalite_docs', wizardData.formaliteId],
    enabled: !!wizardData.formaliteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formalites_catalogue')
        .select('required_documents')
        .eq('id', wizardData.formaliteId)
        .single();
      if (error) throw error;
      return data;
    }
  });

  const requiredDocs = (formalite?.required_documents as any)?.docs || [];
  const hasSpecificDocs = requiredDocs.length > 0;

  const uploadFile = async (file: File, requiredDocId?: string) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Format non supporté: Utilisez PDF, JPG, PNG ou WebP');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error(`Fichier trop volumineux: ${file.name} dépasse 10 Mo`);
      return;
    }

    const fileId = Math.random().toString(36).slice(2, 9);
    setUploading(prev => [...prev, fileId]);

    const result = await uploadDocument(
      file, 
      user?.id ?? 'demo', 
      wizardData.formaliteId ?? 'demo',
      fileId
    );

    setUploading(prev => prev.filter(id => id !== fileId));

    if (!result.success) {
      toast.error(`Erreur d'upload: ${result.error ?? 'Erreur inconnue'}`);
      return;
    }

    addDocument({
      id: fileId,
      requiredDocId,
      name: file.name,
      url: result.url!,
      size: file.size,
      type: file.type,
    });
    toast.success(`Document ajouté: ${file.name}`);
  };

  const handleGlobalFiles = (files: FileList) => {
    Array.from(files).forEach(f => uploadFile(f));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
  };

  const requiredDocIds = requiredDocs.map((d: any) => d.id);
  const uploadedRequiredDocIds = wizardData.documents.map(d => d.requiredDocId).filter(Boolean);
  const missingDocs = requiredDocIds.filter(id => !uploadedRequiredDocIds.includes(id));
  
  // If specific docs are required, all must be uploaded. Otherwise, at least 1 global doc is needed for a start (or allow passing if no required docs? Let's say at least 1 doc is needed if hasn't specific. Or maybe if no specific docs, any one is fine)
  const canContinue = hasSpecificDocs 
    ? missingDocs.length === 0 && uploading.length === 0
    : wizardData.documents.length > 0 && uploading.length === 0;

  const handleContinue = async () => {
    if (!canContinue) return;
    
    try {
      if (wizardData.dossierId) {
        await supabase
          .from('dossiers')
          .update({
            form_data: {
              companyInfo: wizardData.companyInfo,
              documents: wizardData.documents,
            } as any,
          })
          .eq('id', wizardData.dossierId);
      }
    } catch (err) {
      console.error('Failed to save draft', err);
    }

    navigate('/formalite/paiement');
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Pièces justificatives
        </h1>
        <p className="text-slate-500">
          Fournissez les documents nécessaires à la réalisation de votre formalité.
        </p>
      </div>

      {hasSpecificDocs ? (
        <div className="space-y-4 mb-6">
          {requiredDocs.map((docDef: any) => {
            const uploadedDoc = wizardData.documents.find(d => d.requiredDocId === docDef.id);
            
            return (
              <div key={docDef.id} className={`p-5 rounded-2xl border-2 transition-all ${
                uploadedDoc ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-white'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                      {uploadedDoc ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <div className="w-4 h-4 ml-0.5 rounded-full border-2 border-slate-300" />}
                      {docDef.label} <span className="text-red-400">*</span>
                    </h3>
                    {docDef.hint && (
                      <p className="text-xs text-slate-500 ml-6">{docDef.hint}</p>
                    )}
                  </div>

                  <div className="md:w-1/3 flex-shrink-0">
                    {uploadedDoc ? (
                      <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-emerald-100 shadow-sm">
                        <File className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{uploadedDoc.name}</p>
                          <p className="text-[10px] text-slate-400">{formatSize(uploadedDoc.size)}</p>
                        </div>
                        <button
                          onClick={() => removeDocument(uploadedDoc.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-primary/30 text-sm font-medium text-slate-700 cursor-pointer transition-all">
                        <UploadCloud className="w-4 h-4 text-primary" />
                        Importer fichier
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              uploadFile(e.target.files[0], docDef.id);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          {/* Fallback global dropzone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDraggingGlobal(true); }}
            onDragLeave={() => setIsDraggingGlobal(false)}
            onDrop={e => { 
              e.preventDefault(); setIsDraggingGlobal(false); 
              handleGlobalFiles(e.dataTransfer.files); 
            }}
            onClick={() => globalFileInputRef.current?.click()}
            className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10
              flex flex-col items-center justify-center gap-3 text-center transition-all
              ${isDraggingGlobal 
                ? 'border-primary bg-primary/5 scale-[1.01]' 
                : 'border-slate-200 bg-white hover:border-primary/40 hover:bg-slate-50/50'
              }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all
              ${isDraggingGlobal ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
              <UploadCloud className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Glissez vos fichiers ici
              </p>
              <p className="text-xs text-slate-400 mt-1">
                ou <span className="text-primary font-medium">parcourez</span> vos fichiers
              </p>
              <p className="text-xs text-slate-400 mt-2">PDF, JPG, PNG — Max 10 Mo par fichier</p>
            </div>
            <input
              ref={globalFileInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={e => e.target.files && handleGlobalFiles(e.target.files)}
            />
          </div>

          {/* Liste des fichiers (global) */}
          {(wizardData.documents.length > 0 || uploading.length > 0) && (
            <div className="mt-4 space-y-2">
              {uploading.map(id => (
                <div key={id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary/30 rounded-full shimmer w-2/3" />
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">Upload...</span>
                </div>
              ))}

              {wizardData.documents.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-emerald-100 shadow-sm animate-scale-in">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <File className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{doc.name}</p>
                    <p className="text-xs text-slate-400">{formatSize(doc.size)}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <button
                    onClick={(e) => { e.stopPropagation(); removeDocument(doc.id); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Ajout des documents supplémentaires (pour custom form) */}
      {hasSpecificDocs && (
        <div className="mt-8 pt-6 border-t border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800 mb-3 block">Autres documents (optionnels)</h3>
          
          <div className="space-y-2">
            {/* Déjà uploadés */}
            {wizardData.documents.filter(d => !d.requiredDocId).map(doc => (
              <div key={doc.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm animate-scale-in">
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <File className="w-4 h-4 text-slate-400 flex-shrink-0 ml-1" />
                  <div>
                    <p className="text-sm font-medium text-slate-700 truncate">{doc.name}</p>
                    <p className="text-xs text-slate-400">{formatSize(doc.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeDocument(doc.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            
            {uploading.map(id => (
              <div key={id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary/30 rounded-full shimmer w-2/3" />
                  </div>
                </div>
                <span className="text-xs text-slate-400">Upload...</span>
              </div>
            ))}
          </div>

          <label className="mt-3 flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-sm font-medium text-slate-500 hover:border-primary/40 hover:bg-primary/5 hover:text-primary cursor-pointer transition-all">
            <UploadCloud className="w-4 h-4" />
            Ajouter un document libre
            <input
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={e => e.target.files && handleGlobalFiles(e.target.files)}
            />
          </label>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
        <button 
          onClick={() => navigate('/formalite/etape-2')}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium 
            text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold 
            text-white transition-all ${
            canContinue 
              ? 'gradient-primary shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5' 
              : 'bg-slate-200 cursor-not-allowed text-slate-400'
          }`}
        >
          {uploading.length > 0 ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Upload en cours...</>
          ) : (
            <><span>Continuer</span><ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </div>
  );
}
