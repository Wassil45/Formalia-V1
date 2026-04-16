import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { 
  Mail, Edit, Eye, EyeOff, X, Save, 
  Variable, Info, CheckCircle2
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  subject: string;
  body_html: string;
  body_text?: string;
  variables: string[];
  is_active: boolean;
}

function TemplateEditor({ 
  template, onClose 
}: { 
  template: EmailTemplate; onClose: () => void 
}) {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState(template.subject);
  const [bodyHtml, setBodyHtml] = useState(template.body_html);
  const [preview, setPreview] = useState(false);
  const variables = Array.isArray(template.variables) ? template.variables : [];
  
  const [testValues, setTestValues] = useState<Record<string, string>>(
    Object.fromEntries(variables.map(v => [v, `[${v}]`]))
  );

  const updateTemplate = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from('email_templates')
        .update({ 
          subject, 
          body_html: bodyHtml,
          updated_at: new Date().toISOString()
        })
        .eq('id', template.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_templates'] });
      toast.success(`Modèle sauvegardé: ${template.name}`);
      onClose();
    },
    onError: (err: any) => toast.error(`Erreur: ${err.message}`),
  });

  // Prévisualisation : remplace les variables par les valeurs de test
  const previewSubject = variables.reduce(
    (s, v) => s.replace(new RegExp(`{{${v}}}`, 'g'), testValues[v] || `[${v}]`), subject
  );
  const previewBody = variables.reduce(
    (s, v) => s.replace(new RegExp(`{{${v}}}`, 'g'), testValues[v] || `[${v}]`), bodyHtml
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl 
        max-h-[90vh] flex flex-col animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900">{template.name}</h2>
            <code className="text-xs text-slate-400 font-mono">{template.slug}</code>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreview(!preview)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm 
                font-medium transition-all ${
                preview 
                  ? 'bg-primary text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {preview ? <><EyeOff className="w-4 h-4" /> Éditer</> 
                : <><Eye className="w-4 h-4" /> Prévisualiser</>}
            </button>
            <button onClick={onClose} 
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          
          {/* Éditeur / Prévisualisation */}
          <div className="flex-1 overflow-y-auto p-6">
            {preview ? (
              // Mode prévisualisation
              <div className="max-w-lg mx-auto">
                <div className="bg-slate-50 rounded-xl p-4 mb-4">
                  <p className="text-xs text-slate-400 mb-1">Objet :</p>
                  <p className="font-semibold text-slate-900">{previewSubject}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-900 px-4 py-3">
                    <p className="text-xs text-slate-400">Aperçu du corps de l'email</p>
                  </div>
                  <div 
                    className="p-6 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: previewBody }}
                  />
                </div>
              </div>
            ) : (
              // Mode édition
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    Objet de l'email
                  </label>
                  <input
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 
                      text-sm focus:outline-none focus:border-primary 
                      focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Corps (HTML)
                    </label>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Info className="w-3.5 h-3.5" />
                      Utilisez {'{{variable}}'} pour les variables
                    </div>
                  </div>
                  <textarea
                    value={bodyHtml}
                    onChange={e => setBodyHtml(e.target.value)}
                    rows={16}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 
                      text-sm font-mono focus:outline-none focus:border-primary 
                      focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Panel latéral : variables */}
          <div className="w-64 border-l border-slate-100 p-4 overflow-y-auto bg-slate-50">
            <div className="flex items-center gap-2 mb-4">
              <Variable className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700">Variables</h3>
            </div>
            <div className="space-y-3">
              {variables.map(variable => (
                <div key={variable}>
                  <div className="flex items-center justify-between mb-1">
                    <code className="text-xs font-mono text-primary bg-primary/8 
                      px-2 py-0.5 rounded-lg">
                      {`{{${variable}}}`}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        setSubject(s => s + `{{${variable}}}`);
                      }}
                      className="text-[10px] text-slate-400 hover:text-primary transition-colors"
                    >
                      + Insérer
                    </button>
                  </div>
                  {preview && (
                    <input
                      value={testValues[variable] ?? ''}
                      onChange={e => setTestValues(v => ({ ...v, [variable]: e.target.value }))}
                      placeholder={`Valeur de test`}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 
                        rounded-lg focus:outline-none focus:border-primary transition-all bg-white"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose}
            className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm 
              font-medium text-slate-600 hover:bg-slate-50 transition-all">
            Annuler
          </button>
          <button
            onClick={() => updateTemplate.mutate()}
            disabled={updateTemplate.isPending}
            className="flex items-center gap-2 px-6 py-2.5 gradient-primary text-white 
              rounded-xl text-sm font-bold shadow-md shadow-primary/20 
              hover:shadow-lg transition-all disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {updateTemplate.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminEmails() {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['email_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at');
      if (error) throw error;
      
      return (data ?? []).map((t: any) => {
        let parsedVariables: string[] = [];
        if (Array.isArray(t.variables)) {
          parsedVariables = t.variables;
        } else if (typeof t.variables === 'string') {
          try {
            parsedVariables = JSON.parse(t.variables);
          } catch (e) {
            parsedVariables = [];
          }
        }
        return {
          ...t,
          variables: parsedVariables
        };
      }) as EmailTemplate[];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any)
        .from('email_templates').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email_templates'] });
      toast.success('Modèle mis à jour');
    }
  });

  const TRIGGER_LABELS: Record<string, string> = {
    dossier_created: 'Création de dossier',
    documents_required: 'Documents manquants',
    dossier_processing: 'Dossier en traitement',
    dossier_completed: 'Dossier terminé',
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-4 md:px-8 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-slate-900">Modèles d'emails</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Personnalisez les emails automatiques envoyés aux clients
        </p>
      </header>

      <div className="p-4 md:p-8 max-w-4xl mx-auto w-full space-y-4">
        
        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 
          rounded-2xl text-sm text-blue-700">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Variables dynamiques</p>
            <p className="text-blue-600 mt-0.5">
              Utilisez {'{{nom_variable}}'} dans vos modèles. 
              Les variables disponibles sont listées dans chaque éditeur.
            </p>
          </div>
        </div>

        {/* Liste des templates */}
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 
                animate-pulse flex gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          templates?.map(template => (
            <div key={template.id} 
              className="bg-white rounded-2xl border border-slate-100 shadow-sm 
                hover:shadow-md transition-all p-5">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center 
                  flex-shrink-0 ${template.is_active ? 'bg-primary/8' : 'bg-slate-100'}`}>
                  <Mail className={`w-5 h-5 ${template.is_active ? 'text-primary' : 'text-slate-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{template.name}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      template.is_active 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {template.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5 truncate">{template.subject}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {template.variables.map(v => (
                      <code key={v} className="text-[10px] font-mono bg-slate-100 
                        text-slate-600 px-1.5 py-0.5 rounded">
                        {`{{${v}}}`}
                      </code>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleActive.mutate({ 
                      id: template.id, is_active: !template.is_active 
                    })}
                    className={`p-2 rounded-xl transition-all ${
                      template.is_active 
                        ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' 
                        : 'text-slate-400 bg-slate-100 hover:bg-slate-200'
                    }`}
                    title={template.is_active ? 'Désactiver' : 'Activer'}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedTemplate(template)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 
                      text-slate-700 rounded-xl text-sm font-medium 
                      hover:bg-slate-200 transition-all"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Éditer
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedTemplate && (
        <TemplateEditor 
          template={selectedTemplate} 
          onClose={() => setSelectedTemplate(null)} 
        />
      )}
    </div>
  );
}
