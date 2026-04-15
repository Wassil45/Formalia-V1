import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { getDocumentUrl } from '../../lib/storage';
import { useAuth } from '../../context/AuthContext';
import { FileText, Download, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';

export function ClientDocuments() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: dossiers, isLoading } = useQuery({
    queryKey: ['client_documents', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossiers')
        .select(`
          id,
          reference,
          form_data,
          formalites_catalogue (name)
        `)
        .eq('client_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Extract all documents from all dossiers
  const allDocuments = dossiers?.flatMap(dossier => {
    const docs = (dossier.form_data as Record<string, unknown>)?._documents as Record<string, { name: string; url: string; uploadedAt?: string }> || {};
    return Object.entries(docs).map(([key, doc]) => ({
      ...doc,
      dossierId: dossier.id,
      dossierReference: dossier.reference,
      formaliteName: dossier.formalites_catalogue?.name,
      documentType: key
    }));
  }) || [];

  const handleDownload = async (url: string) => {
    try {
      const signedUrl = await getDocumentUrl(url);
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast('error', 'Erreur', 'Impossible d\'ouvrir le document');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">Documents</h1>
          <p className="text-slate-500 mt-1">Retrouvez tous vos documents officiels (Kbis, statuts, etc.).</p>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : allDocuments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Aucun document</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            Vos documents générés seront disponibles ici une fois vos formalités terminées.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allDocuments.map((doc, index) => (
            <div key={`${doc.dossierId}-${index}`} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col gap-4 hover:border-primary/50 transition-colors group">
              <div className="flex items-start justify-between gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <button 
                  onClick={() => handleDownload(doc.url)}
                  className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  title="Télécharger"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
              
              <div>
                <h3 className="font-bold text-slate-900 truncate" title={doc.name}>{doc.name}</h3>
                <p className="text-sm text-slate-500 capitalize">{doc.documentType.replace(/_/g, ' ')}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">Dossier</span>
                  <span className="text-sm font-medium text-slate-700 font-mono">{doc.dossierReference}</span>
                </div>
                <Link 
                  to={`/dashboard/dossiers/${doc.dossierId}`}
                  className="text-primary hover:underline text-sm font-medium flex items-center gap-1"
                >
                  Voir <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
