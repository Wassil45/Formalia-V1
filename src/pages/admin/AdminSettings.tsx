import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { uploadAsset } from '../../lib/storage';
import { toast } from 'sonner';
import { Save, Upload, Palette, Building2, FileText, X, Loader2 } from 'lucide-react';

const SETTINGS_FIELDS = [
  { key: 'company_name', label: 'Raison sociale', placeholder: 'Formalia SAS' },
  { key: 'siren', label: 'SIREN', placeholder: '123 456 789' },
  { key: 'capital', label: 'Capital social (€)', placeholder: '10 000' },
  { key: 'address', label: 'Adresse du siège', placeholder: '12 rue de la Paix, 75001 Paris' },
  { key: 'rcs_city', label: 'Ville du RCS', placeholder: 'Paris' },
  { key: 'tva_number', label: 'N° TVA intracommunautaire', placeholder: 'FR 12 123456789' },
  { key: 'email_contact', label: 'Email de contact', placeholder: 'contact@formalia.fr' },
  { key: 'email_dpo', label: 'Email DPO', placeholder: 'dpo@formalia.fr' },
  { key: 'phone_contact', label: 'Téléphone', placeholder: '01 23 45 67 89' },
  { key: 'director_name', label: 'Directeur de publication', placeholder: 'Jean Dupont' },
  { key: 'hosting_provider', label: 'Hébergeur', placeholder: 'Google Cloud Platform' },
];

export function AdminSettings() {
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  const [brandColor, setBrandColor] = useState('#6366F1');
  const [initialized, setInitialized] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('settings').select('*');
      if (error) throw error;
      const map = Object.fromEntries(((data as any[]) ?? []).map(s => [s.key, s.value]));
      if (!initialized) {
        setLocalSettings(map);
        setBrandColor(map.brand_color ?? '#6366F1');
        setInitialized(true);
      }
      return map;
    },
  });

  const saveSetting = async (key: string, value: string) => {
    const { error } = await supabase.from('settings').upsert({ key, value });
    if (error) throw error;
  };

  const saveAllSettings = useMutation({
    mutationFn: async () => {
      await Promise.all(
        Object.entries(localSettings).map(([key, value]) => saveSetting(key, value))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_settings'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success(`Paramètres sauvegardés: Mis à jour sur l\'ensemble du site`);
    },
    onError: (err: any) => toast.error(`Erreur: ${err.message}`),
  });

  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true);
    const result = await uploadAsset(file, `logo.${file.name.split('.').pop()}`);
    setLogoUploading(false);

    if (!result.success) {
      toast.error(`Erreur upload logo: ${result.error}`);
      return;
    }

    await saveSetting('logo_url', result.url!);
    setLocalSettings(prev => ({ ...prev, logo_url: result.url! }));
    queryClient.invalidateQueries({ queryKey: ['admin_settings'] });
    queryClient.invalidateQueries({ queryKey: ['settings'] });
    toast.success(`Logo mis à jour: Visible immédiatement sur le site`);
  };

  const handleBrandColorSave = async () => {
    await saveSetting('brand_color', brandColor);
    // Applique la couleur en live
    document.documentElement.style.setProperty('--color-primary', brandColor);
    queryClient.invalidateQueries({ queryKey: ['admin_settings'] });
    toast.success('Couleur mise à jour');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-4 md:px-8 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-slate-900">Paramètres</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Configuration globale du site
        </p>
      </header>

      <div className="p-4 md:p-8 max-w-3xl mx-auto w-full space-y-6">

        {/* Section Logo */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-50">
            <Upload className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-800">Logo et identité visuelle</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-6">
              {/* Prévisualisation du logo */}
              <div className="w-24 h-24 bg-slate-100 rounded-2xl border-2 border-dashed 
                border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {localSettings.logo_url ? (
                  <img src={localSettings.logo_url} alt="Logo" 
                    className="w-full h-full object-contain p-2" />
                ) : (
                  <span className="text-xs text-slate-400 text-center px-2">
                    Aucun logo
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-700 font-medium mb-1">Logo de l'entreprise</p>
                <p className="text-xs text-slate-400 mb-4">
                  PNG, JPG ou SVG. Max 5 Mo. Recommandé : 200×200px.
                  <br />Visible dans le header, les emails et les documents.
                </p>
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 
                    text-slate-700 rounded-xl text-sm font-medium 
                    hover:bg-slate-200 transition-all disabled:opacity-60"
                >
                  {logoUploading 
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Upload...</>
                    : <><Upload className="w-4 h-4" /> Changer le logo</>}
                </button>
                <input ref={logoInputRef} type="file" className="hidden"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={e => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
              </div>
            </div>
          </div>
        </div>

        {/* Section couleur */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-50">
            <Palette className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-800">Couleur principale</h2>
          </div>
          <div className="p-6 flex items-center gap-6">
            <div className="flex items-center gap-4">
              <input type="color" value={brandColor}
                onChange={e => setBrandColor(e.target.value)}
                className="w-14 h-14 rounded-2xl border-2 border-slate-200 cursor-pointer 
                  overflow-hidden p-1" />
              <div>
                <p className="text-sm font-medium text-slate-900">{brandColor}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Appliquée sur les boutons, liens et éléments interactifs
                </p>
              </div>
            </div>
            {/* Prévisualisation */}
            <div className="flex-1 flex items-center gap-3">
              <button style={{ backgroundColor: brandColor }}
                className="px-4 py-2 rounded-xl text-white text-sm font-semibold">
                Aperçu bouton
              </button>
            </div>
            <button onClick={handleBrandColorSave}
              className="flex items-center gap-2 px-4 py-2.5 gradient-primary text-white 
                rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all">
              <Save className="w-4 h-4" />
              Appliquer
            </button>
          </div>
        </div>

        {/* Section mentions légales */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-50">
            <FileText className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-800">Informations légales</h2>
            <span className="ml-auto text-xs text-slate-400">
              Utilisées dans les Mentions légales, CGV et emails
            </span>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SETTINGS_FIELDS.map(field => (
                  <div key={field.key}>
                    <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                      {field.label}
                    </label>
                    <input
                      value={localSettings[field.key] ?? ''}
                      onChange={e => setLocalSettings(prev => ({ 
                        ...prev, [field.key]: e.target.value 
                      }))}
                      placeholder={field.placeholder}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 
                        rounded-xl focus:outline-none focus:border-primary 
                        focus:ring-2 focus:ring-primary/10 transition-all bg-slate-50 
                        focus:bg-white"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex justify-end">
            <button
              onClick={() => saveAllSettings.mutate()}
              disabled={saveAllSettings.isPending}
              className="flex items-center justify-center gap-2 px-6 py-3 gradient-primary text-white 
                rounded-xl text-sm font-bold shadow-md shadow-primary/20 w-full sm:w-auto
                hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saveAllSettings.isPending ? 'Sauvegarde...' : 'Sauvegarder tout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
