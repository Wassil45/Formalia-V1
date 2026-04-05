import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWizard } from '../../context/WizardContext';
import { useToast } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { 
  UploadCloud, File, CheckCircle2, X, AlertTriangle, 
  ArrowLeft, ArrowRight, Loader2 
} from 'lucide-react';

import { uploadDocument } from '../../lib/storage';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo

const REQUIRED_DOCS = [
  { id: 'identite', label: "Pièce d'identité du dirigeant", hint: 'CNI, passeport ou titre de séjour' },
  { id: 'domicile', label: 'Justificatif de domicile', hint: 'Facture de moins de 3 mois' },
];

export function WizardStep3() {
  const navigate = useNavigate();
  const { data: wizardData, addDocument, removeDocument, canProceedToStep } = useWizard();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState<string[]>([]);

  useEffect(() => {
    if (!canProceedToStep(3)) navigate('/formalite/etape-2');
  }, []);

  const uploadFile = async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast('error', 'Format non supporté', 'Utilisez PDF, JPG, PNG ou WebP');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast('error', 'Fichier trop volumineux', `${file.name} dépasse 10 Mo`);
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
      toast('error', 'Erreur d\'upload', result.error ?? 'Erreur inconnue');
      return;
    }

    addDocument({
      id: fileId,
      name: file.name,
      url: result.url!,
      size: file.size,
      type: file.type,
    });
    toast('success', 'Document ajouté', file.name);
  };

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach(uploadFile);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
  };

  const canContinue = wizardData.documents.length > 0 && uploading.length === 0;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Documents justificatifs
        </h1>
        <p className="text-slate-500">
          Téléchargez les pièces requises pour votre dossier.
        </p>
      </div>

      {/* Documents requis */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6">
        <p className="text-xs font-semibold text-amber-700 mb-2 uppercase tracking-wide">
          Documents requis
        </p>
        <div className="space-y-1">
          {REQUIRED_DOCS.map(doc => (
            <div key={doc.id} className="flex items-start gap-2">
              <div className="w-4 h-4 mt-0.5 rounded-full border-2 border-amber-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-900">{doc.label}</p>
                <p className="text-xs text-amber-600">{doc.hint}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zone de drop */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { 
          e.preventDefault(); setIsDragging(false); 
          handleFiles(e.dataTransfer.files); 
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10
          flex flex-col items-center justify-center gap-3 text-center transition-all
          ${isDragging 
            ? 'border-primary bg-primary/5 scale-[1.01]' 
            : 'border-slate-200 bg-white hover:border-primary/40 hover:bg-slate-50/50'
          }`}
      >
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all
          ${isDragging ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
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
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Liste des fichiers */}
      {(wizardData.documents.length > 0 || uploading.length > 0) && (
        <div className="mt-4 space-y-2">
          {uploading.map(id => (
            <div key={id} className="flex items-center gap-3 p-3 bg-white rounded-xl 
              border border-slate-100 shadow-sm">
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
            <div key={doc.id} className="flex items-center gap-3 p-3 bg-white rounded-xl 
              border border-emerald-100 shadow-sm animate-scale-in">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center 
                justify-center flex-shrink-0">
                <File className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{doc.name}</p>
                <p className="text-xs text-slate-400">{formatSize(doc.size)}</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <button
                onClick={(e) => { e.stopPropagation(); removeDocument(doc.id); }}
                className="p-1 rounded-lg hover:bg-red-50 text-slate-400 
                  hover:text-red-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
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
          onClick={() => canContinue && navigate('/formalite/paiement')}
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
